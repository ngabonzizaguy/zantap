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
import {
  assignOrderDriver,
  bulkAssignOrderDriver,
} from "@/lib/actions/vendor-drivers";
import { loadOnboardingState } from "@/lib/actions/vendor-guides";
import {
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
  sortKdsQueueOrders,
  type KdsSortDirection,
} from "@/lib/kds/kitchen-stage";
import { stageFilterGroup, type KdsStageFilter } from "@/lib/kds/stage-styles";
import { useKdsLiveSnapshot } from "@/lib/kds/useKdsLiveSnapshot";
import { usePeekVisibility } from "@/lib/kds/usePeekVisibility";
import type { KdsSnapshot } from "@/lib/kds/types";
import type { KitchenStage } from "@/lib/types";
import { deriveOnboardingState } from "@/lib/vendor/onboarding";
import {
  incrementSetupVisitCount,
  shouldAutoOpenSetupDrawer,
} from "@/lib/vendor/setup-visit-cap";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { MetricsBanner } from "@/components/vendor/MetricsBanner";
import { Tabs, type KdsTab } from "@/components/vendor/Tabs";
import { OrdersList } from "@/components/vendor/OrderTicket";
import { BulkActionBar } from "@/components/vendor/BulkActionBar";
import { MenuSection } from "@/components/vendor/MenuSection";
import { HistoryPanel } from "@/components/vendor/HistoryPanel";
import { AssignDriverModal } from "@/components/vendor/AssignDriverModal";
import { DriversPanel } from "@/components/vendor/DriversPanel";
import { SetupDrawer, type StorefrontProfile, type VendorBusinessProfile, type VendorPaymentProfile } from "@/components/vendor/SetupDrawer";
import { HelpModal } from "@/components/vendor/HelpModal";
import { Coachmark } from "@/components/vendor/Coachmark";
import { Card, GradientOrbs } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const KDS_TABS = new Set<KdsTab>(["orders", "menu", "history", "drivers"]);

function parseInitialTab(tab?: string): KdsTab {
  if (tab === "setup") return "drivers";
  if (tab && KDS_TABS.has(tab as KdsTab)) {
    return tab as KdsTab;
  }
  return "orders";
}

function resolveOrderStage(order: Order): KitchenStage {
  return (
    order.kitchenStage ??
    kitchenStageForOrderStatus(order.status) ??
    "NEW"
  );
}

interface KdsDashboardProps {
  vendor: Vendor;
  initialOrders: Order[];
  initialMenu: MenuItem[];
  initialDrivers: Driver[];
  initialTodayGross: number;
  initialYesterdayGross: number;
  initialKitchenOpen: boolean;
  initialTab?: string;
}

export function KdsDashboard({
  vendor,
  initialOrders,
  initialMenu,
  initialDrivers,
  initialTodayGross,
  initialYesterdayGross,
  initialKitchenOpen,
  initialTab,
}: KdsDashboardProps) {
  const [tab, setTab] = useState<KdsTab>(() => parseInitialTab(initialTab));
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [todayGross, setTodayGross] = useState(initialTodayGross);
  const [yesterdayGross, setYesterdayGross] = useState(initialYesterdayGross);
  const [kitchenOpen, setKitchenOpenState] = useState(initialKitchenOpen);
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOrders[0]?.id ?? null
  );
  const [assignOrderIds, setAssignOrderIds] = useState<string[]>([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [setupAutoOpened, setSetupAutoOpened] = useState(false);
  const { token: ownerToken } = useOwnerToken(vendor.slug);
  const [setupOpen, setSetupOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [storefrontProfile, setStorefrontProfile] = useState<StorefrontProfile>(
    () => ({
      tagline: vendor.tagline,
      location: vendor.location,
      deliveryTime: vendor.deliveryTime,
      rating: vendor.rating,
      logoUrl: vendor.logoUrl,
      coverImageUrl: vendor.coverImageUrl,
      description: vendor.description,
    })
  );
  const [businessProfile, setBusinessProfile] = useState<VendorBusinessProfile>(
    () => ({
      name: vendor.name,
      slug: vendor.slug,
      phoneNumber: vendor.phoneNumber,
      businessCategory: vendor.businessCategory,
    })
  );
  const [paymentProfile, setPaymentProfile] = useState<VendorPaymentProfile>(
    () => ({
      payoutMethod: vendor.payoutMethod,
      momoCode: vendor.momoCode,
    })
  );
  const [vendorName, setVendorName] = useState(vendor.name);
  const [vendorPhone, setVendorPhone] = useState(vendor.phoneNumber);
  const [onboardingOverride, setOnboardingOverride] = useState<
    ReturnType<typeof deriveOnboardingState> | null
  >(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [stageFilter, setStageFilter] = useState<KdsStageFilter>("all");
  const [sortDirection, setSortDirection] = useState<KdsSortDirection>("oldest");

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
      setYesterdayGross(snapshot.yesterdayGross);
      setKitchenOpenState(snapshot.kitchenOpen);
  }, []);

  const { sseReconnecting } = useKdsLiveSnapshot(vendor.slug, applySnapshot);
  const { visible: helpPeekVisible, peekHandlers: helpPeekHandlers } =
    usePeekVisibility();

  const sortedOrders = useMemo(
    () => sortKdsQueueOrders(orders, sortDirection),
    [orders, sortDirection]
  );

  const filterCounts = useMemo(() => {
    const counts: Record<KdsStageFilter, number> = {
      all: orders.length,
      new: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
    };
    for (const order of orders) {
      const stage =
        order.kitchenStage ?? kitchenStageForOrderStatus(order.status) ?? "NEW";
      counts[stageFilterGroup(stage)] += 1;
    }
    return counts;
  }, [orders]);

  const queueCounts = useMemo(
    () => ({
      newCount: filterCounts.new,
      preparing: filterCounts.preparing,
      ready: filterCounts.ready,
    }),
    [filterCounts]
  );

  const visibleOrders = useMemo(() => {
    if (stageFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => {
      const stage =
        order.kitchenStage ?? kitchenStageForOrderStatus(order.status) ?? "NEW";
      return stageFilterGroup(stage) === stageFilter;
    });
  }, [sortedOrders, stageFilter]);

  useEffect(() => {
    if (setupAutoOpened) return;
    if (shouldAutoOpenSetupDrawer(vendor.slug, checklist)) {
      incrementSetupVisitCount(vendor.slug);
      setSetupOpen(true);
    }
    setSetupAutoOpened(true);
  }, [vendor.slug, checklist, setupAutoOpened]);

  const openSetup = useCallback(() => {
    setSetupOpen(true);
  }, []);

  const closeSetup = useCallback(() => {
    setSetupOpen(false);
  }, []);
  const refresh = useCallback(async () => {
    const snapshot = await loadKdsSnapshot(vendor.slug);
    applySnapshot(snapshot);
  }, [vendor.slug, applySnapshot]);

  const activeCount = orders.filter(
    (o) => o.status === "PAID" || o.status === "DISPATCHED"
  ).length;

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedIds.has(order.id)),
    [orders, selectedIds]
  );
  const canBulkAssign =
    selectedOrders.length > 0 &&
    selectedOrders.every((order) => resolveOrderStage(order) === "READY");

  const handleAssignDriver = async (driverId: string) => {
    if (!ownerToken || assignOrderIds.length === 0) return;
    setAssignBusy(true);
    try {
      if (assignOrderIds.length === 1) {
        await assignOrderDriver(
          ownerToken,
          vendor.slug,
          assignOrderIds[0]!,
          driverId
        );
      } else {
        await bulkAssignOrderDriver(
          ownerToken,
          vendor.slug,
          assignOrderIds,
          driverId
        );
      }
      setAssignOrderIds([]);
      if (assignOrderIds.length > 1) {
        setSelectedIds(new Set());
        setBulkMode(false);
      }
      await refresh();
    } catch {
      await refresh();
    } finally {
      setAssignBusy(false);
    }
  };

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

  return (
    <div className="kds-dark kds-surface min-h-screen w-full bg-canvas text-ink">
      <div className="kds-surface relative mx-auto min-h-screen w-full max-w-kds overflow-hidden border-x border-hairline bg-canvas pb-10">
        <GradientOrbs className="opacity-25" />

        <MetricsBanner
          vendorName={vendorName}
          todayGross={todayGross}
          yesterdayGross={yesterdayGross}
          activeCount={activeCount}
          queueCounts={queueCounts}
          kitchenOpen={kitchenOpen}
          onToggleKitchen={handleToggleKitchen}
          onOpenMenu={openSetup}
        />

        {!vendor.isActive ? (
          <div className="relative z-[2] mx-[18px] mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            This storefront is suspended by ZanTap. Customers cannot place orders.
          </div>
        ) : null}

        <Tabs
          active={tab}
          onOrders={() => setTab("orders")}
          onMenu={() => setTab("menu")}
          onHistory={() => setTab("history")}
          onDrivers={() => setTab("drivers")}
        />
        <div className="relative z-[1] px-[18px] pt-3.5">
          {tab === "orders" ? (
            <OrdersList
              orders={visibleOrders}
              vendorPhone={vendorPhone}
              vendorName={vendorName}
              expandedId={expandedId}
              selectedIds={selectedIds}
              bulkMode={bulkMode}
              kitchenOpen={kitchenOpen}
              sseReconnecting={sseReconnecting}
              stageFilter={stageFilter}
              filterCounts={filterCounts}
              sortDirection={sortDirection}
              onStageFilter={setStageFilter}
              onSortDirection={setSortDirection}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              onSelect={handleToggleSelect}
              onAssign={(id) => setAssignOrderIds([id])}
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
            <DriversPanel
              vendorSlug={vendor.slug}
              drivers={drivers}
              onDriversChange={setDrivers}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        {...helpPeekHandlers}
        className={cn(
          "fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-hairline bg-surface-card text-2xl font-bold text-ink shadow-brand-soft hover:bg-canvas-soft motion-safe:transition-opacity motion-safe:duration-300",
          helpPeekVisible ? "opacity-100" : "pointer-events-none opacity-0 motion-reduce:opacity-100 motion-reduce:pointer-events-auto"
        )}
        aria-label="Open help"
      >
        ?
      </button>

      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        vendorSlug={vendor.slug}
      />

      <SetupDrawer
        open={setupOpen}
        onClose={closeSetup}
        checklist={checklist}
        vendorSlug={vendor.slug}
        business={businessProfile}
        payments={paymentProfile}
        profile={storefrontProfile}
        menu={menu}
        onProfileSaved={setStorefrontProfile}
        onBusinessSaved={(saved) => {
          setBusinessProfile(saved);
          setVendorName(saved.name);
          setVendorPhone(saved.phoneNumber);
        }}
        onPaymentsSaved={setPaymentProfile}
        onRefresh={refreshOnboarding}
      />

      <Coachmark
        id="kitchen-toggle"
        targetSelector='[data-coachmark-target="kitchen-toggle"]'
        title="Kitchen status"
        body="Toggle OPEN when you're ready to accept orders. Let customers know when you're accepting orders."
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
        title="Assign a driver"
        body="When an order is ready, expand the ticket and assign a driver to keep delivery records."
        enabled={tab === "orders" && !!expandedId}
      />

      <AssignDriverModal
        open={assignOrderIds.length > 0}
        orderIds={assignOrderIds}
        drivers={drivers}
        busy={assignBusy}
        onClose={() => setAssignOrderIds([])}
        onAssign={(driverId) => void handleAssignDriver(driverId)}
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        busy={bulkBusy || assignBusy}
        canAssignDriver={canBulkAssign}
        onClear={() => setSelectedIds(new Set())}
        onBulkAdvance={handleBulkAdvance}
        onBulkAssign={() => setAssignOrderIds(Array.from(selectedIds))}
      />
    </div>
  );
}
