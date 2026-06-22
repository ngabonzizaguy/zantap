"use server";

import { getStore } from "@/lib/store";
import type { MenuItem, Order, OrderStatus } from "@/lib/types";

export interface KdsSnapshot {
  orders: Order[];
  menu: MenuItem[];
  todayGross: number;
  kitchenOpen: boolean;
}

/**
 * The KDS poll reads through the server seam instead of its own browser copy of
 * the data, so it observes the real Store.
 */
export async function loadKdsSnapshot(vendorSlug: string): Promise<KdsSnapshot> {
  const store = getStore();
  const [orders, menu, todayGross, kitchenOpen] = await Promise.all([
    store.listOrders(vendorSlug),
    store.getMenu(vendorSlug),
    store.getTodayGross(vendorSlug),
    store.isKitchenOpen(vendorSlug),
  ]);
  return { orders, menu, todayGross, kitchenOpen };
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
