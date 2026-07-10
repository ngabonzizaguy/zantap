"use client";

import { useCallback, useState } from "react";
import { formatRwf, orderDisplayId } from "@/lib/format";
import { ussdTelHref } from "@/lib/momo/ussd-dial";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
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
          ? "pointer-events-auto bg-canvas-deep/40 backdrop-blur-sm"
          : "pointer-events-none bg-transparent backdrop-blur-none"
      )}
    >
      <div
        className={cn(
          "glass-liquid-sheet w-full max-w-customer rounded-t-brand-xxl border border-hairline border-b-0 px-5 pb-8 pt-6 transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline-strong" />

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-brand-lg bg-gradient-to-br from-gold to-momo">
            <Icon name="momo" size={22} className="text-momo-dark" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-display-sm leading-tight text-ink">
              Pay with MoMo
            </h2>
            <p className="font-body text-caption text-muted">
              {formatRwf(amount)} to {vendorName}
            </p>
          </div>
        </div>

        {isAwaiting ? (
          <div className="mt-4 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
            <p className="font-body text-caption-uppercase text-muted">
              Waiting for payment
            </p>
            <p className="mt-1 font-body text-body-sm font-medium text-ink">
              {orderDisplayId(orderId)} · {countdownLabel}
            </p>
            <p className="mt-2 font-body text-body-sm leading-relaxed text-muted">
              Finish on your phone, then come back here.
            </p>
          </div>
        ) : (
          <p className="mt-4 font-body text-body-sm leading-relaxed text-muted">
            Tap Open MoMo, complete payment on your phone, then return here.
          </p>
        )}

        {error ? (
          <p className="mt-4 rounded-brand-lg bg-error/10 px-3 py-2 font-body text-body-sm font-medium text-error">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3">
          {isAwaiting ? (
            <>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void onConfirmPaid()}
                radius="lg"
                className="h-[52px] w-full text-button"
              >
                {busy ? "Confirming…" : "I've paid"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void onDidntPay()}
                radius="lg"
                className="h-12 w-full text-body-sm"
              >
                Didn&apos;t pay
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleOpenMomo}
                radius="lg"
                className="h-12 w-full border-hairline bg-canvas-soft text-body-sm"
              >
                Open MoMo again
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={handleOpenMomo}
                radius="lg"
                className="h-[52px] w-full text-button"
              >
                Open MoMo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleCopy()}
                radius="lg"
                className="h-12 w-full text-body-sm"
              >
                {copied ? "Copied!" : "Copy USSD code"}
              </Button>
              <code className="block break-all rounded-brand-md bg-canvas-soft px-3 py-2 text-center font-body text-body-sm font-medium text-ink">
                {ussdDial}
              </code>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
