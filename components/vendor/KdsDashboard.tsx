"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Driver, MenuItem, Order, Vendor } from "@/lib/types";
import type { VendorFeatureFlags } from "@/lib/vendor/feature-and-profit-types";
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
import { validateOwnerAccess } from "@/lib/actions/vendor-provision";
import {
  kitchenStageForOrderStatus,
  orderStatusForKitchenStage,
  sortKdsQueueOrders,
  type KdsSortDirection,
} from "@/lib/kds/kitchen-stage";
import { stageFilterGroup, type KdsStageFilter } from "@/lib/kds/stage-styles";
import {
  paginateOrders,
  reconcileDeferredOrderIds,
  type HistoryQuery,
  type LiveOrdersQuery,
} from "@/lib/kds/order-pagination";
import { useKdsLiveSnapshot } from "@/lib/kds/useKdsLiveSnapshot";
import { usePeekVisibility } from "@/lib/kds/usePeekVisibility";
import { KDS_COACHMARKS_ENABLED } from "@/lib/kds/feature-flags";
import type { KdsSnapshot } from "@/lib/kds/types";
import type { PaginatedInventory } from "@/lib/inventory/types";
import type { InventoryCategory } from "@/lib/inventory/types";
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
import { InventoryPanel } from "@/components/vendor/InventoryPanel";
import { VendorUpdatesPanel } from "@/components/vendor/VendorUpdatesPanel";
import { RecoverAccessDialog } from "@/components/onboard/RecoverAccessDialog";
import { ProfitPanel } from "@/components/vendor/ProfitPanel";
import { SetupDrawer, type StorefrontProfile, type VendorBusinessProfile, type VendorPaymentProfile } from "@/components/vendor/SetupDrawer";
import { HelpModal } from "@/components/vendor/HelpModal";
import { Coachmark } from "@/components/vendor/Coachmark";
import { InstallHintBanner } from "@/components/pwa/InstallHintBanner";
import { Card, GradientOrbs } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { VisualGuideId } from "@/lib/kds/visual-guides";

const VisualGuideViewer = dynamic(
  () =>
    import("@/components/vendor/VisualGuideViewer").then(
      (module) => module.VisualGuideViewer
    ),
  { ssr: false }
);

const KDS_TABS = new Set<KdsTab>(["orders", "menu", "history", "inventory"]);

function parseInitialTab(tab?: string): KdsTab {
  if (tab === "stock") return "inventory";
  if (tab === "setup") return "orders";
  if (tab === "drivers") return "orders";
  if (tab === "profit") return "orders";
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
  initialFeatureFlags: VendorFeatureFlags;
  initialVendorUpdates: KdsSnapshot["vendorUpdates"];
  initialInventory: PaginatedInventory;
  initialInventoryQuery: {
    page: number;
    search: string;
    category: InventoryCategory | "ALL";
    archived: boolean;
  };
  initialLiveOrdersQuery: LiveOrdersQuery;
  initialHistoryQuery: HistoryQuery;
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
  initialFeatureFlags,
  initialVendorUpdates,
  initialInventory,
  initialInventoryQuery,
  initialLiveOrdersQuery,
  initialHistoryQuery,
  initialTab,
}: KdsDashboardProps) {
  const [tab, setTab] = useState<KdsTab>(() => parseInitialTab(initialTab));
  const [orders, setOrders] = useState(initialOrders);
  const [menu, setMenu] = useState(initialMenu);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [todayGross, setTodayGross] = useState(initialTodayGross);
  const [yesterdayGross, setYesterdayGross] = useState(initialYesterdayGross);
  const [kitchenOpen, setKitchenOpenState] = useState(initialKitchenOpen);
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [vendorUpdates, setVendorUpdates] = useState(initialVendorUpdates);
  const [inventoryActiveCount, setInventoryActiveCount] = useState(
    initialInventory.counts.active
  );
  const [expandedId, setExpandedId] = useState<string | null>(
    initialOrders[0]?.id ?? null
  );
  const [assignOrderIds, setAssignOrderIds] = useState<string[]>([]);
  const [assignBusy, setAssignBusy] = useState(false);
  const [setupAutoOpened, setSetupAutoOpened] = useState(false);
  const {
    token: ownerToken,
    clearToken: clearOwnerToken,
    ready: ownerTokenReady,
  } = useOwnerToken(vendor.slug);
  const [setupOpen, setSetupOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [activeVisualGuide, setActiveVisualGuide] =
    useState<VisualGuideId | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [profitOpen, setProfitOpen] = useState(
    () => initialTab === "profit"
  );
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
  const [stageFilter, setStageFilter] = useState<KdsStageFilter>(initialLiveOrdersQuery.stage);
  const [sortDirection, setSortDirection] = useState<KdsSortDirection>(initialLiveOrdersQuery.sort);
  const [livePage, setLivePage] = useState(initialLiveOrdersQuery.page);
  const [deferredOrderIds, setDeferredOrderIds] = useState<Set<string>>(new Set());
  const ordersRef = useRef(orders);
  const livePageRef = useRef(livePage);

  useEffect(() => {
    if (!ownerTokenReady || !ownerToken) return;
    let cancelled = false;
    void validateOwnerAccess(vendor.slug, ownerToken).then((valid) => {
      if (cancelled || valid) return;
      clearOwnerToken();
      setRecoveryOpen(true);
    });
    return () => {
      cancelled = true;
    };
  }, [clearOwnerToken, ownerToken, ownerTokenReady, vendor.slug]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    livePageRef.current = livePage;
  }, [livePage]);

  const liveChecklist = useMemo(
    () => deriveOnboardingState(menu, kitchenOpen, orders, inventoryActiveCount),
    [menu, kitchenOpen, orders, inventoryActiveCount]
  );
  const checklist = onboardingOverride ?? liveChecklist;

  const [prevSnapshot, setPrevSnapshot] = useState({ menu, kitchenOpen, orders });
  if (
    prevSnapshot.menu !== menu ||
    prevSnapshot.kitchenOpen !== kitchenOpen ||
    prevSnapshot.orders !== orders
  ) {
    setPrevSnapshot({ menu, kitchenOpen, orders });
    setOnboardingOverride(null);
  }

  const refreshOnboarding = useCallback(async () => {
    try {
      const state = await loadOnboardingState(vendor.slug);
      setOnboardingOverride(state);
    } catch {
      setOnboardingOverride(null);
    }
  }, [vendor.slug]);

  const applySnapshot = useCallback((snapshot: KdsSnapshot) => {
    setDeferredOrderIds((current) =>
      reconcileDeferredOrderIds(
        ordersRef.current,
        snapshot.orders,
        livePageRef.current,
        current
      )
    );
    setOrders(snapshot.orders);
    setMenu(snapshot.menu);
    setTodayGross(snapshot.todayGross);
    setYesterdayGross(snapshot.yesterdayGross);
    setKitchenOpenState(snapshot.kitchenOpen);
    setFeatureFlags(snapshot.featureFlags);
    setVendorUpdates(snapshot.vendorUpdates);
  }, []);

  const { sseReconnecting } = useKdsLiveSnapshot(vendor.slug, applySnapshot);
  const { visible: helpPeekVisible, peekHandlers: helpPeekHandlers } =
    usePeekVisibility();

  const stableOrders = useMemo(
    () => livePage > 1
      ? orders.filter((order) => !deferredOrderIds.has(order.id))
      : orders,
    [deferredOrderIds, livePage, orders]
  );

  const sortedOrders = useMemo(
    () => sortKdsQueueOrders(stableOrders, sortDirection),
    [stableOrders, sortDirection]
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

  const matchingOrders = useMemo(() => {
    if (stageFilter === "all") return sortedOrders;
    return sortedOrders.filter((order) => {
      const stage =
        order.kitchenStage ?? kitchenStageForOrderStatus(order.status) ?? "NEW";
      return stageFilterGroup(stage) === stageFilter;
    });
  }, [sortedOrders, stageFilter]);

  const livePagination = useMemo(
    () => paginateOrders(matchingOrders, livePage),
    [livePage, matchingOrders]
  );
  const visibleOrders = livePagination.items;

  useEffect(() => {
    if (setupAutoOpened) return;
    if (shouldAutoOpenSetupDrawer(vendor.slug, checklist)) {
      incrementSetupVisitCount(vendor.slug);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage visit-cap is client-only external state; must run post-hydration
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

  const navigateTab = useCallback((target: KdsTab) => {
    setTab(target);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", target);
    window.history.replaceState(null, "", url);
  }, []);

  const openVisualGuide = useCallback((guideId: VisualGuideId) => {
    setHelpOpen(false);
    setActiveVisualGuide(guideId);
  }, []);

  const showOrdersFromGuide = useCallback(() => {
    setActiveVisualGuide(null);
    navigateTab("orders");
    window.requestAnimationFrame(() => {
      const ordersSurface = document.querySelector<HTMLElement>(
        '[data-kds-tab-content="orders"]'
      );
      ordersSurface?.focus({ preventScroll: true });
      ordersSurface?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [navigateTab]);

  const changeLivePage = useCallback((nextPage: number) => {
    setLivePage(Math.max(1, nextPage));
    setSelectedIds(new Set());
    setBulkMode(false);
    setExpandedId(null);
    if (nextPage <= 1) setDeferredOrderIds(new Set());
  }, []);

  const changeStageFilter = useCallback((filter: KdsStageFilter) => {
    setStageFilter(filter);
    changeLivePage(1);
  }, [changeLivePage]);

  const changeSortDirection = useCallback((direction: KdsSortDirection) => {
    setSortDirection(direction);
    changeLivePage(1);
  }, [changeLivePage]);

  const viewNewOrders = useCallback(() => {
    setSortDirection("newest");
    changeLivePage(1);
  }, [changeLivePage]);

  useEffect(() => {
    if (livePagination.page !== livePage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- realtime removals can invalidate the URL-backed page
      changeLivePage(livePagination.page);
    }
  }, [changeLivePage, livePage, livePagination.page]);

  useEffect(() => {
    if (tab !== "orders") return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "orders");
    if (livePagination.page > 1) url.searchParams.set("ordersPage", String(livePagination.page));
    else url.searchParams.delete("ordersPage");
    if (stageFilter !== "all") url.searchParams.set("ordersStage", stageFilter);
    else url.searchParams.delete("ordersStage");
    if (sortDirection !== "newest") url.searchParams.set("ordersSort", sortDirection);
    else url.searchParams.delete("ordersSort");
    window.history.replaceState(null, "", url);
  }, [livePagination.page, sortDirection, stageFilter, tab]);

  const activeCount = orders.filter(
    (o) => o.status === "PAID" || o.status === "DISPATCHED"
  ).length;

  const selectedOrders = useMemo(
    () => visibleOrders.filter((order) => selectedIds.has(order.id)),
    [selectedIds, visibleOrders]
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
    const ids = selectedOrders.map((order) => order.id);
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

  const handleSelectAllVisible = () => {
    setSelectedIds((current) => {
      const allSelected = visibleOrders.length > 0 &&
        visibleOrders.every((order) => current.has(order.id));
      return allSelected
        ? new Set()
        : new Set(visibleOrders.map((order) => order.id));
    });
  };

  return (
    <div className="kds-dark kds-surface min-h-screen w-full bg-canvas text-ink">
      <InstallHintBanner variant="dark" surface="kds" appName="ZanTap Kitchen" />
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
          onOpenProfit={() => setProfitOpen(true)}
        />

        {!vendor.isActive ? (
          <div className="relative z-[2] mx-[18px] mt-3 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            This storefront is suspended by ZanTap. Customers cannot place orders.
          </div>
        ) : null}

        <Tabs
          active={tab}
          onOrders={() => navigateTab("orders")}
          onMenu={() => navigateTab("menu")}
          onHistory={() => navigateTab("history")}
          onInventory={() => navigateTab("inventory")}
        />
        <div
          key={tab}
          className="zt-list-in relative z-[1] px-[18px] pt-3.5"
          data-kds-tab-content={tab}
          tabIndex={-1}
        >
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
              featureWhatsappNotify={featureFlags.featureWhatsappNotify}
              page={livePagination.page}
              pageCount={livePagination.pageCount}
              totalOrders={livePagination.total}
              newOrderCount={deferredOrderIds.size}
              onStageFilter={changeStageFilter}
              onSortDirection={changeSortDirection}
              onPageChange={changeLivePage}
              onViewNewOrders={viewNewOrders}
              onToggle={(id) => setExpandedId((prev) => (prev === id ? null : id))}
              onSelect={handleToggleSelect}
              onSelectAll={handleSelectAllVisible}
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
            <>
              <VendorUpdatesPanel
                key={`${vendorUpdates.activeBatch?.id ?? "empty"}-${vendorUpdates.activeBatch?.revision ?? 0}-${vendorUpdates.settings.enabled}`}
                vendorSlug={vendor.slug}
                initialOverview={vendorUpdates}
                onUnlockEditing={() => setRecoveryOpen(true)}
              />
              <MenuSection
                vendorSlug={vendor.slug}
                items={menu}
                onToggle={handleToggleItem}
                onResetAll={handleResetAll}
                onRefresh={refresh}
                onUnlockEditing={() => setRecoveryOpen(true)}
              />
            </>
          ) : tab === "history" ? (
            <HistoryPanel vendorSlug={vendor.slug} initialQuery={initialHistoryQuery} onUnlockEditing={() => setRecoveryOpen(true)} />
          ) : (
            <InventoryPanel
              vendorSlug={vendor.slug}
              initialResult={initialInventory}
              initialQuery={initialInventoryQuery}
              onActiveCountChange={setInventoryActiveCount}
              onUnlockEditing={() => setRecoveryOpen(true)}
            />
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        {...helpPeekHandlers}
        className={cn(
          "fixed bottom-24 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-hairline/70 bg-surface-card text-sm font-medium text-muted shadow-brand-soft motion-safe:transition-[opacity,color] motion-safe:duration-300",
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
        onOpenVisualGuide={openVisualGuide}
      />

      {activeVisualGuide ? (
        <VisualGuideViewer
          guideId={activeVisualGuide}
          vendorSlug={vendor.slug}
          onClose={() => setActiveVisualGuide(null)}
          onShowMe={showOrdersFromGuide}
        />
      ) : null}

      <RecoverAccessDialog
        open={recoveryOpen}
        onClose={() => setRecoveryOpen(false)}
        initialSlug={vendor.slug}
        onRecovered={() => setRecoveryOpen(false)}
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
        drivers={drivers}
        onProfileSaved={(saved) => {
          setStorefrontProfile(saved);
          void refresh();
        }}
        onBusinessSaved={(saved) => {
          setBusinessProfile(saved);
          setVendorName(saved.name);
          setVendorPhone(saved.phoneNumber);
          void refresh();
        }}
        onPaymentsSaved={setPaymentProfile}
        onRefresh={refreshOnboarding}
        onNavigateTab={navigateTab}
        onOpenKitchen={() => {
          if (!kitchenOpen) void handleToggleKitchen();
        }}
        onDriversChange={setDrivers}
      />

      {KDS_COACHMARKS_ENABLED ? (
        <>
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
        </>
      ) : null}

      <AssignDriverModal
        open={assignOrderIds.length > 0}
        orderIds={assignOrderIds}
        drivers={drivers}
        busy={assignBusy}
        onClose={() => setAssignOrderIds([])}
        onAssign={(driverId) => void handleAssignDriver(driverId)}
      />

      <BulkActionBar
        selectedCount={selectedOrders.length}
        busy={bulkBusy || assignBusy}
        canAssignDriver={canBulkAssign}
        onClear={() => setSelectedIds(new Set())}
        onBulkAdvance={handleBulkAdvance}
        onBulkAssign={() => setAssignOrderIds(selectedOrders.map((order) => order.id))}
      />

      <ProfitPanel
        vendorSlug={vendor.slug}
        open={profitOpen}
        onClose={() => setProfitOpen(false)}
      />
    </div>
  );
}
