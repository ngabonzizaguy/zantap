"use server";

import { fetchKdsSnapshot } from "@/lib/kds/snapshot";
import type { KdsSnapshot } from "@/lib/kds/types";
import { getStore } from "@/lib/store";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";

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

export async function advanceOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<Order | null> {
  return getStore().updateOrderStatus(orderId, status);
}
