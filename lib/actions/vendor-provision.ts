"use server";

import { normalizePhone } from "@/lib/format";
import { getStore } from "@/lib/store";
import type { CreateVendorInput, MenuItem, Vendor } from "@/lib/types";
import { assertProvisionSecret } from "@/lib/vendor/provision-secret";
import {
  validateProvisionVendorInput,
  validateStarterItemInput,
} from "@/lib/vendor/provision-validation";
import { normalizeVendorSlug } from "@/lib/vendor/slug";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const normalized = normalizeVendorSlug(slug);
  if (!normalized) return false;
  return getStore().isSlugAvailable(normalized);
}

export async function provisionVendor(
  provisionSecret: string,
  input: CreateVendorInput,
  starterItem?: { name: string; priceRwf: number }
): Promise<{ vendor: Vendor; menuItem?: MenuItem }> {
  assertProvisionSecret(provisionSecret);

  const validationError = validateProvisionVendorInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  if (starterItem) {
    const starterError = validateStarterItemInput(starterItem);
    if (starterError) {
      throw new Error(starterError);
    }
  }

  const normalizedSlug = normalizeVendorSlug(input.slug);
  const store = getStore();

  if (!(await store.isSlugAvailable(normalizedSlug))) {
    throw new Error("This storefront URL is already taken");
  }

  const vendor = await store.createVendor({
    ...input,
    name: input.name.trim(),
    slug: normalizedSlug,
    phoneNumber: normalizePhone(input.phoneNumber),
    momoCode: input.momoCode.trim(),
    tagline: input.tagline?.trim() || undefined,
    location: input.location?.trim() || undefined,
    deliveryTime: input.deliveryTime?.trim() || undefined,
  });

  let menuItem: MenuItem | undefined;
  if (starterItem) {
    menuItem = await store.createMenuItem(normalizedSlug, {
      name: starterItem.name.trim(),
      priceRwf: starterItem.priceRwf,
      category: "General",
    });
  }

  return { vendor, menuItem };
}
