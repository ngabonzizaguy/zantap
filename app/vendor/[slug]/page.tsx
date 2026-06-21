import { notFound } from "next/navigation";
import {
  getDrivers,
  getMenu,
  getTodayGross,
  getVendorBySlug,
  isKitchenOpen,
  listOrders,
} from "@/lib/data";
import { KdsDashboard } from "@/components/vendor/KdsDashboard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorKdsPage({ params }: PageProps) {
  const { slug } = await params;
  const vendor = await getVendorBySlug(slug);
  if (!vendor) notFound();

  const [orders, menu, drivers, todayGross, kitchenOpen] = await Promise.all([
    listOrders(slug),
    getMenu(slug),
    getDrivers(slug),
    getTodayGross(slug),
    isKitchenOpen(slug),
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
