import type { KdsSnapshot } from "@/lib/kds/types";
import { buildKdsSnapshotRevision } from "@/lib/kds/revision";

/**
 * Stable change detector for full KDS snapshots. Matches {@link buildKdsSnapshotRevision}
 * so SSE pushes stay aligned with lightweight poll revisions.
 */
export function fingerprintKdsSnapshot(snapshot: KdsSnapshot): string {
  return buildKdsSnapshotRevision({
    orders: snapshot.orders.map((order) => ({
      id: order.id,
      status: order.status,
      kitchenStage: order.kitchenStage,
      totalAmount: order.totalAmount,
    })),
    menu: snapshot.menu.map((item) => ({
      id: item.id,
      isAvailable: item.isAvailable,
    })),
    todayGross: snapshot.todayGross,
    kitchenOpen: snapshot.kitchenOpen,
  });
}
