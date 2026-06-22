import { notFound } from "next/navigation";
import { getStore } from "@/lib/store";
import { KdsDashboard } from "@/components/vendor/KdsDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorKdsPage({ params }: PageProps) {
  const { slug } = await params;
  const store = getStore();
  const vendor = await store.getVendorBySlug(slug);
  if (!vendor) notFound();

  const [orders, menu, drivers, todayGross, kitchenOpen] = await Promise.all([
    store.listOrders(slug),
    store.getMenu(slug),
    store.getDrivers(slug),
    store.getTodayGross(slug),
    store.isKitchenOpen(slug),
  ]);

  return (
    <KdsDashboard
      vendor={vendor}
      initialOrders={orders}
      initialMenu={menu}
      initialDrivers={drivers}
      initialTodayGross={todayGross}
      initialKitchenOpen={kitchenOpen}
    />
  );
}
