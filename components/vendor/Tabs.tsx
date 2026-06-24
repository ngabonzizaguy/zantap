"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";

export type KdsTab = "orders" | "menu" | "history" | "setup";

interface TabsProps {
  active: KdsTab;
  onOrders: () => void;
  onMenu: () => void;
  onHistory: () => void;
  onSetup: () => void;
}

function tabClass(active: boolean) {
  return cn(
    "flex flex-1 gap-1.5 font-body text-sm font-semibold sm:text-base",
    !active && "text-muted"
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
      <Button
        type="button"
        variant={active === "orders" ? "primary" : "outline"}
        size="kds"
        onClick={onOrders}
        className={tabClass(active === "orders")}
      >
        <Icon name="orders" size={19} strokeWidth={2.1} />
        Orders
      </Button>
      <Button
        type="button"
        variant={active === "menu" ? "primary" : "outline"}
        size="kds"
        onClick={onMenu}
        className={tabClass(active === "menu")}
      >
        <Icon name="inventory" size={19} strokeWidth={2.1} />
        Menu
      </Button>
      <Button
        type="button"
        variant={active === "history" ? "primary" : "outline"}
        size="kds"
        onClick={onHistory}
        className={tabClass(active === "history")}
      >
        History
      </Button>
      <Button
        type="button"
        variant={active === "setup" ? "primary" : "outline"}
        size="kds"
        onClick={onSetup}
        className={tabClass(active === "setup")}
      >
        Setup
      </Button>
    </div>
  );
}
