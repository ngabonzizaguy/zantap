import "server-only";

import { getStore } from "@/lib/store";
import type { KdsSnapshot } from "@/lib/kds/types";

export type { KdsSnapshot } from "@/lib/kds/types";

/** Reads the durable Store snapshot the KDS displays. */
export async function fetchKdsSnapshot(
  vendorSlug: string
): Promise<KdsSnapshot> {
  const store = getStore();
  const [vendor, orders, menu, todayGross, yesterdayGross, kitchenOpen, vendorUpdates] =
    await Promise.all([
      store.getVendorBySlug(vendorSlug),
      store.listKdsOrders(vendorSlug),
      store.getMenu(vendorSlug),
      store.getTodayGross(vendorSlug),
      store.getYesterdayGross(vendorSlug),
      store.isKitchenOpen(vendorSlug),
      store.getVendorUpdateOverview(vendorSlug),
    ]);
  return {
    orders,
    menu,
    todayGross,
    yesterdayGross,
    kitchenOpen,
    featureFlags: {
      featureWhatsappNotify: vendor?.featureWhatsappNotify ?? false,
      featureStockTracking: vendor?.featureStockTracking ?? false,
      featureProfitInsights: vendor?.featureProfitInsights ?? false,
    },
    vendorUpdates: vendorUpdates ?? {
      settings: { enabled: true },
      activeBatch: null,
      totals: { batches: 0, revisions: 0, opens: 0, menuVisits: 0 },
    },
  };
}

/** Cheap revision string for SSE poll loops — full snapshot fetch only on change. */
export async function fetchKdsSnapshotRevision(
  vendorSlug: string
): Promise<string> {
  return getStore().getKdsSnapshotRevision(vendorSlug);
}
