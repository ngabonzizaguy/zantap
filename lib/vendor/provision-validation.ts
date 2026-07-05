import { normalizePhone } from "@/lib/format";
import { normalizeMomoPayoutPhoneForStorage } from "@/lib/momo/ussd-dial";
import type { CreateVendorInput } from "@/lib/types";
import { normalizeVendorSlug } from "@/lib/vendor/slug";

export function validateProvisionVendorInput(
  input: CreateVendorInput
): string | null {
  if (!input.name?.trim()) {
    return "Business name is required";
  }
  if (input.name.trim().length > 80) {
    return "Business name must be 80 characters or fewer";
  }
  if (!normalizeVendorSlug(input.slug)) {
    return "Storefront URL is required";
  }
  const payoutMethod = input.payoutMethod ?? "MERCHANT_CODE";
  if (!input.momoCode?.trim()) {
    return payoutMethod === "PHONE"
      ? "MoMo payout phone number is required"
      : "MoMo merchant code is required";
  }
  if (
    payoutMethod === "PHONE" &&
    !normalizeMomoPayoutPhoneForStorage(input.momoCode)
  ) {
    return "A valid MoMo payout phone number is required";
  }
  if (normalizePhone(input.phoneNumber).length < 10) {
    return "A valid phone number is required";
  }
  return null;
}

export function validateStarterItemInput(starterItem: {
  name: string;
  priceRwf: number;
}): string | null {
  if (!starterItem.name?.trim()) {
    return "Dish name is required";
  }
  if (!Number.isInteger(starterItem.priceRwf) || starterItem.priceRwf <= 0) {
    return "Price must be a positive whole number (RWF)";
  }
  return null;
}
