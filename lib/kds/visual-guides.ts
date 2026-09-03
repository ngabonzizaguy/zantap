import { validateVendorPayout } from "@/lib/momo/ussd-dial";
import type { MenuItem, Vendor } from "@/lib/types";

export const KDS_READINESS_ITEMS = [
  { id: "storefront", label: "Storefront details" },
  { id: "menu", label: "Available menu" },
  { id: "payment", label: "Payment setup" },
  { id: "kitchen", label: "Kitchen status" },
] as const;

export type KdsReadinessItemId = (typeof KDS_READINESS_ITEMS)[number]["id"];
export type ReadinessGuideChoice = "guided" | "self";
export type KdsReadinessTarget =
  | "storefront-logo"
  | "storefront-cover"
  | "storefront-description"
  | "storefront-location"
  | "storefront-phone"
  | "menu-add"
  | "payment-setup"
  | "kitchen-toggle";

export interface VisualGuideStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface KdsReadinessItem {
  id: KdsReadinessItemId;
  label: string;
  complete: boolean;
  detail: string;
  actionLabel?: "Show me where";
  remainingCount: number;
  target?: KdsReadinessTarget;
}

export interface KdsReadiness {
  items: readonly KdsReadinessItem[];
  completedCount: number;
  isReady: boolean;
}

export interface StorefrontReadinessValues {
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
  location?: string;
  phoneNumber?: string;
}

export interface StorefrontReadinessStep {
  detail: string;
  target: Extract<KdsReadinessTarget, `storefront-${string}`>;
}

export function deriveMissingStorefrontReadiness(
  values: StorefrontReadinessValues
): StorefrontReadinessStep[] {
  return [
    !values.logoUrl?.trim()
      ? { detail: "Add your logo", target: "storefront-logo" as const }
      : null,
    !values.coverImageUrl?.trim()
      ? { detail: "Add a cover photo", target: "storefront-cover" as const }
      : null,
    !values.description?.trim()
      ? {
          detail: "Add your business description",
          target: "storefront-description" as const,
        }
      : null,
    !values.location?.trim()
      ? { detail: "Add your location", target: "storefront-location" as const }
      : null,
    !values.phoneNumber?.trim()
      ? { detail: "Add your phone number", target: "storefront-phone" as const }
      : null,
  ].filter((step) => step !== null);
}

interface ReadinessGuidePreference {
  choice?: ReadinessGuideChoice;
  dismissals: number;
}

export function deriveKdsReadiness({
  vendor,
  menu,
  kitchenOpen,
}: {
  vendor: Vendor;
  menu: readonly MenuItem[];
  kitchenOpen: boolean;
}): KdsReadiness {
  const storefrontMissingRequirements = deriveMissingStorefrontReadiness(vendor);
  const storefrontMissing = storefrontMissingRequirements[0];
  const menuReady = menu.some((item) => item.isAvailable && !item.archivedAt);
  const paymentReady = validateVendorPayout(vendor).ok;
  const state: Record<KdsReadinessItemId, boolean> = {
    storefront: !storefrontMissing,
    menu: menuReady,
    payment: paymentReady,
    kitchen: kitchenOpen,
  };
  const incompleteDetails: Record<
    KdsReadinessItemId,
    { detail: string; target: KdsReadinessTarget } | undefined
  > = {
    storefront: storefrontMissing ?? undefined,
    menu: menuReady
      ? undefined
      : { detail: "No available dishes", target: "menu-add" },
    payment: paymentReady
      ? undefined
      : { detail: "Choose where payments go", target: "payment-setup" },
    kitchen: kitchenOpen
      ? undefined
      : { detail: "Open your kitchen", target: "kitchen-toggle" },
  };
  const items = KDS_READINESS_ITEMS.map((item) => {
    const complete = state[item.id];
    const incomplete = incompleteDetails[item.id];
    return {
      ...item,
      complete,
      detail: complete ? "Complete" : incomplete!.detail,
      remainingCount:
        item.id === "storefront" ? storefrontMissingRequirements.length : complete ? 0 : 1,
      ...(!complete
        ? { actionLabel: "Show me where" as const, target: incomplete!.target }
        : {}),
    };
  });
  const completedCount = items.filter((item) => item.complete).length;

  return {
    items,
    completedCount,
    isReady: completedCount === items.length,
  };
}

export function readinessGuideStorageKey(vendorSlug: string): string {
  return `zantap:kds-readiness-guide:v1:${encodeURIComponent(vendorSlug)}`;
}

function readReadinessGuidePreference(
  storage: Pick<VisualGuideStorage, "getItem">,
  vendorSlug: string
): ReadinessGuidePreference {
  const raw = storage.getItem(readinessGuideStorageKey(vendorSlug));
  if (!raw) return { dismissals: 0 };

  try {
    const value = JSON.parse(raw) as Partial<ReadinessGuidePreference>;
    const choice =
      value.choice === "guided" || value.choice === "self"
        ? value.choice
        : undefined;
    const dismissals =
      typeof value.dismissals === "number" && value.dismissals >= 0
        ? Math.min(2, Math.trunc(value.dismissals))
        : 0;
    return { choice, dismissals };
  } catch {
    return { dismissals: 0 };
  }
}

export function shouldAutoShowReadinessGuide(
  storage: Pick<VisualGuideStorage, "getItem">,
  vendorSlug: string,
  readiness: KdsReadiness
): boolean {
  if (readiness.isReady) return false;
  const preference = readReadinessGuidePreference(storage, vendorSlug);
  return !preference.choice && preference.dismissals < 2;
}

export function recordReadinessGuideChoice(
  storage: Pick<VisualGuideStorage, "setItem">,
  vendorSlug: string,
  choice: ReadinessGuideChoice
): void {
  storage.setItem(
    readinessGuideStorageKey(vendorSlug),
    JSON.stringify({ choice, dismissals: 0 })
  );
}

export function recordReadinessGuideDismissal(
  storage: VisualGuideStorage,
  vendorSlug: string
): number {
  const preference = readReadinessGuidePreference(storage, vendorSlug);
  const dismissals = Math.min(2, preference.dismissals + 1);
  storage.setItem(
    readinessGuideStorageKey(vendorSlug),
    JSON.stringify({ ...preference, dismissals })
  );
  return dismissals;
}
