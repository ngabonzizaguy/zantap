"use server";

import { putBrandingBlob } from "@/lib/menu/blob-storage";
import {
  buildBrandingBlobPathname,
  validateMenuImageFile,
} from "@/lib/menu/media";
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
    ...(input.logoUrl !== undefined
      ? { logoUrl: input.logoUrl.trim() || undefined }
      : {}),
    ...(input.coverImageUrl !== undefined
      ? { coverImageUrl: input.coverImageUrl.trim() || undefined }
      : {}),
    ...(input.description !== undefined
      ? { description: input.description.trim() || undefined }
      : {}),
  };

  const updated = await getStore().updateVendor(vendorSlug, payload);
  if (!updated) {
    throw new Error("Vendor not found");
  }
  return updated;
}

export async function uploadBrandingImage(
  ownerToken: string,
  vendorSlug: string,
  field: "logo" | "cover",
  formData: FormData
): Promise<Vendor> {
  await assertOwnerToken(vendorSlug, ownerToken);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("No image file provided");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validationError = validateMenuImageFile(buffer.byteLength, file.type);
  if (validationError) {
    throw new Error(validationError);
  }

  const pathname = buildBrandingBlobPathname(vendorSlug, field, file.type);
  const uploaded = await putBrandingBlob(pathname, buffer, file.type);

  const patch =
    field === "logo"
      ? { logoUrl: uploaded.url }
      : { coverImageUrl: uploaded.url };

  const updated = await getStore().updateVendor(vendorSlug, patch);
  if (!updated) {
    throw new Error("Vendor not found");
  }
  return updated;
}
