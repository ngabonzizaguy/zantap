import { normalizePhone } from "@/lib/format";
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
  if (!input.momoCode?.trim()) {
    return "MoMo merchant code is required";
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
