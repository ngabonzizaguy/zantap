"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

export type KdsTab = "orders" | "menu" | "history" | "setup";

interface TabsProps {
  active: KdsTab;
  onOrders: () => void;
  onMenu: () => void;
  onHistory: () => void;
  onSetup: () => void;
}

/** DEPRECATED palette: uses legacy zk-* tokens until KDS visual migration (Issue 01+). */
function tabStyle(active: boolean) {
  return cn(
    "flex h-14 min-h-[60px] flex-1 items-center justify-center gap-1.5 rounded-[14px] text-sm font-extrabold sm:text-base",
    active
      ? "border-[1.5px] border-transparent bg-gradient-to-br from-[#FFC24C] to-[#F5945F] text-[#2a1606] shadow-[0_8px_20px_rgba(245,148,95,0.28)]"
      : "border-[1.5px] border-zk-borderDark bg-zk-surface text-zk-sub"
  );
}

export function Tabs({
  active,
  onOrders,
  onMenu,
  onHistory,
  onSetup,
}: TabsProps) {
  return (
    <div className="relative z-[1] grid grid-cols-2 gap-2.5 px-[18px] pb-1 pt-4 sm:grid-cols-4">
      <button type="button" onClick={onOrders} className={tabStyle(active === "orders")}>
        <Icon name="orders" size={19} strokeWidth={2.1} />
        Orders
      </button>
      <button type="button" onClick={onMenu} className={tabStyle(active === "menu")}>
        <Icon name="inventory" size={19} strokeWidth={2.1} />
        Menu
      </button>
      <button type="button" onClick={onHistory} className={tabStyle(active === "history")}>
        History
      </button>
      <button type="button" onClick={onSetup} className={tabStyle(active === "setup")}>
        Setup
      </button>
    </div>
  );
}
