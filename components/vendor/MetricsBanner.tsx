"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface MetricsBannerProps {
  vendorName: string;
  todayGross: number;
  activeCount: number;
  kitchenOpen: boolean;
  onToggleKitchen: () => void;
}

export function MetricsBanner({
  vendorName,
  todayGross,
  activeCount,
  kitchenOpen,
  onToggleKitchen,
}: MetricsBannerProps) {
  return (
    <div className="sticky top-0 z-30 border-b-[1.5px] border-zk-borderDark bg-[rgba(26,19,13,0.86)] backdrop-blur-[14px]">
      <div className="flex items-center justify-between px-[18px] pb-3.5 pt-4">
        <div className="flex items-center gap-[11px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFC24C] to-[#F5945F] shadow-[0_6px_16px_rgba(245,148,95,0.35)]">
            <svg width="22" height="22" viewBox="0 0 48 48" fill="none" stroke="#2a1606" strokeWidth="2.4" strokeLinejoin="round">
              <path d="M24 6l13 7.5v15L24 36 11 28.5v-15L24 6z" />
              <path d="M24 14l7 4v8l-7 4-7-4v-8l7-4z" />
            </svg>
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-zk-text">
              ZanTap Kitchen
            </div>
            <div className="text-xs font-semibold text-zk-muted">
              {vendorName} · Live
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleKitchen}
          className={cn(
            "flex h-11 items-center gap-2 rounded-full px-4 text-sm font-extrabold tracking-wide",
            kitchenOpen
              ? "border-[1.5px] border-green-500/55 bg-green-500/15 text-green-400"
              : "border-[1.5px] border-red-500/50 bg-red-500/10 text-red-400"
          )}
        >
          <span
            className={cn(
              "h-[9px] w-[9px] rounded-full",
              kitchenOpen
                ? "bg-green-400 shadow-[0_0_10px_#34d058]"
                : "bg-red-500 shadow-[0_0_10px_#ef4444]"
            )}
          />
          {kitchenOpen ? "OPEN" : "CLOSED"}
        </button>
      </div>

      <div className="flex gap-2.5 px-[18px] pb-[15px]">
        <div className="flex-1 rounded-[14px] border-[1.5px] border-zk-border border-l-4 border-l-momo bg-zk-surface p-[13px_15px]">
          <div className="flex items-center gap-1.5">
            <Icon name="orders" size={14} className="text-momo" strokeWidth={2.2} />
            <div className="text-[11px] font-bold uppercase tracking-wide text-zk-muted">
              Today&apos;s gross
            </div>
          </div>
          <div className="mt-1 text-[22px] font-extrabold tracking-tight text-zk-text">
            {todayGross.toLocaleString("en-US")}{" "}
            <span className="text-[13px] text-zk-sub">RWF</span>
          </div>
        </div>
        <div className="w-32 flex-none rounded-[14px] border-[1.5px] border-zk-border border-l-4 border-l-[#F5945F] bg-zk-surface p-[13px_15px]">
          <div className="flex items-center gap-1.5">
            <Icon name="orders" size={14} className="text-[#F5945F]" strokeWidth={2.2} />
            <div className="text-[11px] font-bold uppercase tracking-wide text-zk-muted">
              Active
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <div className="text-[22px] font-extrabold tracking-tight text-[#F5945F]">
              {activeCount}
            </div>
            <div className="text-xs font-semibold text-zk-sub">orders</div>
          </div>
        </div>
      </div>
    </div>
  );
}
