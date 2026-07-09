"use client";

import { useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getMenuItemGalleryUrls } from "@/lib/menu/media";
import { MenuItemImageCarousel } from "@/components/customer/MenuItemImageCarousel";
import { MenuImageLightbox } from "@/components/customer/MenuImageLightbox";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface MenuItemCardProps {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onOpen: () => void;
}

export function MenuItemCard({ item, qty, onAdd, onOpen }: MenuItemCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const thumbBg = `radial-gradient(circle at 32% 28%, ${item.thumbFrom ?? "#ffd2b0"}, ${item.thumbTo ?? "#f5945f"})`;
  const galleryUrls = getMenuItemGalleryUrls(item);
  const hasPhotos = galleryUrls.length > 0;

  return (
    <>
      <div
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
        className={cn(
          "glass-liquid relative flex cursor-pointer items-center gap-4 p-3.5",
          "transition active:scale-[0.99] hover:border-white/20"
        )}
      >
        <div
          className="relative flex-none"
          onClick={(e) => {
            if (!hasPhotos) return;
            e.stopPropagation();
            setLightboxOpen(true);
          }}
          onKeyDown={(e) => {
            if (!hasPhotos) return;
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              e.preventDefault();
              setLightboxOpen(true);
            }
          }}
          role={hasPhotos ? "button" : undefined}
          tabIndex={hasPhotos ? 0 : undefined}
          aria-label={hasPhotos ? `View photos of ${item.name}` : undefined}
        >
          <MenuItemImageCarousel urls={galleryUrls} fallbackBg={thumbBg} />
          {qty > 0 && (
            <div className="glass-gold-badge absolute -left-2 -top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-body text-caption font-semibold">
              {qty}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 py-0.5">
          <div className="truncate font-body text-body-strong text-ink">
            {item.name}
          </div>
          <div className="mt-1 line-clamp-2 font-body text-body-sm text-muted">
            {item.description}
          </div>
          <div className="mt-2.5 font-body text-body-md font-medium text-gold">
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
          className="glass-gold flex h-11 w-11 flex-none items-center justify-center rounded-brand-lg transition-transform hover:brightness-110 active:scale-95"
        >
          <Icon name="plus" size={20} strokeWidth={2.2} />
        </button>
      </div>

      {hasPhotos ? (
        <MenuImageLightbox
          open={lightboxOpen}
          urls={galleryUrls}
          itemName={item.name}
          onClose={() => setLightboxOpen(false)}
        />
      ) : null}
    </>
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
