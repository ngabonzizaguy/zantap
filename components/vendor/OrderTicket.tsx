"use client";

import { translateKdsLabel, translateKdsStatus } from "@/lib/i18n/kds-labels";
import { formatKdsRelativeTime } from "@/lib/i18n/kds-time";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { useEffect, useState } from "react";
import type { KitchenStage, Order } from "@/lib/types";
import {
  formatPhoneDisplay,
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
import { formatOrderItemAddOns } from "@/lib/menu/add-ons";

const URGENCY_RING: Record<
  ReturnType<typeof getPaidAgeUrgency>,
  string | undefined
> = {
  normal: undefined,
  warning: "ring-1 ring-amber-500/45",
  critical: "ring-1 ring-error/55",
};

const COLLAPSE_MS = 300;

/**
 * Height-animated disclosure via the grid-rows 0fr→1fr technique — no
 * measuring, no layout thrash. Children stay mounted through the collapse
 * so the close animates instead of the content vanishing in one frame.
 */
function Collapse({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [closing, setClosing] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => setClosing(false), COLLAPSE_MS);
    return () => clearTimeout(timer);
  }, [closing]);

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      )}
    >
      <div className="min-h-0 overflow-hidden">
        {open || closing ? children : null}
      </div>
    </div>
  );
}

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
  featureWhatsappNotify: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAssign: () => void;
  onAdvanceStage: (stage: KitchenStage) => void;
}

export function OrderTicket({
  order,
  vendorPhone,
  vendorName,
  expanded,
  selected,
  bulkMode,
  featureWhatsappNotify,
  onToggle,
  onSelect,
  onAssign,
  onAdvanceStage,
}: OrderTicketProps) {
  const t = useKdsTranslation();
  const stage = resolveKitchenStage(order);
  const stageStyle = kitchenStageStyle(stage);
  const isOutForDelivery =
    stage === "OUT_FOR_DELIVERY" || stage === "COMPLETED";
  const isNew = stage === "NEW";
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
    featureWhatsappNotify &&
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
            aria-label={selected ? t("kds.order-ticket.deselect-order") : t("kds.order-ticket.select-order")}
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
                  stageStyle.badge,
                  isNew && "shadow-[0_0_8px_rgba(168,85,247,0.35)]"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    stageStyle.dot,
                    isNew && "animate-pulse"
                  )}
                />
                {translateKdsStatus(t, stage)}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              {paid && (
                <Badge
                  variant="success"
                  className="inline-flex h-[20px] gap-1 normal-case tracking-normal"
                >
                  <span className="h-[5px] w-[5px] rounded-full bg-success" />{t("kds.order-ticket.paid-via-momo")}</Badge>
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
                {t(itemCount === 1 ? "kds.counts.item" : "kds.counts.items", { count: itemCount })} · {formatKdsRelativeTime(t, ageSource)}
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

      <Collapse open={expanded}>
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
                  → {translateKdsStatus(t, target)}
                </Button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-dashed border-hairline pt-3.5">
            {order.orderItems.map((item) => {
              const thumbUrl =
                item.menuItem?.imageUrl ??
                item.menuItem?.images?.[0]?.url;
              return (
                <div key={item.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2.5">
                    {thumbUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={thumbUrl}
                        alt=""
                        className="h-[42px] w-[42px] flex-none rounded-brand-md object-cover"
                      />
                    ) : (
                      <span className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-brand-md border border-hairline bg-surface-strong">
                        <Icon name="plate" size={18} className="text-muted" strokeWidth={1.8} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="font-body text-body-md font-medium text-ink">
                        {item.quantity}{t("kds.order-ticket.x")}{" "}{item.menuItem?.name ?? t("kds.order-ticket.item-2")}
                      </span>
                      <span className="mt-0.5 block font-body text-caption font-medium text-primary">
                        {item.sizeLabel ? `${item.sizeLabel} · ` : ""}
                        {formatRwf(item.unitPriceRwf)}{" "}{t("kds.order-ticket.each")}</span>
                    </div>
                  </div>
                  {item.notes && (
                    <p className="pl-[52px] font-body text-body-sm italic text-muted">
                      &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                  {formatOrderItemAddOns(item.addOnSelections) && (
                    <p className="pl-[52px] font-body text-body-sm text-muted">+ {formatOrderItemAddOns(item.addOnSelections)}</p>
                  )}
                </div>
              );
            })}
          </div>

          <a
            href={`tel:${order.customerPhone}`}
            className="mt-[15px] flex items-center gap-2.5 rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline"
          >
            <Icon name="phone" size={18} className="flex-none text-primary" strokeWidth={2} />
            <div>
              <div className="font-body text-caption-uppercase uppercase text-muted">{t("kds.order-ticket.customer")}</div>
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
              <div className="font-body text-caption-uppercase uppercase text-muted">{t("kds.order-ticket.location")}</div>
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
              title={vendorE164 ? undefined : t("kds.order-ticket.add-vendor-phone-in-setup")}
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
              </svg>{t("kds.order-ticket.notify-vendor-on-whatsapp")}</Button>
          )}

          {order.assignedDriver ? (
            <a
              href={`tel:${order.assignedDriver.phone}`}
              className="mt-3.5 flex min-h-[60px] items-center gap-[13px] rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline transition-colors hover:bg-canvas-soft"
            >
              <div
                className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-brand-lg text-base font-medium"
                style={{
                  background: `${order.assignedDriver.hue}26`,
                  border: `1.5px solid ${order.assignedDriver.hue}73`,
                  color: order.assignedDriver.hue,
                }}
              >
                {order.assignedDriver.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-body text-caption-uppercase uppercase text-muted">{t("kds.order-ticket.assigned-driver")}</div>
                <div className="font-body text-body-md font-medium text-ink">
                  {order.assignedDriver.name}
                </div>
                <div className="font-mono font-body text-body-sm text-muted">
                  {formatPhoneDisplay(order.assignedDriver.phone)}
                </div>
              </div>
              <span className="flex h-[42px] flex-none items-center gap-1.5 rounded-pill border border-success/40 bg-success/10 px-4 font-body text-body-sm font-medium text-success">
                <Icon name="call" size={17} strokeWidth={2.3} />{t("kds.order-ticket.call")}</span>
            </a>
          ) : null}

          {stage === "READY" && (
            <Button
              type="button"
              size="kds"
              variant="primary"
              data-coachmark-target="dispatch-button"
              onClick={onAssign}
              className="mt-3.5 w-full gap-2.5"
            >
              <Icon name="dispatch" size={22} strokeWidth={2.3} />
              {order.assignedDriver ? t("kds.order-ticket.change-driver") : t("kds.order-ticket.assign-driver")}
            </Button>
          )}

          {stage === "READY" && (
            <Button
              type="button"
              variant="outline"
              size="kds"
              onClick={() => onAdvanceStage("OUT_FOR_DELIVERY")}
              className="mt-2.5 w-full gap-2"
            >
              <Icon name="dispatch" size={18} strokeWidth={2.3} />{t("kds.order-ticket.mark-out-for-delivery")}</Button>
          )}

          {stage === "OUT_FOR_DELIVERY" && (
            <Button
              type="button"
              variant="outline"
              size="kds"
              onClick={onAssign}
              className="mt-3.5 w-full gap-2"
            >
              <Icon name="dispatch" size={18} strokeWidth={2.3} />
              {order.assignedDriver ? t("kds.order-ticket.change-driver") : t("kds.order-ticket.assign-driver")}
            </Button>
          )}

          {canComplete && (
            <button
              type="button"
              onClick={() => onAdvanceStage("COMPLETED")}
              className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-pill border border-success/40 bg-success/10 font-body text-body-sm font-medium text-success transition-colors hover:bg-success/15"
            >
              <Icon name="check" size={18} strokeWidth={2.4} />{t("kds.order-ticket.mark-completed")}</button>
          )}
        </div>
      </Collapse>
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
  page: number;
  pageCount: number;
  totalOrders: number;
  newOrderCount: number;
  featureWhatsappNotify: boolean;
  onStageFilter: (filter: KdsStageFilter) => void;
  onSortDirection: (direction: KdsSortDirection) => void;
  onPageChange: (page: number) => void;
  onViewNewOrders: () => void;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
  onAssign: (id: string) => void;
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
  page,
  pageCount,
  totalOrders,
  newOrderCount,
  featureWhatsappNotify,
  onStageFilter,
  onSortDirection,
  onPageChange,
  onViewNewOrders,
  onToggle,
  onSelect,
  onSelectAll,
  onAssign,
  onAdvanceStage,
  onToggleBulkMode,
}: OrdersListProps) {
  const t = useKdsTranslation();

  return (
    <div className="flex flex-col gap-3">
      {sseReconnecting && (
        <div className="flex items-center justify-center gap-2 rounded-brand-md border border-amber-500/25 bg-amber-500/10 px-3 py-2">
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400"
            aria-hidden
          />
          <span className="font-body text-caption font-medium text-amber-300">{t("kds.order-ticket.reconnecting")}</span>
        </div>
      )}

      {newOrderCount > 0 && (
        <div
          className="flex flex-col gap-2 rounded-brand-md border border-amber-500/25 bg-amber-500/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
          aria-live="polite"
        >
          <span className="font-body text-body-sm font-medium text-amber-200">
            {t(newOrderCount === 1 ? "kds.counts.new-order" : "kds.counts.new-orders", { count: newOrderCount })}</span>
          <Button type="button" variant="outline" size="default" onClick={onViewNewOrders}>{t("kds.order-ticket.view-page-1-2")}</Button>
        </div>
      )}

      {!kitchenOpen && (
        <Card padding="sm" className="flex items-center gap-2.5">
          <Icon name="close" size={18} className="text-muted" strokeWidth={2.2} />
          <div>
            <div className="font-body text-body-sm font-medium text-ink">{t("kds.order-ticket.kitchen-closed")}</div>
            <div className="font-body text-caption text-muted">{t("kds.order-ticket.customers-cannot-place-new-orders-existing-tickets-stay-visible")}</div>
          </div>
        </Card>
      )}

      <div
        className="zt-hidescroll -mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-0.5 snap-x snap-mandatory"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
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
                "flex flex-none snap-start items-center gap-1.5 rounded-brand-md px-3.5 py-2 font-body text-body-sm font-medium transition-colors",
                chip.text,
                active ? chip.activeBg : cn(chip.bg, "hover:opacity-90")
              )}
            >
              {translateKdsLabel(t, label)}
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {orders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
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
              {bulkMode ? t("kds.order-ticket.done-selecting") : t("kds.order-ticket.select")}
            </button>
            {bulkMode ? (
              <button
                type="button"
                onClick={onSelectAll}
                className="font-body text-body-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {orders.every((order) => selectedIds.has(order.id))
                  ? t("kds.order-ticket.clear-page")
                  : t("kds.order-ticket.select-all-value1", { value1: orders.length })}
              </button>
            ) : null}
          </div>

          <Select
            variant="pill"
            align="end"
            value={sortDirection}
            onChange={onSortDirection}
            options={SORT_OPTIONS.map((option) => ({ ...option, label: translateKdsLabel(t, option.label) }))}
            ariaLabel={t("kds.order-ticket.sort-orders")}
            prefix={
              <>
                <Icon name="orders" size={14} className="text-muted" strokeWidth={2.1} />
                <span>{t("kds.order-ticket.sort")}</span>
              </>
            }
          />
        </div>
      )}

      <p className="font-body text-body-sm text-muted" aria-live="polite">
        {t(totalOrders === 1 ? "kds.counts.matching-order" : "kds.counts.matching-orders", { count: totalOrders, page, pages: pageCount })}
      </p>

      {orders.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full border border-hairline bg-surface-strong">
            <Icon name="check" size={34} className="text-success" strokeWidth={2.4} />
          </div>
          <div className="font-display text-display-sm text-ink">
            {kitchenOpen ? t("kds.order-ticket.all-caught-up") : t("kds.order-ticket.no-active-orders")}
          </div>
          <div className="mt-1.5 font-body text-body-sm text-muted">
            {kitchenOpen
              ? t("kds.order-ticket.no-orders-match-this-filter-new-paid-orders-appear-here-instantl")
              : t("kds.order-ticket.open-the-kitchen-when-you-are-ready-to-accept-orders")}
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
              featureWhatsappNotify={featureWhatsappNotify}
              onToggle={() => onToggle(order.id)}
              onSelect={() => onSelect(order.id)}
              onAssign={() => onAssign(order.id)}
              onAdvanceStage={(stage) => onAdvanceStage(order.id, stage)}
            />
          ))}
        </div>
      )}

      <nav className="flex items-center justify-between gap-3" aria-label={t("kds.order-ticket.live-order-pages")}>
        <Button
          type="button"
          variant="outline"
          size="kds"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >{t("kds.order-ticket.previous")}</Button>
        <span className="font-body text-body-sm text-muted">{t("kds.counts.page", { page, pages: pageCount })}
        </span>
        <Button
          type="button"
          variant="outline"
          size="kds"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
        >{t("kds.order-ticket.next")}</Button>
      </nav>
    </div>
  );
}
