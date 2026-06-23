"use server";

import { getStore } from "@/lib/store";
import {
  deriveOnboardingState,
  type OnboardingChecklist,
} from "@/lib/vendor/onboarding";

/** Bundles checklist booleans from Store reads in one round trip. */
export async function loadOnboardingState(
  vendorSlug: string
): Promise<OnboardingChecklist> {
  const store = getStore();
  const [menu, kitchenOpen, orders] = await Promise.all([
    store.getMenu(vendorSlug),
    store.isKitchenOpen(vendorSlug),
    store.listOrders(vendorSlug),
  ]);
  return deriveOnboardingState(menu, kitchenOpen, orders);
}
