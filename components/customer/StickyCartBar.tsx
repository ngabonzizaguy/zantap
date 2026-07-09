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
        className="glass-liquid-strong flex w-full items-center gap-3 rounded-pill p-2.5 pl-3.5 transition-transform active:scale-[0.99]"
      >
        <div className="relative flex h-12 w-12 flex-none items-center justify-center rounded-full border border-white/12 bg-white/8 backdrop-blur-md">
          <Icon name="cart" size={20} className="text-ink" />
          <div className="glass-gold-badge absolute -right-1 -top-1 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 font-body text-[11px] font-semibold">
            {count}
          </div>
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="font-body text-caption text-muted">
            {count === 1 ? "1 item" : `${count} items`}
          </div>
          <div className="font-body text-title-sm font-medium leading-tight text-ink">
            {formatRwf(total)}
          </div>
        </div>
        <div className="glass-gold-pill flex h-11 items-center gap-1.5 px-5 font-body text-button font-semibold transition hover:brightness-110">
          Review order
          <Icon name="chevronRight" size={18} strokeWidth={2.2} />
        </div>
      </button>
    </div>
  );
}
