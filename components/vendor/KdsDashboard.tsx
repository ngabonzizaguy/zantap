"use client";

import { useCallback, useState } from "react";
import type { Driver, MenuItem, Order, Vendor } from "@/lib/types";
import {
  advanceOrderStatus,
  loadKdsSnapshot,
  resetMenu,
  setKitchen,
  toggleItem,
} from "@/lib/actions/vendor";
import { useKdsLiveSnapshot } from "@/lib/kds/useKdsLiveSnapshot";
import type { KdsSnapshot } from "@/lib/kds/types";
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

  const applySnapshot = useCallback((snapshot: KdsSnapshot) => {
      setOrders(snapshot.orders);
      setMenu(snapshot.menu);
      setTodayGross(snapshot.todayGross);
      setKitchenOpenState(snapshot.kitchenOpen);
  }, []);

  useKdsLiveSnapshot(vendor.slug, applySnapshot);

  const refresh = useCallback(async () => {
    const snapshot = await loadKdsSnapshot(vendor.slug);
    applySnapshot(snapshot);
  }, [vendor.slug, applySnapshot]);

  const activeCount = orders.filter(
    (o) => o.status === "PAID" || o.status === "DISPATCHED"
  ).length;

  const dispatchOrder = orders.find((o) => o.id === dispatchId) ?? null;

  const handleToggleKitchen = async () => {
    const next = !kitchenOpen;
    setKitchenOpenState(next);
    try {
      await setKitchen(vendor.slug, next);
      await refresh();
    } catch {
      setKitchenOpenState(!next);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    const flip = (item: MenuItem) =>
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item;
    setMenu((prev) => prev.map(flip));
    try {
      await toggleItem(vendor.slug, itemId);
      await refresh();
    } catch {
      setMenu((prev) => prev.map(flip));
    }
  };

  const handleResetAll = async () => {
    const previous = menu;
    setMenu((prev) => prev.map((item) => ({ ...item, isAvailable: true })));
    try {
      await resetMenu(vendor.slug);
      await refresh();
    } catch {
      setMenu(previous);
    }
  };

  const handleShareWhatsApp = async () => {
    if (!dispatchOrder) return;
    const slip = buildDeliverySlip(dispatchOrder, vendor.name);
    try {
      await navigator.clipboard.writeText(slip);
    } catch {
      // ignore clipboard failures in unsupported browsers
    }
    try {
      await advanceOrderStatus(dispatchOrder.id, "DISPATCHED");
      setDispatchId(null);
      setExpandedId(null);
      setCopied(false);
      await refresh();
    } catch {
      // leave the modal open so the vendor can retry the dispatch
    }
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
