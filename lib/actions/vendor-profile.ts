"use server";

import { getStore } from "@/lib/store";
import type { UpdateVendorInput, Vendor } from "@/lib/types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

export async function updateVendorProfile(
  ownerToken: string,
  vendorSlug: string,
  input: UpdateVendorInput
): Promise<Vendor> {
  await assertOwnerToken(vendorSlug, ownerToken);

  const payload: UpdateVendorInput = {
    ...(input.tagline !== undefined
      ? { tagline: input.tagline.trim() || undefined }
      : {}),
    ...(input.location !== undefined
      ? { location: input.location.trim() || undefined }
      : {}),
    ...(input.deliveryTime !== undefined
      ? { deliveryTime: input.deliveryTime.trim() || undefined }
      : {}),
    ...(input.rating !== undefined ? { rating: input.rating } : {}),
  };

  const updated = await getStore().updateVendor(vendorSlug, payload);
  if (!updated) {
    throw new Error("Vendor not found");
  }
  return updated;
}
