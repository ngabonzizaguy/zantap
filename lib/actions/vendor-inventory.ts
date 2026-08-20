"use server";

import { getStore } from "@/lib/store";
import type {
  CreateInventoryItemInput,
  InventoryItem,
  InventoryItemDetail,
  InventoryListFilters,
  PaginatedInventory,
  RecordInventoryAdjustmentInput,
  UpdateInventoryItemInput,
} from "@/lib/inventory/types";
import type { Pagination } from "@/lib/types";
import { assertOwnerToken } from "@/lib/vendor/owner-token-guard";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

export async function loadInventory(
  vendorSlug: string,
  filters: InventoryListFilters,
  pagination: Pagination
): Promise<PaginatedInventory> {
  return getStore().listInventory(vendorSlug, filters, pagination);
}

export async function loadInventoryItem(
  vendorSlug: string,
  itemId: string
): Promise<InventoryItemDetail | null> {
  return getStore().getInventoryItem(vendorSlug, itemId);
}

export async function createInventoryItem(
  ownerToken: string,
  vendorSlug: string,
  input: CreateInventoryItemInput
): Promise<InventoryItem> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().createInventoryItem(vendorSlug, input);
}

export async function updateInventoryItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  input: UpdateInventoryItemInput
): Promise<InventoryItemDetail | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().updateInventoryItem(vendorSlug, itemId, input);
}

export async function adjustInventoryItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string,
  input: RecordInventoryAdjustmentInput
): Promise<InventoryItemDetail | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().adjustInventoryItem(vendorSlug, itemId, input);
}

export async function archiveInventoryItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string
): Promise<InventoryItemDetail | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().archiveInventoryItem(vendorSlug, itemId);
}

export async function restoreInventoryItem(
  ownerToken: string,
  vendorSlug: string,
  itemId: string
): Promise<InventoryItemDetail | null> {
  await assertOwnerToken(vendorSlug, ownerToken);
  return getStore().restoreInventoryItem(vendorSlug, itemId);
}
