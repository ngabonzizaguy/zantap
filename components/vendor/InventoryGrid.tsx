"use client";

import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface InventoryCardProps {
  item: MenuItem;
  onToggle: () => void;
}

export function InventoryCard({ item, onToggle }: InventoryCardProps) {
  const available = item.isAvailable;
  const hue = item.thumbTo ?? "#F5945F";

  return (
    <div
      className={cn(
        "relative flex min-h-[176px] flex-col overflow-hidden rounded-[18px] p-3.5",
        available
          ? "border-[1.5px] border-zk-border bg-zk-surface shadow-[0_8px_22px_rgba(0,0,0,0.4)]"
          : "border-[1.5px] border-red-500/30 bg-[#1f1310] shadow-[0_8px_22px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[13px]"
          style={{
            background: available ? `${hue}29` : "#2a1a16",
            border: available ? `1.5px solid ${hue}73` : "1.5px solid rgba(239,68,68,0.28)",
            opacity: available ? 1 : 0.72,
          }}
        >
          <Icon
            name="plate"
            size={22}
            style={{ stroke: available ? hue : "#7a6a5d" }}
          />
        </div>
        <div
          className="rounded-full px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide"
          style={{
            color: available ? hue : "#8a6a60",
            background: available ? `${hue}1f` : "rgba(239,68,68,0.1)",
            border: available ? `1px solid ${hue}4d` : "1px solid rgba(239,68,68,0.22)",
          }}
        >
          {item.category}
        </div>
      </div>
      <div
        className={cn(
          "mt-3 text-[17px] font-extrabold leading-tight",
          available ? "text-zk-text" : "text-zk-muted"
        )}
      >
        {item.name}
      </div>
      <div
        className={cn(
          "mt-1 text-sm font-extrabold",
          available ? "text-momo" : "text-[#7a6a5d]"
        )}
      >
        {formatRwf(item.priceRwf)}
      </div>
      <button
        type="button"
        aria-label={`Toggle ${item.name} availability`}
        onClick={onToggle}
        className={cn(
          "mt-auto flex h-[52px] items-center justify-between rounded-[13px] pl-3.5 pr-2.5",
          available
            ? "border-[1.5px] border-green-500/30 bg-green-500/10"
            : "border-[1.5px] border-zk-border bg-[#241712]"
        )}
      >
        <span
          className={cn(
            "text-xs font-extrabold tracking-wide",
            available ? "text-green-400" : "text-red-400"
          )}
        >
          {available ? "AVAILABLE" : "SOLD OUT"}
        </span>
        <span
          className={cn(
            "relative h-8 w-14 flex-none rounded-full transition-colors",
            available ? "bg-green-400" : "bg-[#463528]"
          )}
        >
          <span
            className={cn(
              "absolute top-1 h-6 w-6 rounded-full bg-zk-text shadow-[0_2px_6px_rgba(0,0,0,0.4)] transition-all",
              available ? "left-7" : "left-1"
            )}
          />
        </span>
      </button>
    </div>
  );
}

interface InventoryGridProps {
  items: MenuItem[];
  onToggle: (id: string) => void;
  onResetAll: () => void;
}

export function InventoryGrid({ items, onToggle, onResetAll }: InventoryGridProps) {
  const availCount = items.filter((item) => item.isAvailable).length;

  return (
    <div>
      <div className="mb-[15px] flex items-end justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-wide text-zk-muted">
            Menu availability
          </div>
          <div className="mt-1 text-base font-extrabold text-zk-text">
            {availCount} of {items.length} items live
          </div>
        </div>
        <button
          type="button"
          onClick={onResetAll}
          className="flex h-[42px] items-center gap-1.5 rounded-full border-[1.5px] border-zk-border bg-zk-surface px-[15px] text-[13px] font-bold text-[#ede2d9]"
        >
          <Icon name="inventory" size={15} className="text-green-400" strokeWidth={2.2} />
          Reset all
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
