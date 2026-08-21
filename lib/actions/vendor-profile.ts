"use server";



import { canonicalizePhone } from "@/lib/format";

import { putBrandingBlob } from "@/lib/menu/blob-storage";

import {

  buildBrandingBlobPathname,

  validateMenuImageFile,

} from "@/lib/menu/media";

import { normalizeMomoPayoutPhoneForStorage } from "@/lib/momo/ussd-dial";

import { getStore } from "@/lib/store";

import type { PayoutMethod, UpdateVendorInput, Vendor } from "@/lib/types";

import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

import { isValidVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import { buildProfileUpdateEntry } from "@/lib/vendor-updates/publication";
import type { VendorSaveOptions } from "@/lib/vendor-updates/types";



function momoCodeValidationError(payoutMethod: PayoutMethod): string {

  return payoutMethod === "PHONE"

    ? "A valid MoMo payout phone number is required"

    : "MoMo merchant code must be exactly 6 digits";

}



// NOTE: export only async server actions — no type re-exports (AGENTS.md).



export async function updateVendorProfile(

  ownerToken: string,

  vendorSlug: string,

  input: UpdateVendorInput,

  options: VendorSaveOptions = {}

): Promise<Vendor> {

  await assertOwnerToken(vendorSlug, ownerToken);



  const store = getStore();

  const existing = await store.getVendorBySlug(vendorSlug);

  if (!existing) {

    throw new Error("Vendor not found");

  }



  if (input.slug !== undefined && existing) {

    const normalizedNewSlug = normalizeVendorSlug(input.slug);

    if (!normalizedNewSlug || !isValidVendorSlug(input.slug)) {

      throw new Error(

        "Storefront URL must use lowercase letters, numbers, and hyphens only"

      );

    }

    if (

      normalizedNewSlug !== existing.slug &&

      !(await store.isSlugAvailable(normalizedNewSlug))

    ) {

      throw new Error("This storefront URL is already taken");

    }

  }



  if (input.name !== undefined && !input.name.trim()) {

    throw new Error("Business name is required");

  }

  if (input.name !== undefined && input.name.trim().length > 80) {

    throw new Error("Business name must be 80 characters or fewer");

  }



  let normalizedPhone: string | undefined;

  if (input.phoneNumber !== undefined) {

    normalizedPhone = canonicalizePhone(input.phoneNumber);

    if (normalizedPhone.length < 10) {

      throw new Error("A valid phone number is required");

    }

  }



  let normalizedMomoCode: string | undefined;

  if (input.momoCode !== undefined && existing) {

    const payoutMethod = input.payoutMethod ?? existing.payoutMethod;

    if (payoutMethod === "PHONE") {

      const localPhone = normalizeMomoPayoutPhoneForStorage(input.momoCode);

      if (!localPhone) {

        throw new Error(momoCodeValidationError("PHONE"));

      }

      normalizedMomoCode = localPhone;

    } else {

      const merchantCode = input.momoCode.trim();

      if (!/^\d{6}$/.test(merchantCode)) {

        throw new Error(momoCodeValidationError("MERCHANT_CODE"));

      }

      normalizedMomoCode = merchantCode;

    }

  }



  const payload: UpdateVendorInput = {

    ...(input.name !== undefined ? { name: input.name.trim() } : {}),

    ...(input.slug !== undefined

      ? { slug: normalizeVendorSlug(input.slug) }

      : {}),

    ...(normalizedPhone !== undefined ? { phoneNumber: normalizedPhone } : {}),

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

    ...(input.businessCategory !== undefined

      ? { businessCategory: input.businessCategory.trim() || undefined }

      : {}),

    ...(input.payoutMethod !== undefined

      ? { payoutMethod: input.payoutMethod }

      : {}),

    ...(input.logoUrl !== undefined

      ? { logoUrl: input.logoUrl.trim() || undefined }

      : {}),

    ...(input.coverImageUrl !== undefined

      ? { coverImageUrl: input.coverImageUrl.trim() || undefined }

      : {}),

    ...(input.description !== undefined

      ? { description: input.description.trim() || undefined }

      : {}),

    ...(normalizedMomoCode !== undefined ? { momoCode: normalizedMomoCode } : {}),

  };



  const updated = await store.updateVendor(vendorSlug, payload);

  if (!updated) {

    throw new Error("Vendor not found");

  }

  const entry = buildProfileUpdateEntry(existing, updated);

  if (entry) {

    await store.recordVendorUpdate(updated.slug, {

      announce: options.announce,

      entry,

    });

  }

  return updated;

}



export async function uploadBrandingImage(

  ownerToken: string,

  vendorSlug: string,

  field: "logo" | "cover",

  formData: FormData,

  options: VendorSaveOptions = {}

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



  const store = getStore();

  const existing = await store.getVendorBySlug(vendorSlug);

  if (!existing) {

    throw new Error("Vendor not found");

  }

  const updated = await store.updateVendor(vendorSlug, patch);

  if (!updated) {

    throw new Error("Vendor not found");

  }

  const entry = buildProfileUpdateEntry(existing, updated);

  if (entry) {

    await store.recordVendorUpdate(updated.slug, {

      announce: options.announce,

      entry,

    });

  }

  return updated;

}

