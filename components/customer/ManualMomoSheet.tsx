"use client";

import { useCallback, useState } from "react";
import { formatRwf, orderDisplayId } from "@/lib/format";
import { ussdTelHref } from "@/lib/momo/ussd-dial";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface ManualMomoSheetProps {
  open: boolean;
  stage: "momo_dial" | "awaiting_confirmation";
  amount: number;
  vendorName: string;
  orderId: string;
  ussdDial: string;
  countdownLabel: string;
  busy: boolean;
  error: string | null;
  onOpenMomo: () => void;
  onConfirmPaid: () => void;
  onDidntPay: () => void;
}

export function ManualMomoSheet({
  open,
  stage,
  amount,
  vendorName,
  orderId,
  ussdDial,
  countdownLabel,
  busy,
  error,
  onOpenMomo,
  onConfirmPaid,
  onDidntPay,
}: ManualMomoSheetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(ussdDial);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [ussdDial]);

  const handleOpenMomo = useCallback(() => {
    onOpenMomo();
    window.location.href = ussdTelHref(ussdDial);
  }, [onOpenMomo, ussdDial]);

  const isAwaiting = stage === "awaiting_confirmation";

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center transition-all duration-300",
        open
          ? "pointer-events-auto bg-[rgba(50,30,24,0.45)] backdrop-blur-[7px]"
          : "pointer-events-none bg-transparent backdrop-blur-none"
      )}
    >
      <div
        className={cn(
          "w-full max-w-customer rounded-t-[28px] bg-white px-5 pb-8 pt-6 shadow-[0_-20px_60px_rgba(0,0,0,0.18)] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#e8e0da]" />

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] bg-gradient-to-br from-[#FFD24C] to-momo">
            <Icon name="momo" size={22} className="text-momo-dark" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-serif text-[22px] leading-tight text-zt-brown">
              Pay with MoMo
            </h2>
            <p className="text-[13px] font-medium text-zt-warm">
              {formatRwf(amount)} to {vendorName}
            </p>
          </div>
        </div>

        {isAwaiting ? (
          <div className="mt-4 rounded-[14px] border border-[#eee4dc] bg-[#faf7f4] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.6px] text-zt-warm">
              Waiting for payment
            </p>
            <p className="mt-1 text-[14px] font-semibold text-zt-brown">
              {orderDisplayId(orderId)} · {countdownLabel}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-zt-warm">
              Finish on your phone, then come back here.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-[14px] leading-relaxed text-zt-warm">
            Tap Open MoMo, complete payment on your phone, then return here.
          </p>
        )}

        {error ? (
          <p className="mt-4 rounded-[12px] bg-[#fff0ee] px-3 py-2 text-[13px] font-semibold text-[#b42318]">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          {isAwaiting ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onConfirmPaid()}
                className="h-[52px] w-full rounded-[16px] bg-zt-brown text-[15px] font-bold text-white disabled:opacity-60"
              >
                {busy ? "Confirming…" : "I've paid"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onDidntPay()}
                className="h-[48px] w-full rounded-[16px] border border-[#e8e0da] bg-white text-[14px] font-semibold text-zt-warm"
              >
                Didn't pay
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleOpenMomo}
                className="h-[48px] w-full rounded-[16px] bg-[#faf7f4] text-[14px] font-semibold text-zt-brown"
              >
                Open MoMo again
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleOpenMomo}
                className="h-[52px] w-full rounded-[16px] bg-zt-brown text-[15px] font-bold text-white"
              >
                Open MoMo
              </button>
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="h-[48px] w-full rounded-[16px] border border-[#e8e0da] bg-white text-[14px] font-semibold text-zt-brown"
              >
                {copied ? "Copied!" : "Copy USSD code"}
              </button>
              <code className="block break-all rounded-[12px] bg-[#faf7f4] px-3 py-2 text-center text-[13px] font-semibold text-zt-brown">
                {ussdDial}
              </code>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
