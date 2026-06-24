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
import { Icon } from "@/components/ui/Icon";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

const TICKET_ACCENTS = [
  {
    border: "border-l-gradient-peach",
    plate: "border-gradient-peach/45 bg-gradient-peach/20",
    icon: "text-body-strong",
  },
  {
    border: "border-l-gradient-rose",
    plate: "border-gradient-rose/45 bg-gradient-rose/20",
    icon: "text-body-strong",
  },
  {
    border: "border-l-gradient-lavender",
    plate: "border-gradient-lavender/45 bg-gradient-lavender/20",
    icon: "text-body-strong",
  },
  {
    border: "border-l-gradient-sky",
    plate: "border-gradient-sky/45 bg-gradient-sky/20",
    icon: "text-body-strong",
  },
] as const;

const URGENCY_BORDER: Record<
  ReturnType<typeof getPaidAgeUrgency>,
  string | undefined
> = {
  normal: undefined,
  warning: "ring-2 ring-amber-500/40",
  critical: "ring-2 ring-error/50",
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
  index: number;
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
  index,
  expanded,
  selected,
  bulkMode,
  onToggle,
  onSelect,
  onDispatch,
  onAdvanceStage,
}: OrderTicketProps) {
  const stage = resolveKitchenStage(order);
  const isOutForDelivery =
    stage === "OUT_FOR_DELIVERY" || stage === "COMPLETED";
  const accent = TICKET_ACCENTS[index % TICKET_ACCENTS.length];
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

  return (
    <Card
      padding="none"
      className={cn(
        "overflow-hidden border-l-4 shadow-brand-soft",
        isOutForDelivery
          ? "border-l-muted-soft opacity-80"
          : accent.border,
        showUrgency && URGENCY_BORDER[urgency]
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
          className="flex min-h-[60px] flex-1 items-center gap-[13px] px-4 py-3.5 text-left"
        >
          <div
            className={cn(
              "flex h-[52px] w-[52px] flex-none items-center justify-center rounded-brand-lg border",
              isOutForDelivery
                ? "border-hairline bg-surface-strong"
                : accent.plate
            )}
          >
            <Icon
              name="plate"
              size={24}
              className={isOutForDelivery ? "text-muted" : accent.icon}
              strokeWidth={2}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-display-sm text-ink">
                {orderDisplayId(order.id)}
              </span>
              <Badge
                variant="default"
                className="inline-flex h-[27px] normal-case tracking-normal"
              >
                <Icon name="dispatch" size={12} strokeWidth={2.3} />
                {formatKitchenStageLabel(stage)}
              </Badge>
              {paid && (
                <Badge variant="success" className="inline-flex h-[22px] gap-1 normal-case">
                  <span className="h-[5px] w-[5px] rounded-full bg-success" />
                  Paid via MoMo
                </Badge>
              )}
            </div>
            <div
              className={cn(
                "mt-1 flex items-center gap-1.5 font-body text-body-sm font-medium",
                urgency === "critical"
                  ? "text-error"
                  : urgency === "warning"
                    ? "text-amber-600"
                    : "text-muted"
              )}
            >
              {urgency !== "normal" && (
                <span
                  className={cn(
                    "h-1.5 w-1.5 flex-none animate-pulse rounded-full",
                    urgency === "critical" ? "bg-error" : "bg-amber-500"
                  )}
                  aria-hidden
                />
              )}
              <span>
                {itemCount} items · {formatRelativeTime(ageSource)}
              </span>
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="font-body text-body-strong font-medium text-primary">
              {formatRwf(order.totalAmount)}
            </div>
            <div className="mt-0.5 font-body text-caption text-muted-soft">
              {expanded ? "Hide" : "Tap to open"}
            </div>
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
                <span className="min-w-[42px] font-display text-display-sm text-primary">
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
            className="mt-[15px] flex items-center gap-2 rounded-brand-lg border border-hairline bg-surface-strong p-3.5 no-underline transition-colors hover:bg-canvas-soft"
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

          <div className="mt-2.5 flex items-start gap-2 rounded-brand-lg border border-hairline bg-surface-strong p-3.5">
            <Icon
              name="location"
              size={18}
              className="mt-0.5 flex-none text-primary"
              strokeWidth={2.1}
            />
            <div className="font-body text-body-md font-medium leading-snug text-ink">
              {order.deliverySector} — {order.landmark}
            </div>
          </div>

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
  expandedId: string | null;
  selectedIds: Set<string>;
  bulkMode: boolean;
  kitchenOpen: boolean;
  sseReconnecting: boolean;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onDispatch: (id: string) => void;
  onAdvanceStage: (id: string, stage: KitchenStage) => void;
  onToggleBulkMode: () => void;
}

export function OrdersList({
  orders,
  expandedId,
  selectedIds,
  bulkMode,
  kitchenOpen,
  sseReconnecting,
  onToggle,
  onSelect,
  onDispatch,
  onAdvanceStage,
  onToggleBulkMode,
}: OrdersListProps) {
  return (
    <div className="flex flex-col gap-3">
      {sseReconnecting && (
        <Card padding="sm" className="flex items-center gap-2.5 border-amber-500/35 bg-amber-500/10">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          <div>
            <div className="font-body text-body-sm font-medium text-amber-800">
              Reconnecting…
            </div>
            <div className="font-body text-caption text-amber-700/80">
              Live updates paused — queue may be stale until the stream recovers.
            </div>
          </div>
        </Card>
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

      {orders.length > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={onToggleBulkMode}
            className={cn(
              "gap-1.5 font-body text-caption-uppercase uppercase tracking-wide",
              bulkMode && "border-primary/40 bg-primary/5 text-primary"
            )}
          >
            <Icon name="check" size={14} strokeWidth={2.4} />
            {bulkMode ? "Bulk select on" : "Bulk select"}
          </Button>
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
              ? "No active orders in the queue. New paid orders appear here instantly."
              : "Open the kitchen when you are ready to accept orders."}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3.5">
          {orders.map((order, index) => (
            <OrderTicket
              key={order.id}
              order={order}
              index={index}
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
