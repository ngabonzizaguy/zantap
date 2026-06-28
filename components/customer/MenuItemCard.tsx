"use client";

import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getMenuItemGalleryUrls } from "@/lib/menu/media";
import { MenuItemImageCarousel } from "@/components/customer/MenuItemImageCarousel";
import { Icon } from "@/components/ui/Icon";
import { GlassPanel } from "@/components/ui/GlassPanel";

interface MenuItemCardProps {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onOpen: () => void;
}

export function MenuItemCard({ item, qty, onAdd, onOpen }: MenuItemCardProps) {
  const thumbBg = `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`;
  const galleryUrls = getMenuItemGalleryUrls(item);

  return (
    <GlassPanel
      role="button"
      tabIndex={0}
      aria-label={`Customize ${item.name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative flex cursor-pointer items-center gap-4 p-3.5 transition active:scale-[0.99]"
    >
      <div className="relative flex-none">
        <MenuItemImageCarousel urls={galleryUrls} fallbackBg={thumbBg} />
        {qty > 0 && (
          <div className="absolute -left-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#fbeee6] bg-zt-brown px-1.5 text-xs font-extrabold text-white shadow-[0_4px_10px_rgba(0,0,0,0.22)]">
            {qty}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="truncate text-[16px] font-bold leading-snug text-zt-brown">
          {item.name}
        </div>
        <div className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-zt-warm">
          {item.description}
        </div>
        <div className="mt-2.5 text-[15px] font-extrabold tracking-[0.2px] text-zt-accent">
          {formatRwf(item.priceRwf)}
        </div>
      </div>

      <button
        type="button"
        aria-label={`Add ${item.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        className="flex h-11 w-11 flex-none items-center justify-center rounded-[14px] border-none bg-zt-brown text-white shadow-[0_8px_18px_rgba(58,44,38,0.32)] transition-transform active:scale-95"
      >
        <Icon name="plus" size={20} strokeWidth={2.2} />
      </button>
    </GlassPanel>
  );
}

interface MenuListProps {
  items: MenuItem[];
  cart: Record<string, number>;
  onAdd: (id: string) => void;
  onOpen: (item: MenuItem) => void;
}

export function MenuList({ items, cart, onAdd, onOpen }: MenuListProps) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <MenuItemCard
          key={item.id}
          item={item}
          qty={cart[item.id] ?? 0}
          onAdd={() => onAdd(item.id)}
          onOpen={() => onOpen(item)}
        />
      ))}
    </div>
  );
}
