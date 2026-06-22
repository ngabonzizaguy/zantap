import type { KdsSnapshot } from "@/lib/kds/types";

/**
 * Stable, cheap change detector for KDS snapshots. Used by the SSE stream to
 * skip redundant pushes when nothing changed.
 */
export function fingerprintKdsSnapshot(snapshot: KdsSnapshot): string {
  const orderKey = snapshot.orders
    .map((o) => `${o.id}:${o.status}:${o.totalAmount}`)
    .join("|");
  const menuKey = snapshot.menu
    .map((m) => `${m.id}:${m.isAvailable}`)
    .join("|");
  return `${orderKey}#${menuKey}#${snapshot.todayGross}#${snapshot.kitchenOpen}`;
}
