"use client";

import { translateKdsLabel } from "@/lib/i18n/kds-labels";

import { KdsLanguageSelector, useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface QueueCounts {
  newCount: number;
  preparing: number;
  ready: number;
}

interface MetricsBannerProps {
  vendorName: string;
  todayGross: number;
  yesterdayGross: number;
  activeCount: number;
  queueCounts: QueueCounts;
  kitchenOpen: boolean;
  onToggleKitchen: () => void;
  onOpenMenu: () => void;
  onOpenProfit: () => void;
}

function formatGrossDelta(
  today: number,
  yesterday: number
): { label: string; className: string } {
  if (yesterday === 0) {
    return {
      label: "New",
      className: today > 0 ? "text-success" : "text-muted",
    };
  }

  const pct = ((today - yesterday) / yesterday) * 100;
  const sign = pct > 0 ? "+" : "";
  return {
    label: `${sign}${pct.toFixed(1)}%`,
    className: pct >= 0 ? "text-success" : "text-error",
  };
}

export function MetricsBanner({
  vendorName,
  todayGross,
  yesterdayGross,
  activeCount,
  queueCounts,
  kitchenOpen,
  onToggleKitchen,
  onOpenMenu,
  onOpenProfit,
}: MetricsBannerProps) {
  const t = useKdsTranslation();
  const grossDelta = formatGrossDelta(todayGross, yesterdayGross);

  return (
    <div className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 px-4 pb-3.5 pt-4 sm:px-[18px]">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/brand/approved-z/zantap-z-avatar-offwhite-1024.png"
            alt="ZanTap"
            width={40}
            height={40}
            priority
            className="h-10 w-10 flex-none rounded-brand-md"
          />
          <div className="min-w-0">
            <div className="truncate font-display text-display-sm text-ink">{t("kds.metrics-banner.zantap-kitchen")}</div>
            <div className="truncate font-body text-caption text-muted">
              {vendorName}{" "}
              <span
                className={cn(
                  "font-medium",
                  kitchenOpen ? "text-success" : "text-error"
                )}
              >
                · {kitchenOpen ? t("kds.metrics-banner.live") : t("kds.metrics-banner.off")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            type="button"
            data-coachmark-target="kitchen-toggle"
            onClick={onToggleKitchen}
            className={cn(
              "flex h-9 min-h-9 items-center gap-2 rounded-pill px-3.5 font-body text-caption-uppercase font-semibold uppercase tracking-wide transition-colors",
              kitchenOpen
                ? "border border-success/30 bg-success/10 text-success"
                : "border border-error/30 bg-error/10 text-error"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                kitchenOpen ? "bg-success" : "bg-error"
              )}
            />
            {kitchenOpen ? t("kds.metrics-banner.open") : t("kds.metrics-banner.closed")}
          </button>
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-brand-md border border-hairline-strong text-ink"
            aria-label={t("kds.metrics-banner.open-setup-menu")}
          >
            <Icon name="menu" size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <KdsLanguageSelector />
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 sm:px-[18px]">
        <Card padding="sm" className="border-l-2 border-l-primary shadow-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon name="momo" size={13} className="text-primary" strokeWidth={2.2} />
              <span className="font-body text-caption-uppercase text-muted">{t("kds.metrics-banner.today-s-gross")}</span>
            </div>
            <button
              type="button"
              onClick={onOpenProfit}
              className="flex h-8 w-8 items-center justify-center rounded-brand-md bg-[linear-gradient(135deg,#F5A623_0%,#FFD24C_100%)] text-[#1a1205] shadow-[0_0_18px_rgba(245,166,35,0.3)] transition-[filter,transform] hover:brightness-110 active:scale-95"
              aria-label={t("kds.metrics-banner.open-complete-profit-insights")}
              title={t("kds.metrics-banner.know-your-profit")}
            >
              <Icon name="eye" size={17} strokeWidth={2.3} />
            </button>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="font-display text-display-sm leading-none text-ink">
              {todayGross.toLocaleString("en-US")}
            </span>
            <span className="font-body text-caption text-muted-soft">{t("kds.metrics-banner.rwf")}</span>
          </div>
          <div className="mt-1.5">
            <span className={cn("font-body text-caption", grossDelta.className)}>
              {translateKdsLabel(t, grossDelta.label)}
              <span className="text-muted-soft">{" "}{t("kds.metrics-banner.vs-yest")}</span>
            </span>
          </div>
        </Card>

        <Card padding="sm" className="shadow-none">
          <div className="flex items-center gap-1.5">
            <Icon name="orders" size={13} className="text-muted" strokeWidth={2.2} />
            <span className="font-body text-caption-uppercase text-muted">{t("kds.metrics-banner.active-orders")}</span>
          </div>
          <div className="mt-1.5 font-display text-display-sm leading-none text-primary">
            {activeCount}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-body text-caption">
            <span className="text-violet-300">{t("kds.metrics-banner.new")}{" "}{queueCounts.newCount}</span>
            <span className="text-muted-soft">·</span>
            <span className="text-amber-300">{t("kds.metrics-banner.prep")}{" "}{queueCounts.preparing}</span>
            <span className="text-muted-soft">·</span>
            <span className="text-sky-300">{t("kds.metrics-banner.ready")}{" "}{queueCounts.ready}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
