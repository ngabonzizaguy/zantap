"use server";

import { getStore } from "@/lib/store";
import type { MenuItem, UpdateMenuItemInput } from "@/lib/types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

export async function updateMenuItemStock(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  fields: Pick<UpdateMenuItemInput, "stockCount" | "lowStockThreshold" | "costPriceRwf">
): Promise<MenuItem | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().updateMenuItem(vendorSlug, itemId, fields);
}
