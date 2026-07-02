import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { fetchKdsSnapshot } from "@/lib/kds/snapshot";
import { KdsDashboard } from "@/components/vendor/KdsDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function VendorKdsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { tab } = await searchParams;
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) notFound();

  // Read through the same snapshot the live SSE stream uses, so the initial
  // render and subsequent updates agree on which orders are visible.
  const [snapshot, drivers] = await Promise.all([
    fetchKdsSnapshot(slug),
    store.getDrivers(slug),
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
      initialTab={tab}
    />
  );
}
