"use client";

import type { Order } from "@/lib/types";
import { formatRwf, minutesAgo, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const HUES = ["#F5945F", "#E87FA3", "#A78FE0", "#79B7E0"];

interface OrderTicketProps {
  order: Order;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onDispatch: () => void;
}

export function OrderTicket({
  order,
  index,
  expanded,
  onToggle,
  onDispatch,
}: OrderTicketProps) {
  const dispatched = order.status === "DISPATCHED" || order.status === "COMPLETED";
  const paid =
    order.status === "PAID" ||
    order.status === "DISPATCHED" ||
    order.status === "COMPLETED";
  const hue = dispatched ? "#8a766a" : HUES[index % HUES.length];
  const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px]",
        dispatched
          ? "border-[1.5px] border-[#2f261d] border-l-4 border-l-[#6f5d4f] bg-[#1b1510] opacity-80 shadow-[0_6px_18px_rgba(0,0,0,0.3)]"
          : "border-[1.5px] border-zk-border bg-zk-surface shadow-kds"
      )}
      style={
        dispatched
          ? undefined
          : { borderLeftColor: hue, boxShadow: `0 10px 28px rgba(0,0,0,0.42), 0 0 0 1px ${hue}10` }
      }
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-[60px] w-full items-center gap-[13px] px-4 py-3.5 text-left"
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
            {paid && (
              <span className="inline-flex h-[25px] items-center gap-1.5 rounded-full border border-green-500/50 bg-green-500/15 px-2.5 shadow-[0_0_14px_rgba(34,197,94,0.3)]">
                <span className="h-[7px] w-[7px] animate-zkpulse rounded-full bg-green-400" />
                <span className="text-[11px] font-extrabold tracking-wide text-green-400">
                  PAID via MoMo
                </span>
              </span>
            )}
            {dispatched && (
              <span className="inline-flex h-[25px] items-center gap-1.5 rounded-full border border-momo/55 bg-momo/15 px-2.5 shadow-[0_0_14px_rgba(245,166,35,0.3)]">
                <Icon name="dispatch" size={13} className="text-momo" strokeWidth={2.3} />
                <span className="text-[11px] font-extrabold tracking-wide text-momo">
                  DISPATCHED
                </span>
              </span>
            )}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-zk-muted">
            {itemCount} items · {minutesAgo(order.createdAt)} min ago
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

      {expanded && (
        <div className="px-4 pb-4 pt-0.5">
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
          <div className="mt-[15px] flex items-start gap-2 rounded-[13px] border-[1.5px] border-zk-borderDark bg-[#1b130d] p-[13px_14px]">
            <Icon name="location" size={18} className="mt-0.5 flex-none text-[#f5945f]" strokeWidth={2.1} />
            <div className="text-[15px] font-bold leading-snug text-[#ede2d9]">
              {order.deliverySector} — {order.landmark}
            </div>
          </div>
          {!dispatched ? (
            <button
              type="button"
              onClick={onDispatch}
              className="mt-3.5 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-[14px] border-none bg-gradient-to-br from-[#FFC24C] to-[#F5945F] text-base font-extrabold tracking-wide text-[#2a1606] shadow-[0_10px_26px_rgba(245,148,95,0.32)]"
            >
              <Icon name="dispatch" size={22} className="text-[#2a1606]" strokeWidth={2.3} />
              DISPATCH MOTO DRIVER
            </button>
          ) : (
            <button
              type="button"
              onClick={onDispatch}
              className="mt-3.5 flex h-14 w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-zk-border bg-[#1f1812] text-[15px] font-extrabold tracking-wide text-zk-muted"
            >
              <Icon name="check" size={18} className="text-green-400" strokeWidth={2.4} />
              Driver dispatched · Re-share slip
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
  onToggle: (id: string) => void;
  onDispatch: (id: string) => void;
}

export function OrdersList({
  orders,
  expandedId,
  onToggle,
  onDispatch,
}: OrdersListProps) {
  if (orders.length === 0) {
    return (
      <div className="px-5 py-[70px] text-center">
        <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full border-[1.5px] border-zk-border bg-zk-surface">
          <Icon name="check" size={34} className="text-green-400" strokeWidth={2.4} />
        </div>
        <div className="text-xl font-extrabold text-zk-text">All caught up</div>
        <div className="mt-1.5 text-sm font-semibold text-zk-muted">
          No active orders in the queue.
        </div>
      </div>
    );
  }

  const sorted = [...orders].sort((a, b) => {
    const aDisp =
      a.status === "DISPATCHED" || a.status === "COMPLETED" ? 1 : 0;
    const bDisp =
      b.status === "DISPATCHED" || b.status === "COMPLETED" ? 1 : 0;
    return aDisp - bDisp;
  });

  return (
    <div className="flex flex-col gap-3.5">
      {sorted.map((order, index) => (
        <OrderTicket
          key={order.id}
          order={order}
          index={index}
          expanded={expandedId === order.id}
          onToggle={() => onToggle(order.id)}
          onDispatch={() => onDispatch(order.id)}
        />
      ))}
    </div>
  );
}
