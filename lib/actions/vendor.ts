"use server";

import { assertCanAdvanceKitchenStage } from "@/lib/kds/kitchen-stage";
import { fetchKdsSnapshot } from "@/lib/kds/snapshot";
import type { KdsSnapshot } from "@/lib/kds/types";
import { getStore } from "@/lib/store";
import type { KitchenStage, MenuItem, Order } from "@/lib/types";

// NOTE: a "use server" module may export only async server actions. Do NOT
// re-export types from here — Next.js registers every export as a server
// reference, and a type re-export leaks an undefined runtime identifier in the
// production build (ReferenceError), 500-ing every action in this file. Types
// live in "@/lib/kds/types"; import them from there.

/**
 * The KDS reads through the server seam instead of its own browser copy of
 * the data, so it observes the real Store.
 */
export async function loadKdsSnapshot(vendorSlug: string): Promise<KdsSnapshot> {
  return fetchKdsSnapshot(vendorSlug);
}

export async function toggleItem(
  vendorSlug: string,
  itemId: string
): Promise<MenuItem | null> {
  return getStore().toggleItemAvailability(vendorSlug, itemId);
}

export async function resetMenu(vendorSlug: string): Promise<MenuItem[]> {
  return getStore().setAllItemsAvailable(vendorSlug);
}

export async function setKitchen(
  vendorSlug: string,
  open: boolean
): Promise<boolean> {
  return getStore().setKitchenOpen(vendorSlug, open);
}

/** Single-order kitchen stage advance — forward-only; throws on backward moves. */
export async function advanceKitchenStage(
  orderId: string,
  stage: KitchenStage
): Promise<Order> {
  const store = getStore();
  const current = await store.getOrder(orderId);
  assertCanAdvanceKitchenStage(orderId, current, stage);
  const updated = await store.updateKitchenStage(orderId, stage);
  if (!updated) {
    throw new Error(`Order not found: ${orderId}`);
  }
  return updated;
}

/**
 * Bulk kitchen stage advance — per-id forward-only rules; skips orders that
 * cannot reach the target stage (backward, missing, or not yet paid).
 */
export async function bulkAdvanceKitchenStage(
  orderIds: string[],
  stage: KitchenStage
): Promise<Order[]> {
  return getStore().bulkUpdateKitchenStage(orderIds, stage);
}
