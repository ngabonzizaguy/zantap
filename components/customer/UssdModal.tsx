"use client";

import { formatRwf } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { MOMO_SIM_PIN_HINT } from "@/lib/momo/constants";

interface UssdModalProps {
  open: boolean;
  amount: number;
  vendorName: string;
  pin: string;
  onPinChange: (pin: string) => void;
  onCancel: () => void;
  onSend: () => void;
}

export function UssdModal({
  open,
  amount,
  vendorName,
  pin,
  onPinChange,
  onCancel,
  onSend,
}: UssdModalProps) {
  const sendDisabled = pin.length < 5;

  return (
    <div
      className={cn(
        // Blur stays constant and only opacity/visibility animate: transitioning
        // the blur radius itself forces a re-blur every frame on mobile GPUs.
        "fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(20,12,10,0.55)] p-6 backdrop-blur-sm transition-[opacity,visibility] duration-300",
        open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      )}
      onClick={onCancel}
    >
      <div
        className={cn(
          "w-full max-w-[322px] overflow-hidden rounded-[18px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          open ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-[11px] px-5 pb-3.5 pt-[18px]">
          <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-gradient-to-br from-[#FFD24C] to-momo">
            <Icon name="momo" size={20} className="text-momo-dark" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-extrabold text-[#1a1410]">MTN Mobile Money</div>
            <div className="text-xs font-semibold text-[#9a9a9a]">USSD session · *182#</div>
          </div>
        </div>
        <div className="h-px bg-[#eeeae6]" />
        <div className="px-5 pb-5 pt-[18px]">
          <div className="text-sm font-medium leading-relaxed text-[#444]">
            Enter Mobile Money PIN to authorize payment of{" "}
            <span className="font-extrabold text-[#1a1410]">{formatRwf(amount)}</span> to ZanTap
            * {vendorName}
          </div>
          <input
            type="password"
            inputMode="numeric"
            maxLength={5}
            value={pin}
            onChange={(e) =>
              onPinChange((e.target.value || "").replace(/\D/g, "").slice(0, 5))
            }
            placeholder="•••••"
            className="mt-[18px] h-[58px] w-full rounded-[14px] border-[1.5px] border-[#e0dcd8] bg-[#faf8f6] text-center font-sans text-[30px] font-extrabold tracking-[16px] text-[#1a1410] focus:border-2 focus:border-momo"
          />
          <div className="mt-2 text-center text-[11px] font-medium text-[#9a9a9a]">
            {MOMO_SIM_PIN_HINT}
          </div>
        </div>
        <div className="flex border-t border-[#eeeae6]">
          <button
            type="button"
            onClick={onCancel}
            className="h-14 flex-1 border-none bg-white text-[15px] font-extrabold text-[#9a8f88]"
          >
            Cancel
          </button>
          <div className="w-px bg-[#eeeae6]" />
          <button
            type="button"
            disabled={sendDisabled}
            onClick={onSend}
            className={cn(
              "h-14 flex-1 border-none text-[15px] font-extrabold",
              sendDisabled
                ? "cursor-not-allowed bg-[#f3ede8] text-[#c4b6ac]"
                : "bg-gradient-to-br from-[#FFD24C] to-momo text-momo-dark"
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
