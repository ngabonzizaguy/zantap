"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Driver, MenuItem, Order, Vendor } from "@/lib/types";
import {
  advanceKitchenStage,
  bulkAdvanceKitchenStage,
  loadKdsSnapshot,
  resetMenu,
  setKitchen,
  toggleItem,
} from "@/lib/actions/vendor";
import { loadOnboardingState } from "@/lib/actions/vendor-guides";
import { orderStatusForKitchenStage, sortKdsQueueOrders } from "@/lib/kds/kitchen-stage";
import { useKdsLiveSnapshot } from "@/lib/kds/useKdsLiveSnapshot";
import type { KdsSnapshot } from "@/lib/kds/types";
import type { KitchenStage } from "@/lib/types";
import { buildDeliverySlip } from "@/lib/whatsapp";
import { deriveOnboardingState } from "@/lib/vendor/onboarding";
import { MetricsBanner } from "@/components/vendor/MetricsBanner";
import { Tabs, type KdsTab } from "@/components/vendor/Tabs";
import { OrdersList } from "@/components/vendor/OrderTicket";
import { BulkActionBar } from "@/components/vendor/BulkActionBar";
import { MenuSection } from "@/components/vendor/MenuSection";
import { HistoryPanel } from "@/components/vendor/HistoryPanel";
import { DispatchModal } from "@/components/vendor/DispatchModal";
import { SetupDrawer } from "@/components/vendor/SetupDrawer";
import { Coachmark } from "@/components/vendor/Coachmark";
import { Card, GradientOrbs } from "@/components/ui/primitives";

const KDS_TABS = new Set<KdsTab>(["orders", "menu", "history", "setup"]);

function parseInitialTab(tab?: string): KdsTab {
  if (tab && KDS_TABS.has(tab as KdsTab)) {
    return tab as KdsTab;
  }
  return "orders";
}

interface KdsDashboardProps {
  vendor: Vendor;
  initialOrders: Order[];
  initialMenu: MenuItem[];
  initialDrivers: Driver[];
  initialTodayGross: number;
  initialKitchenOpen: boolean;
  initialTab?: string;
}

export function KdsDashboard({
  vendor,
  initialOrders,
  initialMenu,
  initialDrivers,
  initialTodayGross,
  initialKitchenOpen,
  initialTab,
}: KdsDashboardProps) {
  const [tab, setTab] = useState<KdsTab>(() => parseInitialTab(initialTab));
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
  const [setupOpen, setSetupOpen] = useState(false);
  const [onboardingOverride, setOnboardingOverride] = useState<
    ReturnType<typeof deriveOnboardingState> | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const liveChecklist = useMemo(
    () => deriveOnboardingState(menu, kitchenOpen, orders),
    [menu, kitchenOpen, orders]
  );
  const checklist = onboardingOverride ?? liveChecklist;

  useEffect(() => {
    setOnboardingOverride(null);
  }, [menu, kitchenOpen, orders]);

  const refreshOnboarding = useCallback(async () => {
    try {
      const state = await loadOnboardingState(vendor.slug);
      setOnboardingOverride(state);
    } catch {
      setOnboardingOverride(null);
    }
  }, [vendor.slug]);
  const applySnapshot = useCallback((snapshot: KdsSnapshot) => {
      setOrders(snapshot.orders);
      setMenu(snapshot.menu);
      setTodayGross(snapshot.todayGross);
      setKitchenOpenState(snapshot.kitchenOpen);
  }, []);

  const { sseReconnecting } = useKdsLiveSnapshot(vendor.slug, applySnapshot);

  const sortedOrders = useMemo(
    () => sortKdsQueueOrders(orders),
    [orders]
  );

  useEffect(() => {
    if (tab === "setup") {
      setSetupOpen(true);
    }
  }, [tab]);

  const openSetup = useCallback(() => {
    setSetupOpen(true);
  }, []);

  const closeSetup = useCallback(() => {
    setSetupOpen(false);
    if (tab === "setup") {
      setTab("orders");
    }
  }, [tab]);
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

  const applyKitchenStageOptimistic = useCallback(
    (orderId: string, stage: KitchenStage) => {
      const statusPatch = orderStatusForKitchenStage(stage);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                kitchenStage: stage,
                ...(statusPatch ? { status: statusPatch } : {}),
              }
            : order
        )
      );
    },
    []
  );

  const handleAdvanceStage = async (orderId: string, stage: KitchenStage) => {
    applyKitchenStageOptimistic(orderId, stage);
    try {
      await advanceKitchenStage(orderId, stage);
      await refresh();
    } catch {
      await refresh();
    }
  };

  const handleBulkAdvance = async (stage: KitchenStage) => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkBusy(true);
    for (const id of ids) {
      applyKitchenStageOptimistic(id, stage);
    }
    try {
      await bulkAdvanceKitchenStage(ids, stage);
      setSelectedIds(new Set());
      setBulkMode(false);
      await refresh();
    } catch {
      await refresh();
    } finally {
      setBulkBusy(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
      applyKitchenStageOptimistic(dispatchOrder.id, "OUT_FOR_DELIVERY");
      await advanceKitchenStage(dispatchOrder.id, "OUT_FOR_DELIVERY");
      setDispatchId(null);
      setExpandedId(null);
      setCopied(false);
      await refresh();
    } catch {
      await refresh();
      // leave the modal open so the vendor can retry the dispatch
    }
  };

  return (
    <div className="min-h-screen w-full bg-canvas text-ink">
      <div className="relative mx-auto min-h-screen w-full max-w-kds overflow-hidden border-x border-hairline bg-canvas pb-10">
        <GradientOrbs />

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
          onMenu={() => setTab("menu")}
          onHistory={() => setTab("history")}
          onSetup={() => {
            setTab("setup");
            setSetupOpen(true);
          }}
        />
        <div className="relative z-[1] px-[18px] pt-3.5">
          {tab === "orders" ? (
            <OrdersList
              orders={sortedOrders}
              expandedId={expandedId}
              selectedIds={selectedIds}
              bulkMode={bulkMode}
              kitchenOpen={kitchenOpen}
              sseReconnecting={sseReconnecting}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              onSelect={handleToggleSelect}
              onDispatch={(id) => {
                setDispatchId(id);
                setCopied(false);
              }}
              onAdvanceStage={handleAdvanceStage}
              onToggleBulkMode={() => {
                setBulkMode((prev) => {
                  if (prev) setSelectedIds(new Set());
                  return !prev;
                });
              }}
            />
          ) : tab === "menu" ? (
            <MenuSection
              vendorSlug={vendor.slug}
              items={menu}
              onToggle={handleToggleItem}
              onResetAll={handleResetAll}
              onRefresh={refresh}
            />
          ) : tab === "history" ? (
            <HistoryPanel vendorSlug={vendor.slug} />
          ) : (
            <Card padding="md" className="text-center">
              <p className="font-display text-display-sm text-ink">
                Setup guide
              </p>
              <p className="mt-2 font-body text-body-sm text-muted">
                Your checklist opens in the panel on the right. Tap ? anytime to
                reopen it.
              </p>
            </Card>
          )}        </div>
      </div>

      <button
        type="button"
        onClick={openSetup}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-surface-card text-2xl font-bold text-ink shadow-brand-soft hover:bg-canvas-soft"
        aria-label="Open setup guide"
      >
        ?
      </button>

      <SetupDrawer
        open={setupOpen}
        onClose={closeSetup}
        checklist={checklist}
        onRefresh={refreshOnboarding}
      />

      <Coachmark
        id="kitchen-toggle"
        targetSelector='[data-coachmark-target="kitchen-toggle"]'
        title="Kitchen status"
        body="Toggle OPEN when you are ready to accept orders. Customers cannot place orders while closed."
      />
      <Coachmark
        id="menu-add"
        targetSelector='[data-coachmark-target="menu-add"]'
        title="Add your first dish"
        body="Tap here to create a menu item customers can order from your storefront."
        enabled={tab === "menu"}
      />
      <Coachmark
        id="dispatch-button"
        targetSelector='[data-coachmark-target="dispatch-button"]'
        title="Dispatch to driver"
        body="When an order is paid, expand the ticket and dispatch the moto driver with the delivery slip."
        enabled={tab === "orders" && !!expandedId}
      />

      <DispatchModal        open={!!dispatchId}
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

      <BulkActionBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onClear={() => setSelectedIds(new Set())}
        onBulkAdvance={handleBulkAdvance}
      />
    </div>
  );
}
