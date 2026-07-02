"use client";

import { formatRwf, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
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
        "fixed inset-0 z-[90] flex flex-col bg-gradient-to-b from-zt-success-light to-zt-success transition-all duration-500",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <div className="zt-hidescroll relative mx-auto flex min-h-screen w-full max-w-customer flex-1 flex-col overflow-y-auto px-[26px] pb-[34px]">
        <div className="pointer-events-none absolute left-1/2 top-[-70px] h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22),rgba(255,255,255,0))]" />
        <div className="flex flex-1 flex-col items-center justify-center px-0 pb-7 pt-[66px] text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.2)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
              <Icon name="check" size={34} className="text-zt-success" strokeWidth={3} />
            </div>
          </div>
          <div className="mt-6 font-serif text-[40px] leading-none text-white">
            Payment successful
          </div>
          <div className="mt-2.5 text-[15px] font-semibold text-white/80">
            {formatRwf(amount)} paid via MoMo
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">
              Order
            </span>
            <span className="text-sm font-extrabold text-white">
              {orderDisplayId(orderId)}
            </span>
          </div>

          <div className="mt-6 flex w-full items-start gap-3 rounded-[20px] border border-white/25 bg-white/10 p-[16px_18px] text-left">
            <Icon name="location" size={20} className="mt-0.5 flex-none text-white" strokeWidth={2} />
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-white/65">
                Delivering to
              </div>
              <div className="mt-0.5 text-base font-extrabold text-white">{sector}</div>
              <div className="mt-0.5 text-sm font-medium text-white/85">{landmark}</div>
            </div>
          </div>

          <div className="mt-3.5 flex w-full items-center gap-[11px] rounded-[18px] bg-black/15 p-[14px_16px]">
            <span className="h-[9px] w-[9px] flex-none animate-ztpulse rounded-full bg-zt-success-glow shadow-[0_0_10px_#7ee2a8]" />
            <div className="text-left text-[13px] font-semibold leading-snug text-white/90">
              Your paid order has been transmitted directly to {restaurantName}&apos;s kitchen.
              Stand by for delivery.
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onReset}
            className="h-14 w-full rounded-2xl border-none bg-white text-base font-extrabold text-zt-success shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
          >
            Place another order
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-14 w-full rounded-2xl border-2 border-white bg-transparent text-base font-extrabold text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
          >
            Back to menu
          </button>
        </div>
      </div>
    </div>
  );
}
