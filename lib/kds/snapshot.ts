import "server-only";

import { getStore } from "@/lib/store";
import type { KdsSnapshot } from "@/lib/kds/types";
import type { OrderStatus } from "@/lib/types";

export type { KdsSnapshot } from "@/lib/kds/types";

// The KDS only surfaces orders the customer has actually paid for. A PENDING
// order exists between tapping "Pay" and authorizing the MoMo PIN; it must not
// reach the kitchen until payment succeeds (status flips to PAID).
const KDS_VISIBLE_STATUSES: OrderStatus[] = ["PAID", "DISPATCHED", "COMPLETED"];

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
  return {
    orders: orders.filter((order) =>
      KDS_VISIBLE_STATUSES.includes(order.status)
    ),
    menu,
    todayGross,
    kitchenOpen,
  };
}
