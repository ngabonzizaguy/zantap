import type { Order, OrderStatus } from "@/lib/types";
import { startOfDayInTimezone } from "@/lib/orders/history-filters";

/** Order statuses the KDS queue may surface (excludes unpaid PENDING). */
export const KDS_QUEUE_STATUSES: OrderStatus[] = [
  "PAID",
  "DISPATCHED",
  "COMPLETED",
];

/**
 * Whether an order belongs on the live KDS queue. Active work (PAID/DISPATCHED)
 * is always included; COMPLETED tickets roll off after the local service day so
 * poll payloads do not grow with full order history (History tab is paginated).
 */
export function isKdsQueueOrder(
  order: Pick<Order, "status" | "createdAt" | "updatedAt" | "paidAt">,
  ref: Date = new Date()
): boolean {
  if (order.status === "PAID" || order.status === "DISPATCHED") {
    return true;
  }
  if (order.status !== "COMPLETED") {
    return false;
  }
  const startOfToday = startOfDayInTimezone(ref);
  const activityAt = order.updatedAt ?? order.paidAt ?? order.createdAt;
  return activityAt >= startOfToday;
}

export function filterKdsQueueOrders(
  orders: Order[],
  ref: Date = new Date()
): Order[] {
  return orders.filter((order) => isKdsQueueOrder(order, ref));
}
