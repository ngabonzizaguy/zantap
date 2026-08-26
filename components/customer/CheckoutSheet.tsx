"use client";

import { KIGALI_SECTORS } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import type { CheckoutLine } from "@/lib/checkout/types";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface CheckoutSheetProps {
  open: boolean;
  showLoading: boolean;
  lines: CheckoutLine[];
  total: number;
  phone: string;
  sector: string;
  landmark: string;
  sectorOpen: boolean;
  canPay: boolean;
  payError?: string | null;
  onClose: () => void;
  onPhoneChange: (value: string) => void;
  onSectorToggle: () => void;
  onSectorPick: (sector: string) => void;
  onLandmarkChange: (value: string) => void;
  onPay: () => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
}

export function CheckoutSheet({
  open,
  showLoading,
  lines,
  total,
  phone,
  sector,
  landmark,
  sectorOpen,
  canPay,
  payError,
  onClose,
  onPhoneChange,
  onSectorToggle,
  onSectorPick,
  onLandmarkChange,
  onPay,
  onInc,
  onDec,
}: CheckoutSheetProps) {
  const isOpen = open || showLoading;

  return (
    <div
      className={cn(
        // Blur stays constant and only opacity/visibility animate: transitioning
        // the blur radius itself forces a re-blur every frame on mobile GPUs.
        "fixed inset-0 z-[60] flex items-end justify-center bg-canvas-deep/40 backdrop-blur-sm transition-[opacity,visibility] duration-[420ms]",
        isOpen
          ? "visible opacity-100"
          : "invisible opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "glass-liquid-sheet zt-hidescroll max-h-[90vh] w-full max-w-customer overflow-y-auto rounded-t-brand-xxl border border-hairline border-b-0 transition-transform duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)]",
          isOpen ? "translate-y-0" : "translate-y-[101%]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-hairline-strong" />
        </div>

        {showLoading ? (
          <div className="flex flex-col items-center px-[30px] pb-[62px] pt-[54px] text-center">
            <div className="relative h-[74px] w-[74px]">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-hairline border-t-momo" />
              <div className="absolute inset-[19px] flex items-center justify-center rounded-full bg-gradient-to-br from-gold to-momo">
                <Icon name="momo" size={18} className="text-momo-dark" strokeWidth={2.2} />
              </div>
            </div>
            <div className="mt-6 font-display text-display-sm text-ink">Contacting MoMo…</div>
            <div className="mt-2 font-body text-body-sm text-muted">
              Requesting authorization for {formatRwf(total)}
            </div>
            <div className="mt-[30px] flex w-full flex-col gap-2.5">
              <div className="h-3.5 animate-pulse rounded-full bg-surface-strong" />
              <div className="h-3.5 w-[74%] animate-pulse rounded-full bg-surface-strong [animation-delay:0.2s]" />
              <div className="h-3.5 w-[54%] animate-pulse rounded-full bg-surface-strong [animation-delay:0.4s]" />
            </div>
          </div>
        ) : (
          <div className="px-[22px] pb-[26px] pt-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="font-display text-display-md text-ink">Your order</div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-surface-strong text-muted transition-colors hover:text-ink"
              >
                <Icon name="close" size={18} strokeWidth={2} />
              </button>
            </div>

            <div className="my-2.5 flex flex-col gap-2">
              {lines.map((line) => (
                <div
                  key={line.lineKey}
                  className="flex items-center gap-3 rounded-brand-lg border border-hairline bg-canvas-soft p-[11px_13px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-body-sm font-medium text-ink">{line.name}</div>
                    {line.sizeLabel ? (
                      <div className="mt-0.5 font-body text-caption font-medium text-primary">
                        {line.sizeLabel}
                      </div>
                    ) : null}
                    {line.addOnLabels?.length ? (
                      <div className="mt-0.5 font-body text-caption text-muted">+ {line.addOnLabels.join(", ")}</div>
                    ) : null}
                    {line.notes && (
                      <div className="mt-0.5 font-body text-caption italic text-muted">
                        &ldquo;{line.notes}&rdquo;
                      </div>
                    )}
                    <div className="mt-0.5 font-body text-body-sm font-medium text-ink">
                      {formatRwf(line.lineTotal)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-pill border border-hairline bg-surface-card p-[3px]">
                    <button
                      type="button"
                      aria-label="Remove one"
                      onClick={() => onDec(line.lineKey)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full font-body text-xl text-muted"
                    >
                      −
                    </button>
                    <span className="min-w-[18px] text-center font-body text-body-sm font-medium text-ink">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Add one"
                      onClick={() => onInc(line.lineKey)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-primary font-body text-lg text-on-primary"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between px-1 pb-[18px]">
              <span className="font-body text-body-sm font-medium text-muted">Total</span>
              <span className="font-body text-title-md font-medium text-ink">{formatRwf(total)}</span>
            </div>

            <div className="flex flex-col gap-3.5">
              <Input
                label="Phone number"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="078XXXXXXX"
                className="h-[52px] text-body-md"
              />

              <div className="relative">
                <label className="mb-1.5 block font-body text-body-sm font-medium text-ink">
                  Delivery sector
                </label>
                <button
                  type="button"
                  onClick={onSectorToggle}
                  className="flex h-[52px] w-full items-center justify-between rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md focus:border-2 focus:border-ink focus:outline-none"
                >
                  <span className={sector ? "text-ink" : "text-muted-soft"}>
                    {sector || "Choose your sector"}
                  </span>
                  <Icon name="chevronRight" size={18} className="rotate-90 text-muted" />
                </button>
                <div
                  className={cn(
                    "glass-liquid-menu absolute left-0 right-0 top-[82px] z-[5] overflow-hidden rounded-brand-lg border border-hairline transition-[max-height,opacity] duration-200 ease-out",
                    sectorOpen ? "max-h-80 opacity-100" : "pointer-events-none max-h-0 opacity-0"
                  )}
                >
                  {KIGALI_SECTORS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSectorPick(s)}
                      className="w-full border-b border-hairline px-4 py-3 text-left font-body text-body-sm font-medium text-ink last:border-b-0 hover:bg-canvas-soft"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label="Landmark"
                type="text"
                value={landmark}
                onChange={(e) => onLandmarkChange(e.target.value)}
                placeholder="e.g., Opposite Simba Supermarket"
                className="h-[52px] text-body-md"
              />
            </div>

            {payError ? (
              <p className="mt-4 rounded-brand-lg bg-error/10 px-4 py-3 font-body text-body-sm font-medium text-error">
                {payError}
              </p>
            ) : null}

            <button
              type="button"
              disabled={!canPay}
              onClick={onPay}
              className={cn(
                "mt-[22px] flex h-14 w-full items-center justify-center gap-2.5 rounded-brand-lg font-body text-button font-medium text-momo-dark transition",
                canPay
                  ? "bg-gradient-to-br from-gold to-momo shadow-brand-soft"
                  : "cursor-not-allowed bg-gradient-to-br from-gold to-momo opacity-50"
              )}
            >
              <Icon name="momo" size={22} className="text-momo-dark" strokeWidth={1.9} />
              Pay securely with MoMo
            </button>
            <div className="mt-[11px] text-center font-body text-caption text-muted-soft">
              You&apos;ll get a prompt on your phone to confirm
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
