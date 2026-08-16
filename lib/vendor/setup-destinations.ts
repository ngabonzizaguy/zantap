import type { KdsTab } from "@/components/vendor/Tabs";
import type { OnboardingChecklist } from "@/lib/vendor/onboarding";
import type { OptionalChecklistItemId } from "@/lib/vendor/optional-checklist";

export type SetupDestination =
  | { kind: "tab"; tab: KdsTab }
  | { kind: "open-kitchen" }
  | { kind: "anchor"; anchorId: string };

const ONBOARDING_DESTINATIONS: Record<
  keyof OnboardingChecklist,
  SetupDestination
> = {
  hasMenuItem: { kind: "tab", tab: "menu" },
  hasPhoto: { kind: "tab", tab: "menu" },
  kitchenOpen: { kind: "open-kitchen" },
  hasFirstOrder: { kind: "tab", tab: "orders" },
  hasDispatch: { kind: "tab", tab: "orders" },
};

const OPTIONAL_DESTINATIONS: Partial<
  Record<OptionalChecklistItemId, SetupDestination>
> = {
  logo: { kind: "anchor", anchorId: "setup-logo-editor" },
  cover: { kind: "anchor", anchorId: "setup-cover-editor" },
  menuPhotos: { kind: "tab", tab: "menu" },
  description: { kind: "anchor", anchorId: "vendor-description" },
};

export function getOnboardingDestination(
  id: keyof OnboardingChecklist
): SetupDestination {
  return ONBOARDING_DESTINATIONS[id];
}
export function getOptionalDestination(
  id: OptionalChecklistItemId
): SetupDestination | null {
  return OPTIONAL_DESTINATIONS[id] ?? null;
}
