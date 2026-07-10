"use client";

import { formatRwf, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Button, GradientOrbs } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface SuccessReceiptProps {
  open: boolean;
  amount: number;
  orderId: string;
  sector: string;
  landmark: string;
  restaurantName: string;
  onReset: () => void;
}

export function SuccessReceipt({
  open,
  amount,
  orderId,
  sector,
  landmark,
  restaurantName,
  onReset,
}: SuccessReceiptProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[90] flex flex-col bg-canvas transition-[transform,opacity,visibility] duration-500",
        open
          ? "visible translate-y-0 opacity-100"
          : "invisible pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <GradientOrbs />
      <div className="zt-hidescroll relative mx-auto flex min-h-screen w-full max-w-customer flex-1 flex-col overflow-y-auto px-[26px] pb-[34px]">
        <div className="flex flex-1 flex-col items-center justify-center px-0 pb-7 pt-[66px] text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-hairline bg-surface-card shadow-brand-soft">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <Icon name="check" size={34} className="text-success" strokeWidth={3} />
            </div>
          </div>
          <div className="mt-6 font-display text-display-lg leading-none text-ink">
            Payment successful
          </div>
          <div className="mt-2.5 font-body text-body-sm font-medium text-muted">
            {formatRwf(amount)} paid via MoMo
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-pill border border-hairline bg-surface-card px-4 py-2 shadow-brand-soft">
            <span className="font-body text-caption-uppercase text-muted">
              Order
            </span>
            <span className="font-body text-body-sm font-medium text-ink">
              {orderDisplayId(orderId)}
            </span>
          </div>

          <div className="mt-6 flex w-full items-start gap-3 rounded-brand-xl border border-hairline bg-surface-card p-[16px_18px] text-left shadow-brand-soft">
            <Icon name="location" size={20} className="mt-0.5 flex-none text-muted" strokeWidth={2} />
            <div className="min-w-0">
              <div className="font-body text-caption-uppercase text-muted">
                Delivering to
              </div>
              <div className="mt-0.5 font-body text-body-md font-medium text-ink">{sector}</div>
              <div className="mt-0.5 font-body text-body-sm text-muted">{landmark}</div>
            </div>
          </div>

          <div className="mt-3.5 flex w-full items-center gap-[11px] rounded-brand-lg border border-hairline bg-canvas-soft p-[14px_16px]">
            <span className="h-[9px] w-[9px] flex-none animate-pulse rounded-full bg-success shadow-[0_0_10px_rgba(22,163,74,0.45)]" />
            <div className="text-left font-body text-body-sm font-medium leading-snug text-body">
              Your paid order has been transmitted directly to {restaurantName}&apos;s kitchen.
              Stand by for delivery.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={onReset}
            radius="lg"
            className="h-14 w-full text-body-md"
          >
            Place another order
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            radius="lg"
            className="h-14 w-full text-body-md"
          >
            Back to menu
          </Button>
        </div>
      </div>
    </div>
  );
}
