"use client";

import { KIGALI_SECTORS } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import type { CheckoutLine } from "@/lib/checkout/types";
import { Icon } from "@/components/ui/Icon";
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
        "fixed inset-0 z-[60] flex items-end justify-center transition-all duration-300",
        isOpen
          ? "pointer-events-auto bg-[rgba(50,30,24,0.4)] backdrop-blur-[7px]"
          : "pointer-events-none bg-transparent backdrop-blur-none"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "zt-hidescroll max-h-[90vh] w-full max-w-customer overflow-y-auto rounded-t-[34px] border border-white/70 border-b-0 bg-gradient-to-b from-[rgba(252,240,233,0.92)] to-[rgba(248,231,228,0.96)] shadow-[0_-20px_60px_rgba(120,70,60,0.3)] backdrop-blur-[40px] transition-transform duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)]",
          isOpen ? "translate-y-0" : "translate-y-[101%]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center pt-2.5">
          <div className="h-[5px] w-[42px] rounded-full bg-[rgba(120,90,80,0.3)]" />
        </div>

        {showLoading ? (
          <div className="flex flex-col items-center px-[30px] pb-[62px] pt-[54px] text-center">
            <div className="relative h-[74px] w-[74px]">
              <div className="absolute inset-0 animate-ztspin rounded-full border-4 border-[rgba(120,90,80,0.15)] border-t-momo" />
              <div className="absolute inset-[19px] flex items-center justify-center rounded-full bg-gradient-to-br from-[#FFD24C] to-momo">
                <Icon name="momo" size={18} className="text-momo-dark" strokeWidth={2.2} />
              </div>
            </div>
            <div className="mt-6 font-serif text-[26px] text-zt-brown">Contacting MoMo…</div>
            <div className="mt-2 text-sm font-medium text-zt-warm">
              Requesting authorization for {formatRwf(total)}
            </div>
            <div className="mt-[30px] flex w-full flex-col gap-2.5">
              <div className="h-3.5 animate-ztshim rounded-full bg-[rgba(120,90,80,0.12)]" />
              <div className="h-3.5 w-[74%] animate-ztshim rounded-full bg-[rgba(120,90,80,0.12)] [animation-delay:0.2s]" />
              <div className="h-3.5 w-[54%] animate-ztshim rounded-full bg-[rgba(120,90,80,0.12)] [animation-delay:0.4s]" />
            </div>
          </div>
        ) : (
          <div className="px-[22px] pb-[26px] pt-3.5">
            <div className="mb-1.5 flex items-center justify-between">
              <div className="font-serif text-[30px] text-zt-brown">Your order</div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[rgba(120,90,80,0.1)]"
              >
                <Icon name="close" size={18} strokeWidth={2} className="text-zt-brown-muted" />
              </button>
            </div>

            <div className="my-2.5 flex flex-col gap-2">
              {lines.map((line) => (
                <div
                  key={line.menuItemId}
                  className="flex items-center gap-3 rounded-[18px] border border-white/60 bg-white/55 p-[11px_13px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-zt-brown">{line.name}</div>
                    <div className="mt-0.5 text-[13px] font-bold text-zt-accent">
                      {formatRwf(line.lineTotal)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/80 p-[3px]">
                    <button
                      type="button"
                      aria-label="Remove one"
                      onClick={() => onDec(line.menuItemId)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-xl text-zt-brown-muted"
                    >
                      −
                    </button>
                    <span className="min-w-[18px] text-center text-sm font-extrabold text-zt-brown">
                      {line.qty}
                    </span>
                    <button
                      type="button"
                      aria-label="Add one"
                      onClick={() => onInc(line.menuItemId)}
                      className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-zt-brown text-lg text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-baseline justify-between px-1 pb-[18px]">
              <span className="text-sm font-semibold text-zt-warm">Total</span>
              <span className="text-[22px] font-extrabold text-zt-brown">{formatRwf(total)}</span>
            </div>

            <div className="flex flex-col gap-3.5">
              <div>
                <label className="mb-[7px] block text-xs font-bold uppercase tracking-wide text-zt-warm">
                  Phone number
                </label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="h-[52px] w-full rounded-2xl border-[1.5px] border-[rgba(120,90,80,0.18)] bg-white/70 px-4 text-base font-semibold text-zt-brown focus:border-2 focus:border-zt-brown-dark"
                />
              </div>

              <div className="relative">
                <label className="mb-[7px] block text-xs font-bold uppercase tracking-wide text-zt-warm">
                  Delivery sector
                </label>
                <button
                  type="button"
                  onClick={onSectorToggle}
                  className="flex h-[52px] w-full items-center justify-between rounded-2xl border-[1.5px] border-[rgba(120,90,80,0.18)] bg-white/70 px-4 text-base font-semibold"
                >
                  <span className={sector ? "text-zt-brown" : "text-[#b59d92]"}>
                    {sector || "Choose your sector"}
                  </span>
                  <Icon name="chevronRight" size={18} className="rotate-90 text-zt-brown-muted" />
                </button>
                <div
                  className={cn(
                    "absolute left-0 right-0 top-[82px] z-[5] overflow-hidden rounded-2xl border border-[rgba(120,90,80,0.15)] bg-white/95 shadow-[0_16px_36px_rgba(120,70,60,0.22)] transition-all",
                    sectorOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  )}
                >
                  {KIGALI_SECTORS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onSectorPick(s)}
                      className="w-full border-b border-[rgba(120,90,80,0.08)] px-4 py-3 text-left text-[15px] font-semibold text-zt-brown last:border-b-0"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-[7px] block text-xs font-bold uppercase tracking-wide text-zt-warm">
                  Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => onLandmarkChange(e.target.value)}
                  placeholder="e.g., Opposite Simba Supermarket"
                  className="h-[52px] w-full rounded-2xl border-[1.5px] border-[rgba(120,90,80,0.18)] bg-white/70 px-4 text-base font-semibold text-zt-brown focus:border-2 focus:border-zt-brown-dark"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!canPay}
              onClick={onPay}
              className={cn(
                "mt-[22px] flex h-14 w-full items-center justify-center gap-2.5 rounded-[18px] text-[17px] font-extrabold text-momo-dark transition",
                canPay
                  ? "bg-gradient-to-br from-[#FFD24C] to-momo shadow-[0_14px_30px_rgba(245,166,35,0.5)]"
                  : "cursor-not-allowed bg-gradient-to-br from-[#FFD24C] to-momo opacity-50"
              )}
            >
              <Icon name="momo" size={22} className="text-momo-dark" strokeWidth={1.9} />
              Pay securely with MoMo
            </button>
            <div className="mt-[11px] text-center text-xs font-medium text-zt-warm-lighter">
              You&apos;ll get a prompt on your phone to confirm
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
