"use client";

import { formatRwf } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

interface StickyCartBarProps {
  count: number;
  total: number;
  onOpen: () => void;
}

export function StickyCartBar({ count, total, onOpen }: StickyCartBarProps) {
  if (count <= 0) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-32px)] max-w-[418px] -translate-x-1/2">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-full border border-white/55 bg-gradient-to-br from-white/75 to-white/55 p-2.5 pl-3.5 shadow-cart backdrop-blur-[30px] transition-transform active:scale-[0.99]"
      >
        <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full bg-zt-brown shadow-[0_6px_16px_rgba(58,44,38,0.36)]">
          <Icon name="cart" size={20} className="text-white" />
          <div className="absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full border-2 border-[#fbeee6] bg-red-600 px-1 text-[11px] font-extrabold text-white">
            {count}
          </div>
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="text-[12px] font-semibold tracking-[0.1px] text-zt-warm">
            {count === 1 ? "1 item" : `${count} items`}
          </div>
          <div className="text-[18px] font-extrabold leading-tight text-zt-brown">
            {formatRwf(total)}
          </div>
        </div>
        <div className="flex h-11 items-center gap-1.5 rounded-full bg-zt-brown px-5 text-[15px] font-semibold text-white shadow-[0_8px_18px_rgba(58,44,38,0.32)]">
          Review order
          <Icon name="chevronRight" size={18} strokeWidth={2.2} />
        </div>
      </button>
    </div>
  );
}
