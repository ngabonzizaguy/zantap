"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";

export type KdsTab = "orders" | "menu" | "history" | "stock";

interface TabsProps {
  active: KdsTab;
  showStock: boolean;
  onOrders: () => void;
  onMenu: () => void;
  onHistory: () => void;
  onStock: () => void;
}

function tabClass(active: boolean) {
  return cn(
    "flex flex-1 gap-1.5 font-body text-sm font-semibold sm:text-base",
    !active && "text-muted"
  );
}

export function Tabs({
  active,
  showStock,
  onOrders,
  onMenu,
  onHistory,
  onStock,
}: TabsProps) {
  return (
    <div className="relative z-[1] grid grid-cols-2 gap-2.5 px-[18px] pb-1 pt-4 sm:grid-cols-4">
      <Button
        type="button"
        variant={active === "orders" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onOrders}
        className={tabClass(active === "orders")}
      >
        <Icon name="orders" size={20} strokeWidth={2.1} />
        Orders
      </Button>
      <Button
        type="button"
        variant={active === "menu" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onMenu}
        className={tabClass(active === "menu")}
      >
        <Icon name="inventory" size={20} strokeWidth={2.1} />
        Menu
      </Button>
      <Button
        type="button"
        variant={active === "history" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onHistory}
        className={tabClass(active === "history")}
      >
        <Icon name="clock" size={20} strokeWidth={2.1} />
        History
      </Button>
      {showStock ? (
        <Button
          type="button"
          variant={active === "stock" ? "primary" : "outline"}
          size="kds"
          radius="xl"
          onClick={onStock}
          className={tabClass(active === "stock")}
        >
          <Icon name="stock" size={20} strokeWidth={2.1} />
          Stock
        </Button>
      ) : null}
    </div>
  );
}
