import "server-only";

import { getStore } from "@/lib/store";
import type { KdsSnapshot } from "@/lib/kds/types";

export type { KdsSnapshot } from "@/lib/kds/types";

/** Reads the durable Store snapshot the KDS displays. */
export async function fetchKdsSnapshot(
  vendorSlug: string
): Promise<KdsSnapshot> {
  const store = getStore();
  const [orders, menu, todayGross, kitchenOpen] = await Promise.all([
    store.listOrders(vendorSlug),
    store.getMenu(vendorSlug),
    store.getTodayGross(vendorSlug),
    store.isKitchenOpen(vendorSlug),
  ]);
  return { orders, menu, todayGross, kitchenOpen };
}
