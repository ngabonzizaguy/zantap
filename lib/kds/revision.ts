import type { KitchenStage, OrderStatus } from "@/lib/types";

export interface KdsOrderRevisionRow {
  id: string;
  status: OrderStatus;
  kitchenStage?: KitchenStage | null;
  totalAmount: number;
}

export interface KdsMenuRevisionRow {
  id: string;
  isAvailable: boolean;
}

/** Stable revision key shared by full snapshots and lightweight poll reads. */
export function buildKdsSnapshotRevision(input: {
  orders: KdsOrderRevisionRow[];
  menu: KdsMenuRevisionRow[];
  todayGross: number;
  kitchenOpen: boolean;
}): string {
  const orderKey = input.orders
    .map(
      (order) =>
        `${order.id}:${order.status}:${order.kitchenStage ?? ""}:${order.totalAmount}`
    )
    .join("|");
  const menuKey = input.menu
    .map((item) => `${item.id}:${item.isAvailable}`)
    .join("|");
  return `${orderKey}#${menuKey}#${input.todayGross}#${input.kitchenOpen}`;
}
