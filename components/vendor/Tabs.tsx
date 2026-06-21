"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";

interface TabsProps {
  active: "orders" | "inventory";
  onOrders: () => void;
  onInventory: () => void;
}

function tabStyle(active: boolean) {
  return cn(
    "flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] text-base font-extrabold",
    active
      ? "border-[1.5px] border-transparent bg-gradient-to-br from-[#FFC24C] to-[#F5945F] text-[#2a1606] shadow-[0_8px_20px_rgba(245,148,95,0.28)]"
      : "border-[1.5px] border-zk-borderDark bg-zk-surface text-zk-sub"
  );
}

export function Tabs({ active, onOrders, onInventory }: TabsProps) {
  return (
    <div className="relative z-[1] flex gap-2.5 px-[18px] pb-1 pt-4">
      <button type="button" onClick={onOrders} className={tabStyle(active === "orders")}>
        <Icon name="orders" size={19} strokeWidth={2.1} />
        Orders
      </button>
      <button
        type="button"
        onClick={onInventory}
        className={tabStyle(active === "inventory")}
      >
        <Icon name="inventory" size={19} strokeWidth={2.1} />
        Inventory
      </button>
    </div>
  );
}
