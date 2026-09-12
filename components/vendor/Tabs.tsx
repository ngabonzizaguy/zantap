"use client";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";

export type KdsTab = "orders" | "menu" | "history" | "inventory";

interface TabsProps {
  active: KdsTab;
  onOrders: () => void;
  onMenu: () => void;
  onHistory: () => void;
  onInventory: () => void;
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
  onInventory,
}: TabsProps) {
  const t = useKdsTranslation();
  return (
    <div className="relative z-[1] grid grid-cols-2 gap-2.5 px-[18px] pb-1 pt-4 sm:grid-cols-4">
      <Button
        type="button"
        aria-pressed={active === "orders"}
        variant={active === "orders" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onOrders}
        className={tabClass(active === "orders")}
      >
        <Icon name="orders" size={20} strokeWidth={2.1} />{t("kds.tabs.orders")}</Button>
      <Button
        type="button"
        aria-pressed={active === "menu"}
        variant={active === "menu" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onMenu}
        className={tabClass(active === "menu")}
      >
        <Icon name="inventory" size={20} strokeWidth={2.1} />{t("kds.tabs.menu")}</Button>
      <Button
        type="button"
        aria-pressed={active === "history"}
        variant={active === "history" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onHistory}
        className={tabClass(active === "history")}
      >
        <Icon name="clock" size={20} strokeWidth={2.1} />{t("kds.tabs.history")}</Button>
      <Button
        type="button"
        aria-pressed={active === "inventory"}
        variant={active === "inventory" ? "primary" : "outline"}
        size="kds"
        radius="xl"
        onClick={onInventory}
        className={tabClass(active === "inventory")}
      >
        <Icon name="inventory" size={20} strokeWidth={2.1} />{t("kds.tabs.inventory")}</Button>
    </div>
  );
}
