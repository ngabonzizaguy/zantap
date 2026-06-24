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
import { cn } from "@/lib/cn";

const HUES = ["#F5945F", "#E87FA3", "#A78FE0", "#79B7E0"];

const URGENCY_BORDER: Record<
  ReturnType<typeof getPaidAgeUrgency>,
  string | undefined
> = {
  normal: undefined,
  warning: "ring-1 ring-amber-500/35 animate-zkpulse",
  critical: "ring-2 ring-red-500/45 animate-zkpulse",
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
  const paid =
    order.status === "PAID" ||
    order.status === "DISPATCHED" ||
    order.status === "COMPLETED";
  const hue = isOutForDelivery ? "#8a766a" : HUES[index % HUES.length];
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const ageSource = order.paidAt ?? order.createdAt;
  const showUrgency = !isOutForDelivery;
  const urgency = showUrgency ? getPaidAgeUrgency(order.paidAt) : "normal";
  const forwardStages = forwardKitchenStages(stage).filter(
    (s) => s !== "OUT_FOR_DELIVERY" && s !== "COMPLETED"
  );
  const canComplete = stage === "OUT_FOR_DELIVERY";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px]",
        isOutForDelivery
          ? "border-[1.5px] border-[#2f261d] border-l-4 border-l-[#6f5d4f] bg-[#1b1510] opacity-80 shadow-[0_6px_18px_rgba(0,0,0,0.3)]"
          : "border-[1.5px] border-zk-border bg-zk-surface shadow-kds",
        showUrgency && URGENCY_BORDER[urgency]
      )}
      style={
        isOutForDelivery
          ? undefined
          : {
              borderLeftColor: hue,
              boxShadow: `0 10px 28px rgba(0,0,0,0.42), 0 0 0 1px ${hue}10`,
            }
      }
    >
      <div className="flex items-stretch">
        {bulkMode && !isOutForDelivery && (
          <button
            type="button"
            onClick={onSelect}
            className="flex w-12 flex-none items-center justify-center border-r border-zk-border/60"
            aria-label={selected ? "Deselect order" : "Select order"}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md border-[1.5px]",
                selected
                  ? "border-momo bg-momo/25"
                  : "border-zk-border bg-zk-surface"
              )}
            >
              {selected && (
                <Icon name="check" size={14} className="text-momo" strokeWidth={2.8} />
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
            className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[15px]"
            style={{
              background: `${hue}26`,
              border: `1.5px solid ${hue}73`,
            }}
          >
            <Icon name="plate" size={24} style={{ stroke: hue }} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[25px] font-extrabold tracking-tight text-zk-text">
                {orderDisplayId(order.id)}
              </span>
              <span className="inline-flex h-[27px] items-center gap-1.5 rounded-full border border-momo/55 bg-momo/15 px-2.5 shadow-[0_0_14px_rgba(245,166,35,0.28)]">
                <Icon name="dispatch" size={12} className="text-momo" strokeWidth={2.3} />
                <span className="text-[11px] font-extrabold tracking-wide text-momo">
                  {formatKitchenStageLabel(stage)}
                </span>
              </span>
              {paid && (
                <span className="inline-flex h-[22px] items-center gap-1 rounded-full border border-green-500/35 bg-green-500/10 px-2">
                  <span className="h-[5px] w-[5px] rounded-full bg-green-400/80" />
                  <span className="text-[10px] font-bold tracking-wide text-green-400/90">
                    PAID via MoMo
                  </span>
                </span>
              )}
            </div>
            <div
              className={cn(
                "mt-1 text-[13px] font-semibold",
                urgency === "critical"
                  ? "text-red-400/90"
                  : urgency === "warning"
                    ? "text-amber-400/90"
                    : "text-zk-muted"
              )}
            >
              {itemCount} items · {formatRelativeTime(ageSource)}
            </div>
          </div>
          <div className="flex-none text-right">
            <div className="text-[17px] font-extrabold tracking-tight text-momo">
              {formatRwf(order.totalAmount)}
            </div>
            <div className="mt-0.5 text-[11px] font-bold text-zk-dim">
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
                <button
                  key={target}
                  type="button"
                  onClick={() => onAdvanceStage(target)}
                  className="flex h-10 items-center rounded-full border-[1.5px] border-zk-border bg-zk-surface px-3.5 text-[12px] font-extrabold tracking-wide text-zk-text"
                >
                  → {formatKitchenStageLabel(target)}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t-[1.5px] border-dashed border-zk-border pt-3.5">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-baseline gap-2.5">
                <span className="min-w-[42px] text-xl font-extrabold text-momo">
                  {item.quantity}x
                </span>
                <span className="text-[19px] font-bold text-zk-text">
                  {item.menuItem?.name ?? "Item"}
                </span>
              </div>
            ))}
          </div>

          <a
            href={`tel:${order.customerPhone}`}
            className="mt-[15px] flex items-center gap-2 rounded-[13px] border-[1.5px] border-zk-borderDark bg-[#1b130d] p-[13px_14px] no-underline"
          >
            <Icon name="phone" size={18} className="flex-none text-momo" strokeWidth={2} />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-zk-muted">
                Customer
              </div>
              <div className="font-mono text-[15px] font-bold text-[#ede2d9]">
                {formatPhoneDisplay(order.customerPhone)}
              </div>
            </div>
          </a>

          <div className="mt-2.5 flex items-start gap-2 rounded-[13px] border-[1.5px] border-zk-borderDark bg-[#1b130d] p-[13px_14px]">
            <Icon name="location" size={18} className="mt-0.5 flex-none text-[#f5945f]" strokeWidth={2.1} />
            <div className="text-[15px] font-bold leading-snug text-[#ede2d9]">
              {order.deliverySector} — {order.landmark}
            </div>
          </div>

          {stage !== "OUT_FOR_DELIVERY" && stage !== "COMPLETED" && (
            <button
              type="button"
              data-coachmark-target="dispatch-button"
              onClick={onDispatch}
              className="mt-3.5 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-[14px] border-none bg-gradient-to-br from-[#FFC24C] to-[#F5945F] text-base font-extrabold tracking-wide text-[#2a1606] shadow-[0_10px_26px_rgba(245,148,95,0.32)]"
            >
              <Icon name="dispatch" size={22} className="text-[#2a1606]" strokeWidth={2.3} />
              DISPATCH MOTO DRIVER
            </button>
          )}

          {stage === "OUT_FOR_DELIVERY" && (
            <button
              type="button"
              onClick={onDispatch}
              className="mt-3.5 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-zk-border bg-[#1f1812] text-[15px] font-extrabold tracking-wide text-zk-muted"
            >
              <Icon name="check" size={18} className="text-green-400" strokeWidth={2.4} />
              Driver dispatched · Re-share slip
            </button>
          )}

          {canComplete && (
            <button
              type="button"
              onClick={() => onAdvanceStage("COMPLETED")}
              className="mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-green-500/40 bg-green-500/10 text-[14px] font-extrabold tracking-wide text-green-400"
            >
              <Icon name="check" size={18} strokeWidth={2.4} />
              Mark completed
            </button>
          )}
        </div>
      )}
    </div>
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
        <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-amber-500/35 bg-amber-500/10 px-3.5 py-3">
          <span className="h-2 w-2 animate-zkpulse rounded-full bg-amber-400" />
          <div>
            <div className="text-sm font-extrabold text-amber-300">Reconnecting…</div>
            <div className="text-xs font-semibold text-amber-200/70">
              Live updates paused — queue may be stale until the stream recovers.
            </div>
          </div>
        </div>
      )}

      {!kitchenOpen && (
        <div className="flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-zk-border bg-zk-surface px-3.5 py-3">
          <Icon name="close" size={18} className="text-zk-muted" strokeWidth={2.2} />
          <div>
            <div className="text-sm font-extrabold text-zk-text">Kitchen closed</div>
            <div className="text-xs font-semibold text-zk-muted">
              Customers cannot place new orders. Existing tickets stay visible below.
            </div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onToggleBulkMode}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 text-[12px] font-extrabold tracking-wide",
              bulkMode
                ? "border-momo/45 bg-momo/15 text-momo"
                : "border-zk-border bg-zk-surface text-zk-muted"
            )}
          >
            <Icon name="check" size={14} strokeWidth={2.4} />
            {bulkMode ? "Bulk select on" : "Bulk select"}
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="px-5 py-[70px] text-center">
          <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-zk-border bg-zk-surface">
            <Icon name="check" size={34} className="text-green-400" strokeWidth={2.4} />
          </div>
          <div className="text-xl font-extrabold text-zk-text">
            {kitchenOpen ? "All caught up" : "No active orders"}
          </div>
          <div className="mt-1.5 text-sm font-semibold text-zk-muted">
            {kitchenOpen
              ? "No active orders in the queue. New paid orders appear here instantly."
              : "Open the kitchen when you are ready to accept orders."}
          </div>
        </div>
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
