import type { MenuItem, Vendor } from "@/lib/types";

/**
 * The post-launch OPTIONAL "keep improving your storefront" checklist
 * (candidate #16, Issue 4). Separate from the getting-started checklist in
 * `onboarding.ts` (ONBOARDING_STEPS) — this surfaces AFTER a vendor is live and
 * only nudges polish, never blocks orders.
 *
 * Scope this pass (grill decision 6): wire the three core Vendor fields that
 * already exist in the schema (`logoUrl`, `coverImageUrl`, `description`) plus
 * the existing Menu-photo gallery. The remaining rows from the mockup are a
 * follow-up epic and render as `comingSoon` (disabled, excluded from progress),
 * so the counter only ever reflects genuinely completable items.
 */

export type OptionalChecklistItemId =
  | "logo"
  | "cover"
  | "businessHours"
  | "menuPhotos"
  | "ingredients"
  | "deliveryZones"
  | "prepTime"
  | "description"
  | "socialLinks";

export interface OptionalChecklistItem {
  id: OptionalChecklistItemId;
  label: string;
  hint: string;
  /**
   * Deferred to a follow-up epic (no editor exists yet). Rendered disabled with
   * a "Soon" badge and excluded from the progress count so vendors can reach
   * 100% with the fields shippable this pass.
   */
  comingSoon: boolean;
}

/** Mockup order (design-assets/UI-screens/KDS-onboarding-optional-checklist.png). */
export const OPTIONAL_CHECKLIST_ITEMS: OptionalChecklistItem[] = [
  {
    id: "logo",
    label: "Add logo",
    hint: "Helps build your brand.",
    comingSoon: false,
  },
  {
    id: "cover",
    label: "Restaurant cover",
    hint: "Show off your place.",
    comingSoon: false,
  },
  {
    id: "businessHours",
    label: "Business hours",
    hint: "Let customers know when you're open.",
    comingSoon: true,
  },
  {
    id: "menuPhotos",
    label: "Menu photos",
    hint: "Great photos sell more — add them from the Menu tab.",
    comingSoon: false,
  },
  {
    id: "ingredients",
    label: "Ingredients",
    hint: "Help customers choose.",
    comingSoon: true,
  },
  {
    id: "deliveryZones",
    label: "Delivery zones",
    hint: "Where do you deliver?",
    comingSoon: true,
  },
  {
    id: "prepTime",
    label: "Estimated prep time",
    hint: "Set accurate expectations.",
    comingSoon: true,
  },
  {
    id: "description",
    label: "Business description",
    hint: "Tell your story.",
    comingSoon: false,
  },
  {
    id: "socialLinks",
    label: "Social links",
    hint: "Connect your social profiles.",
    comingSoon: true,
  },
];

export type OptionalChecklistState = Record<OptionalChecklistItemId, boolean>;

/**
 * Pure derivation — safe on client (snapshot) and server. Completion for
 * `comingSoon` rows is always `false` (no editor yet); the actionable rows read
 * from the persisted Vendor fields and the hydrated menu.
 */
export function deriveOptionalChecklist(
  vendor: Pick<Vendor, "logoUrl" | "coverImageUrl" | "description">,
  menu: MenuItem[]
): OptionalChecklistState {
  const hasMenuPhoto = menu.some((item) => (item.images?.length ?? 0) > 0);
  return {
    logo: Boolean(vendor.logoUrl?.trim()),
    cover: Boolean(vendor.coverImageUrl?.trim()),
    businessHours: false,
    menuPhotos: hasMenuPhoto,
    ingredients: false,
    deliveryZones: false,
    prepTime: false,
    description: Boolean(vendor.description?.trim()),
    socialLinks: false,
  };
}

/**
 * Progress reflects only actionable (non-`comingSoon`) items so a vendor can
 * legitimately reach `total of total`.
 */
export function countOptionalCompleted(state: OptionalChecklistState): {
  completed: number;
  total: number;
} {
  const actionable = OPTIONAL_CHECKLIST_ITEMS.filter((item) => !item.comingSoon);
  return {
    completed: actionable.filter((item) => state[item.id]).length,
    total: actionable.length,
  };
}
