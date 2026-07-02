"use client";

import type { KitchenStage, Order } from "@/lib/types";
import {
  formatKitchenStageLabel,
  formatPhoneDisplay,
  formatRelativeTime,
  formatRwf,
  getPaidAgeUrgency,
  orderDisplayId,
} from "@/lib/format";
import {
  forwardKitchenStages,
  kitchenStageForOrderStatus,
} from "@/lib/kds/kitchen-stage";
import {
  KDS_STAGE_FILTERS,
  filterChipStyle,
  kitchenStageStyle,
  type KdsStageFilter,
} from "@/lib/kds/stage-styles";
import type { KdsSortDirection } from "@/lib/kds/kitchen-stage";
import { Icon } from "@/components/ui/Icon";
import { Badge, Button, Card, Select } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { getBaseUrl } from "@/lib/base-url";
import { buildVendorWhatsAppUrl, toWhatsAppE164 } from "@/lib/whatsapp";

const URGENCY_RING: Record<
  ReturnType<typeof getPaidAgeUrgency>,
  string | undefined
> = {
  normal: undefined,
  warning: "ring-1 ring-amber-500/45",
  critical: "ring-1 ring-error/55",
};

function resolveKitchenStage(order: Order): KitchenStage {
  return (
    order.kitchenStage ??
    kitchenStageForOrderStatus(order.status) ??
    "NEW"
  );
}

interface OrderTicketProps {
  order: Order;
  vendorPhone: string;
  vendorName: string;
  expanded: boolean;
  selected: boolean;
  bulkMode: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDispatch: () => void;
  onAdvanceStage: (stage: KitchenStage) => void;
}

export function OrderTicket({
  order,
  vendorPhone,
  vendorName,
  expanded,
  selected,
  bulkMode,
  onToggle,
  onSelect,
  onDispatch,
  onAdvanceStage,
}: OrderTicketProps) {
  const stage = resolveKitchenStage(order);
  const stageStyle = kitchenStageStyle(stage);
  const isOutForDelivery =
    stage === "OUT_FOR_DELIVERY" || stage === "COMPLETED";
  const paid =
    order.status === "PAID" ||
    order.status === "DISPATCHED" ||
    order.status === "COMPLETED";
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const ageSource = order.paidAt ?? order.createdAt;
  const showUrgency = !isOutForDelivery;
  const urgency = showUrgency ? getPaidAgeUrgency(order.paidAt) : "normal";
  const forwardStages = forwardKitchenStages(stage).filter(
    (s) => s !== "OUT_FOR_DELIVERY" && s !== "COMPLETED"
  );
  const canComplete = stage === "OUT_FOR_DELIVERY";
  const vendorE164 = toWhatsAppE164(vendorPhone);
  const showVendorWhatsAppNotify =
    order.status === "PAID" &&
    stage !== "OUT_FOR_DELIVERY" &&
    stage !== "COMPLETED";

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden transition-colors",
        isOutForDelivery && "opacity-75",
        expanded && "border-primary/40 ring-1 ring-primary/50",
        !expanded && showUrgency && URGENCY_RING[urgency]
      )}
    >
      <div className="flex items-stretch">
        {bulkMode && !isOutForDelivery && (
          <button
            type="button"
            onClick={onSelect}
            className="flex w-12 flex-none items-center justify-center border-r border-hairline"
            aria-label={selected ? "Deselect order" : "Select order"}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-brand-sm border",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-hairline-strong bg-surface-card"
              )}
            >
              {selected && (
                <Icon name="check" size={14} className="text-primary" strokeWidth={2.8} />
              )}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex min-h-[64px] flex-1 items-center gap-3 px-4 py-3.5 text-left"
        >
          <div
            className={cn(
              "flex h-[46px] w-[46px] flex-none items-center justify-center rounded-brand-lg border",
              stageStyle.tile
            )}
          >
            <Icon
              name="plate"
              size={22}
              className={stageStyle.icon}
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-display-sm text-ink">
                {orderDisplayId(order.id)}
              </span>
              <span
                className={cn(
                  "inline-flex h-[24px] items-center gap-1.5 rounded-pill px-2.5 font-body text-caption-uppercase uppercase tracking-wide",
                  stageStyle.badge
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", stageStyle.dot)} />
                {formatKitchenStageLabel(stage)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {paid && (
                <Badge
                  variant="success"
                  className="inline-flex h-[20px] gap-1 normal-case tracking-normal"
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-success" />
                  Paid via MoMo
                </Badge>
              )}
              <span
                className={cn(
                  "flex items-center gap-1.5 font-body text-body-sm",
                  urgency === "critical"
                    ? "text-error"
                    : urgency === "warning"
                      ? "text-amber-400"
                      : "text-muted"
                )}
              >
                {urgency !== "normal" && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 flex-none animate-pulse rounded-full",
                      urgency === "critical" ? "bg-error" : "bg-amber-400"
                    )}
                    aria-hidden
                  />
                )}
                {itemCount} item{itemCount === 1 ? "" : "s"} · {formatRelativeTime(ageSource)}
              </span>
            </div>
          </div>
          <div className="flex flex-none items-center gap-2.5">
            <span className="font-body text-body-strong font-semibold text-primary">
              {formatRwf(order.totalAmount)}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(
                "flex-none text-muted transition-transform",
                expanded && "rotate-180"
              )}
              aria-hidden
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0.5">
          {forwardStages.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {forwardStages.map((target) => (
                <Button
                  key={target}
                  type="button"
                  variant="outline"
                  size="kds"
                  className="rounded-pill px-4 font-body text-caption-uppercase uppercase tracking-wide"
                  onClick={() => onAdvanceStage(target)}
                >
                  → {formatKitchenStageLabel(target)}
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-dashed border-hairline pt-3.5">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-baseline gap-2.5">
                <span className="min-w-[42px] font-display text-display-sm text-ink">
                  {item.quantity}x
                </span>
                <span className="font-body text-body-md font-medium text-ink">
                  {item.menuItem?.name ?? "Item"}
                </span>
              </div>
            ))}
          </div>

          <a
            href={`tel:${order.customerPhone}`}
            className="mt-[15px] flex items-center gap-2.5 rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline"
          >
            <Icon name="phone" size={18} className="flex-none text-primary" strokeWidth={2} />
            <div>
              <div className="font-body text-caption-uppercase uppercase text-muted">
                Customer
              </div>
              <div className="font-mono font-body text-body-md font-medium text-ink">
                {formatPhoneDisplay(order.customerPhone)}
              </div>
            </div>
          </a>

          <div className="mt-2.5 flex items-start gap-2.5 rounded-brand-lg border border-hairline bg-surface-strong p-3.5">
            <Icon
              name="location"
              size={18}
              className="mt-0.5 flex-none text-primary"
              strokeWidth={2.1}
            />
            <div>
              <div className="font-body text-caption-uppercase uppercase text-muted">
                Location
              </div>
              <div className="font-body text-body-md font-medium leading-snug text-ink">
                {order.deliverySector} — {order.landmark}
              </div>
            </div>
          </div>

          {showVendorWhatsAppNotify && (
            <Button
              type="button"
              variant="outline"
              size="kds"
              disabled={!vendorE164}
              title={vendorE164 ? undefined : "Add vendor phone in setup"}
              onClick={() => {
                if (!vendorE164) return;
                const url = buildVendorWhatsAppUrl(
                  vendorPhone,
                  order,
                  vendorName,
                  getBaseUrl()
                );
                window.open(url, "_blank", "noopener");
              }}
              className="mt-3.5 w-full gap-2.5 border-[#25D366]/35 text-[#25D366] hover:bg-[#25D366]/10"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2zm5.8 14.13c-.24.68-1.42 1.31-1.95 1.36-.5.05-1.13.27-3.82-.8-3.21-1.27-5.26-4.54-5.42-4.75-.16-.21-1.3-1.73-1.3-3.3 0-1.57.82-2.34 1.12-2.66.3-.32.65-.4.86-.4.21 0 .43 0 .61.01.2.01.46-.07.72.55.27.64.92 2.21 1 2.37.08.16.13.35.03.56-.1.21-.16.34-.31.53-.16.18-.33.41-.47.55-.16.16-.32.33-.14.64.18.32.8 1.32 1.72 2.14 1.18 1.05 2.18 1.38 2.49 1.54.31.16.49.13.67-.08.18-.21.77-.9.98-1.21.21-.32.42-.26.71-.16.29.11 1.85.87 2.17 1.03.32.16.53.24.61.37.08.14.08.78-.16 1.46z" />
              </svg>
              Notify vendor on WhatsApp
            </Button>
          )}

          {stage !== "OUT_FOR_DELIVERY" && stage !== "COMPLETED" && (
            <Button
              type="button"
              size="kds"
              variant="primary"
              data-coachmark-target="dispatch-button"
              onClick={onDispatch}
              className="mt-3.5 w-full gap-2.5"
            >
              <Icon name="dispatch" size={22} strokeWidth={2.3} />
              Dispatch moto driver
            </Button>
          )}

          {stage === "OUT_FOR_DELIVERY" && (
            <Button
              type="button"
              variant="outline"
              size="kds"
              onClick={onDispatch}
              className="mt-3.5 w-full gap-2"
            >
              <Icon name="check" size={18} className="text-success" strokeWidth={2.4} />
              Driver dispatched · Re-share slip
            </Button>
          )}

          {canComplete && (
            <button
              type="button"
              onClick={() => onAdvanceStage("COMPLETED")}
              className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-pill border border-success/40 bg-success/10 font-body text-body-sm font-medium text-success transition-colors hover:bg-success/15"
            >
              <Icon name="check" size={18} strokeWidth={2.4} />
              Mark completed
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

interface OrdersListProps {
  orders: Order[];
  vendorPhone: string;
  vendorName: string;
  expandedId: string | null;
  selectedIds: Set<string>;
  bulkMode: boolean;
  kitchenOpen: boolean;
  sseReconnecting: boolean;
  stageFilter: KdsStageFilter;
  filterCounts: Record<KdsStageFilter, number>;
  sortDirection: KdsSortDirection;
  onStageFilter: (filter: KdsStageFilter) => void;
  onSortDirection: (direction: KdsSortDirection) => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onDispatch: (id: string) => void;
  onAdvanceStage: (id: string, stage: KitchenStage) => void;
  onToggleBulkMode: () => void;
}

const SORT_LABELS: Record<KdsSortDirection, string> = {
  oldest: "Oldest",
  newest: "Newest",
};

const SORT_OPTIONS = (Object.keys(SORT_LABELS) as KdsSortDirection[]).map((dir) => ({
  value: dir,
  label: SORT_LABELS[dir],
}));

export function OrdersList({
  orders,
  vendorPhone,
  vendorName,
  expandedId,
  selectedIds,
  bulkMode,
  kitchenOpen,
  sseReconnecting,
  stageFilter,
  filterCounts,
  sortDirection,
  onStageFilter,
  onSortDirection,
  onToggle,
  onSelect,
  onDispatch,
  onAdvanceStage,
  onToggleBulkMode,
}: OrdersListProps) {

  return (
    <div className="flex flex-col gap-3">
      {sseReconnecting && (
        <div className="flex items-center justify-center gap-2 rounded-brand-md border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400"
            aria-hidden
          />
          <span className="font-body text-caption font-medium text-amber-300">
            Reconnecting…
          </span>
        </div>
      )}

      {!kitchenOpen && (
        <Card padding="sm" className="flex items-center gap-2.5">
          <Icon name="close" size={18} className="text-muted" strokeWidth={2.2} />
          <div>
            <div className="font-body text-body-sm font-medium text-ink">
              Kitchen closed
            </div>
            <div className="font-body text-caption text-muted">
              Customers cannot place new orders. Existing tickets stay visible below.
            </div>
          </div>
        </Card>
      )}

      <div className="zt-hidescroll -mx-[18px] flex gap-2 overflow-x-auto px-[18px] pb-1">
        {KDS_STAGE_FILTERS.map(({ id, label }) => {
          const active = stageFilter === id;
          const count = filterCounts[id];
          const chip = filterChipStyle(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onStageFilter(id)}
              className={cn(
                "flex flex-none items-center gap-1.5 rounded-brand-md px-3.5 py-2 font-body text-body-sm font-medium transition-colors",
                chip.text,
                active ? chip.activeBg : cn(chip.bg, "hover:opacity-90")
              )}
            >
              {label}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {orders.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onToggleBulkMode}
            className={cn(
              "flex items-center gap-2 font-body text-body-sm font-medium transition-colors",
              bulkMode ? "text-primary" : "text-muted hover:text-ink"
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-brand-sm border",
                bulkMode
                  ? "border-primary bg-primary/10"
                  : "border-hairline-strong"
              )}
            >
              {bulkMode && (
                <Icon name="check" size={12} className="text-primary" strokeWidth={2.8} />
              )}
            </span>
            Select
          </button>

          <Select
            variant="pill"
            align="end"
            value={sortDirection}
            onChange={onSortDirection}
            options={SORT_OPTIONS}
            ariaLabel="Sort orders"
            prefix={
              <>
                <Icon name="orders" size={14} className="text-muted" strokeWidth={2.1} />
                <span>Sort:</span>
              </>
            }
          />
        </div>
      )}

      {orders.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full border border-hairline bg-surface-strong">
            <Icon name="check" size={34} className="text-success" strokeWidth={2.4} />
          </div>
          <div className="font-display text-display-sm text-ink">
            {kitchenOpen ? "All caught up" : "No active orders"}
          </div>
          <div className="mt-1.5 font-body text-body-sm text-muted">
            {kitchenOpen
              ? "No orders match this filter. New paid orders appear here instantly."
              : "Open the kitchen when you are ready to accept orders."}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              vendorPhone={vendorPhone}
              vendorName={vendorName}
              expanded={expandedId === order.id}
              selected={selectedIds.has(order.id)}
              bulkMode={bulkMode}
              onToggle={() => onToggle(order.id)}
              onSelect={() => onSelect(order.id)}
              onDispatch={() => onDispatch(order.id)}
              onAdvanceStage={(stage) => onAdvanceStage(order.id, stage)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
