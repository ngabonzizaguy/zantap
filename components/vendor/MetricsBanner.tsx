"use client";

import { Icon } from "@/components/ui/Icon";
import { Card } from "@/components/ui/primitives";
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
    <div className="sticky top-0 z-30 border-b border-hairline bg-canvas/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 pb-3.5 pt-4 sm:px-[18px]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-brand-lg border border-hairline bg-gradient-to-br from-gradient-mint/50 via-canvas-soft to-gradient-peach/40">
            <svg
              width="22"
              height="22"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
              className="text-ink"
              aria-hidden
            >
              <path d="M24 6l13 7.5v15L24 36 11 28.5v-15L24 6z" />
              <path d="M24 14l7 4v8l-7 4-7-4v-8l7-4z" />
            </svg>
          </div>
          <div>
            <div className="font-display text-display-sm text-ink">ZanTap Kitchen</div>
            <div className="font-body text-caption text-muted">
              {vendorName} · Live
            </div>
          </div>
        </div>
        <button
          type="button"
          data-coachmark-target="kitchen-toggle"
          onClick={onToggleKitchen}
          className={cn(
            "flex h-11 min-h-11 items-center gap-2 rounded-pill px-4 font-body text-caption-uppercase font-semibold uppercase tracking-wide transition-colors",
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
          {kitchenOpen ? "OPEN" : "CLOSED"}
        </button>
      </div>

      <div className="flex gap-2.5 px-4 pb-4 sm:px-[18px]">
        <Card
          padding="sm"
          className="flex-1 border-l-4 border-l-primary shadow-none"
        >
          <div className="flex items-center gap-1.5">
            <Icon name="orders" size={14} className="text-primary" strokeWidth={2.2} />
            <div className="font-body text-caption-uppercase text-muted">
              Today&apos;s gross
            </div>
          </div>
          <div className="mt-1 font-display text-display-sm text-ink">
            {todayGross.toLocaleString("en-US")}{" "}
            <span className="font-body text-body-sm text-muted">RWF</span>
          </div>
        </Card>
        <Card
          padding="sm"
          className="w-32 flex-none border-l-4 border-l-gradient-peach shadow-none"
        >
          <div className="flex items-center gap-1.5">
            <Icon
              name="orders"
              size={14}
              className="text-body-strong"
              strokeWidth={2.2}
            />
            <div className="font-body text-caption-uppercase text-muted">Active</div>
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <div className="font-display text-display-sm text-primary">
              {activeCount}
            </div>
            <div className="font-body text-caption text-muted">orders</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
