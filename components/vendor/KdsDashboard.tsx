"use client";

import { useCallback, useEffect, useState } from "react";
import type { Driver, MenuItem, Order, Vendor } from "@/lib/types";
import {
  getDrivers,
  getMenu,
  getTodayGross,
  isKitchenOpen,
  listOrders,
  setAllItemsAvailable,
  setKitchenOpen,
  toggleItemAvailability,
  updateOrderStatus,
} from "@/lib/data";
import { buildDeliverySlip } from "@/lib/whatsapp";
import { MetricsBanner } from "@/components/vendor/MetricsBanner";
import { Tabs } from "@/components/vendor/Tabs";
import { OrdersList } from "@/components/vendor/OrderTicket";
import { InventoryGrid } from "@/components/vendor/InventoryGrid";
import { DispatchModal } from "@/components/vendor/DispatchModal";

interface KdsDashboardProps {
  vendor: Vendor;
  initialOrders: Order[];
  initialMenu: MenuItem[];
  initialDrivers: Driver[];
  initialTodayGross: number;
  initialKitchenOpen: boolean;
}

export function KdsDashboard({
  vendor,
  initialOrders,
  initialMenu,
  initialDrivers,
  initialTodayGross,
  initialKitchenOpen,
}: KdsDashboardProps) {
  const [tab, setTab] = useState<"orders" | "inventory">("orders");
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [drivers] = useState(initialDrivers);
  const [todayGross, setTodayGross] = useState(initialTodayGross);
  const [kitchenOpen, setKitchenOpenState] = useState(initialKitchenOpen);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOrders[0]?.id ?? null
  );
  const [dispatchId, setDispatchId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(async () => {
    const [nextOrders, nextMenu, nextGross, nextOpen] = await Promise.all([
      listOrders(vendor.slug),
      getMenu(vendor.slug),
      getTodayGross(vendor.slug),
      isKitchenOpen(vendor.slug),
    ]);
    setOrders(nextOrders);
    setMenu(nextMenu);
    setTodayGross(nextGross);
    setKitchenOpenState(nextOpen);
  }, [vendor.slug]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const activeCount = orders.filter(
    (o) => o.status === "PAID" || o.status === "DISPATCHED"
  ).length;

  const dispatchOrder = orders.find((o) => o.id === dispatchId) ?? null;

  const handleToggleKitchen = async () => {
    await setKitchenOpen(vendor.slug, !kitchenOpen);
    await refresh();
  };

  const handleToggleItem = async (itemId: string) => {
    await toggleItemAvailability(vendor.slug, itemId);
    await refresh();
  };

  const handleResetAll = async () => {
    await setAllItemsAvailable(vendor.slug);
    await refresh();
  };

  const handleShareWhatsApp = async () => {
    if (!dispatchOrder) return;
    const slip = buildDeliverySlip(dispatchOrder, vendor.name);
    try {
      await navigator.clipboard.writeText(slip);
    } catch {
      // ignore clipboard failures in unsupported browsers
    }
    await updateOrderStatus(dispatchOrder.id, "DISPATCHED");
    setDispatchId(null);
    setExpandedId(null);
    setCopied(false);
    await refresh();
  };

  return (
    <div className="min-h-screen w-full bg-zk-bg text-zk-text">
      <div className="relative mx-auto min-h-screen w-full max-w-kds overflow-hidden border-x border-zk-borderDark bg-zk-bg pb-10">
        <div className="pointer-events-none absolute -left-[60px] -top-[120px] z-0 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_40%_40%,rgba(245,148,95,0.5),rgba(245,148,95,0))] blur-[40px]" />
        <div className="pointer-events-none absolute -right-[70px] -top-[90px] z-0 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(167,143,224,0.4),rgba(167,143,224,0))] blur-[44px]" />

        <MetricsBanner
          vendorName={vendor.name}
          todayGross={todayGross}
          activeCount={activeCount}
          kitchenOpen={kitchenOpen}
          onToggleKitchen={handleToggleKitchen}
        />

        <Tabs
          active={tab}
          onOrders={() => setTab("orders")}
          onInventory={() => setTab("inventory")}
        />

        <div className="relative z-[1] px-[18px] pt-3.5">
          {tab === "orders" ? (
            <OrdersList
              orders={orders}
              expandedId={expandedId}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              onDispatch={(id) => {
                setDispatchId(id);
                setCopied(false);
              }}
            />
          ) : (
            <InventoryGrid
              items={menu}
              onToggle={handleToggleItem}
              onResetAll={handleResetAll}
            />
          )}
        </div>
      </div>

      <DispatchModal
        open={!!dispatchId}
        order={dispatchOrder}
        vendorName={vendor.name}
        drivers={drivers}
        copied={copied}
        onClose={() => setDispatchId(null)}
        onCopy={() => {
          if (!dispatchOrder) return;
          const slip = buildDeliverySlip(dispatchOrder, vendor.name);
          navigator.clipboard?.writeText(slip).catch(() => undefined);
          setCopied(true);
        }}
        onShareWhatsApp={handleShareWhatsApp}
      />
    </div>
  );
}
