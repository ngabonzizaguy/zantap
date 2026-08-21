import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { fetchKdsSnapshot } from "@/lib/kds/snapshot";
import { KdsDashboard } from "@/components/vendor/KdsDashboard";
import { INVENTORY_CATEGORIES, type InventoryCategory } from "@/lib/inventory/types";
import { parseHistoryQuery, parseLiveOrdersQuery } from "@/lib/kds/order-pagination";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    tab?: string;
    inventoryPage?: string;
    inventorySearch?: string;
    inventoryCategory?: string;
    inventoryArchived?: string;
    ordersPage?: string;
    ordersStage?: string;
    ordersSort?: string;
    historyPage?: string;
    historyDate?: string;
    historyFrom?: string;
    historyTo?: string;
    historyStatus?: string;
    historyPayment?: string;
    historySearch?: string;
  }>;
}

export default async function VendorKdsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const tab = query.tab;
  const requestedPage = Number.parseInt(query.inventoryPage ?? "1", 10);
  const inventoryPage = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const inventoryCategory: InventoryCategory | "ALL" = INVENTORY_CATEGORIES.includes(
    query.inventoryCategory as InventoryCategory
  )
    ? (query.inventoryCategory as InventoryCategory)
    : "ALL";
  const inventoryQuery = {
    page: inventoryPage,
    search: query.inventorySearch?.trim() ?? "",
    category: inventoryCategory,
    archived: query.inventoryArchived === "1",
  };
  const liveOrdersQuery = parseLiveOrdersQuery(query);
  const historyQuery = parseHistoryQuery(query);
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) notFound();

  const [snapshot, drivers, inventory] = await Promise.all([
    fetchKdsSnapshot(slug),
    store.getDrivers(slug),
    store.listInventory(
      slug,
      {
        search: inventoryQuery.search,
        category: inventoryQuery.category,
        archived: inventoryQuery.archived,
      },
      { page: inventoryQuery.page, pageSize: 10 }
    ),
  ]);

  return (
    <KdsDashboard
      vendor={vendor}
      initialOrders={snapshot.orders}
      initialMenu={snapshot.menu}
      initialDrivers={drivers}
      initialTodayGross={snapshot.todayGross}
      initialYesterdayGross={snapshot.yesterdayGross}
      initialKitchenOpen={snapshot.kitchenOpen}
      initialFeatureFlags={snapshot.featureFlags}
      initialVendorUpdates={snapshot.vendorUpdates}
      initialInventory={inventory}
      initialInventoryQuery={inventoryQuery}
      initialLiveOrdersQuery={liveOrdersQuery}
      initialHistoryQuery={historyQuery}
      initialTab={tab}
    />
  );
}
