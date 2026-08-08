import type { KitchenStage, Order, OrderStatus } from "@/lib/types";

/** Monotonic kitchen progress order (ADR-0013). */
export const KITCHEN_STAGES = [
  "NEW",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "COMPLETED",
] as const satisfies readonly KitchenStage[];

export function kitchenStageOrdinal(stage: KitchenStage): number {
  return KITCHEN_STAGES.indexOf(stage);
}

/** True when `to` is strictly later than `from` on the kitchen timeline. */
export function isForwardKitchenTransition(
  from: KitchenStage | null | undefined,
  to: KitchenStage
): boolean {
  if (from == null) return false;
  return kitchenStageOrdinal(to) > kitchenStageOrdinal(from);
}

/** Thrown when a single-order kitchen stage move would go backward (ADR-0013). */
export class KitchenStageTransitionError extends Error {
  readonly orderId: string;
  readonly from: KitchenStage;
  readonly to: KitchenStage;

  constructor(orderId: string, from: KitchenStage, to: KitchenStage) {
    super(
      `Kitchen stage cannot move backward for order ${orderId}: ${from} → ${to}`
    );
    this.name = "KitchenStageTransitionError";
    this.orderId = orderId;
    this.from = from;
    this.to = to;
  }
}

/**
 * Validates a forward (or idempotent same-stage) kitchen transition before calling
 * the Store. Bulk updates skip invalid ids silently via `bulkUpdateKitchenStage`.
 */
export function assertCanAdvanceKitchenStage(
  orderId: string,
  order: { kitchenStage?: KitchenStage | null } | null | undefined,
  targetStage: KitchenStage
): asserts order is { kitchenStage: KitchenStage } {
  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }
  if (order.kitchenStage == null) {
    throw new Error(`Order ${orderId} has no kitchen stage yet`);
  }
  if (
    order.kitchenStage !== targetStage &&
    !isForwardKitchenTransition(order.kitchenStage, targetStage)
  ) {
    throw new KitchenStageTransitionError(
      orderId,
      order.kitchenStage,
      targetStage
    );
  }
}

/** OrderStatus side effects when entering a kitchen stage (null = leave status unchanged). */
export function orderStatusForKitchenStage(
  stage: KitchenStage
): OrderStatus | null {
  if (stage === "OUT_FOR_DELIVERY") return "DISPATCHED";
  if (stage === "COMPLETED") return "COMPLETED";
  return null;
}

/** Kitchen stage aligned with an OrderStatus after legacy status-only updates. */
export function kitchenStageForOrderStatus(
  status: OrderStatus
): KitchenStage | null {
  if (status === "PAID") return "NEW";
  if (status === "DISPATCHED") return "OUT_FOR_DELIVERY";
  if (status === "COMPLETED") return "COMPLETED";
  return null;
}

/** Direction for the KDS queue time-sort within a kitchen stage group. */
export type KdsSortDirection = "oldest" | "newest";

/**
 * KDS queue sort: kitchen stage ordinal first, then by `paidAt` within the stage.
 * `newest` (default) surfaces the most recently paid order first; vendors can
 * still select `oldest` when they need to focus on the longest wait.
 */
export function sortKdsQueueOrders(
  orders: Order[],
  direction: KdsSortDirection = "newest"
): Order[] {
  const timeSign = direction === "newest" ? -1 : 1;
  return [...orders].sort((a, b) => {
    const stageA = a.kitchenStage ?? kitchenStageForOrderStatus(a.status) ?? "NEW";
    const stageB = b.kitchenStage ?? kitchenStageForOrderStatus(b.status) ?? "NEW";
    const stageDiff =
      kitchenStageOrdinal(stageA) - kitchenStageOrdinal(stageB);
    if (stageDiff !== 0) return stageDiff;
    const paidA = (a.paidAt ?? a.createdAt).getTime();
    const paidB = (b.paidAt ?? b.createdAt).getTime();
    return (paidA - paidB) * timeSign;
  });
}

/** Forward kitchen stages reachable from `current` (excludes same stage). */
export function forwardKitchenStages(
  current: KitchenStage | null | undefined
): KitchenStage[] {
  const from = current ?? "NEW";
  const idx = kitchenStageOrdinal(from);
  return KITCHEN_STAGES.slice(idx + 1);
}
