"use server";

import {
  fetchKdsSnapshot,
  type KdsSnapshot,
} from "@/lib/kds/snapshot";
import { getStore } from "@/lib/store";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";

export type { KdsSnapshot };

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
