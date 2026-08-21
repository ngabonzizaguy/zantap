"use server";

import { getStore } from "@/lib/store";
import type { VendorUpdateOverview } from "@/lib/vendor-updates/types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

// NOTE: export only async Server Actions (AGENTS.md).

export async function loadVendorUpdateOverview(
  vendorSlug: string
): Promise<VendorUpdateOverview | null> {
  return getStore().getVendorUpdateOverview(vendorSlug);
}

export async function setVendorUpdatesEnabled(
  ownerToken: string,
  vendorSlug: string,
  enabled: boolean
): Promise<VendorUpdateOverview | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  const store = getStore();
  await store.setVendorUpdatesEnabled(vendorSlug, enabled);
  return store.getVendorUpdateOverview(vendorSlug);
}
