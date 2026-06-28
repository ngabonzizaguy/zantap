"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getMenuItemGalleryUrls } from "@/lib/menu/media";
import {
  CUSTOMIZATION_NOTES_MAX,
  computeCustomizeTotal,
  resolveCustomization,
  type CustomizationSelection,
} from "@/lib/menu/customization";
import { MenuItemImageCarousel } from "@/components/customer/MenuItemImageCarousel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

const DRAG_CLOSE_PX = 130;
const FLICK_VELOCITY = 0.6;

interface MenuItemCustomizeSheetProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToOrder: (selection: CustomizationSelection) => void;
}

export function MenuItemCustomizeSheet({
  item,
  onClose,
  onAddToOrder,
}: MenuItemCustomizeSheetProps) {
  const isOpen = item !== null;

  // Persist the last item through the close animation (item goes null on close).
  const [renderItem, setRenderItem] = useState<MenuItem | null>(item);

  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startY: number; startT: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset the ephemeral draft each time a new item opens.
  useEffect(() => {
    if (item) {
      setRenderItem(item);
      setQty(1);
      setRemoved(new Set());
      setAddOnQty({});
      setNotes("");
      setDragY(0);
    }
  }, [item]);

  const customization = useMemo(
    () => (renderItem ? resolveCustomization(renderItem) : null),
    [renderItem]
  );

  const selection = useMemo<CustomizationSelection | null>(() => {
    if (!renderItem) return null;
    return {
      menuItemId: renderItem.id,
      qty,
      removedIncludedIds: [...removed],
      addOns: Object.entries(addOnQty)
        .filter(([, n]) => n > 0)
        .map(([id, n]) => ({ id, qty: n })),
      notes,
    };
  }, [renderItem, qty, removed, addOnQty, notes]);

  const displayTotal =
    renderItem && selection ? computeCustomizeTotal(selection, renderItem) : 0;

  const galleryUrls = renderItem ? getMenuItemGalleryUrls(renderItem) : [];
  const fallbackBg = renderItem
    ? `radial-gradient(circle at 32% 28%, ${renderItem.thumbFrom ?? "#ffd2b0"}, ${renderItem.thumbTo ?? "#f5945f"})`
    : "";

  const selectedAddOns =
    customization?.addOns.filter((addOn) => (addOnQty[addOn.id] ?? 0) > 0) ?? [];

  const toggleRemoved = (id: string) => {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAddOn = (id: string) => {
    setAddOnQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) > 0 ? 0 : 1 }));
  };

  const handleConfirm = () => {
    if (selection) onAddToOrder(selection);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startT: Date.now() };
    setDragging(true);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    setDragY(Math.max(0, e.clientY - dragRef.current.startY));
  };

  const onPointerEnd = (e: ReactPointerEvent) => {
    const start = dragRef.current;
    if (!start) return;
    const dy = Math.max(0, e.clientY - start.startY);
    const velocity = dy / Math.max(Date.now() - start.startT, 1);
    dragRef.current = null;
    setDragging(false);

    const sheetHeight = sheetRef.current?.offsetHeight ?? 600;
    if (dy > Math.min(DRAG_CLOSE_PX, sheetHeight * 0.25) || velocity > FLICK_VELOCITY) {
      onClose();
    } else {
      setDragY(0);
    }
  };

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
        ref={sheetRef}
        className={cn(
          "relative flex max-h-[92vh] w-full max-w-customer flex-col rounded-t-[34px] border border-white/70 border-b-0 bg-gradient-to-b from-[rgba(252,240,233,0.94)] to-[rgba(248,231,228,0.97)] shadow-[0_-20px_60px_rgba(120,70,60,0.3)] backdrop-blur-[40px] transition-transform duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)]",
          isOpen ? "translate-y-0" : "translate-y-[101%]"
        )}
        style={{
          transform: isOpen ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? "none" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-none cursor-grab touch-none justify-center pb-1 pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="h-[5px] w-[42px] rounded-full bg-[rgba(120,90,80,0.3)]" />
        </div>

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-[18px] top-[18px] z-10 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[rgba(120,90,80,0.12)] backdrop-blur-sm"
        >
          <Icon name="close" size={18} strokeWidth={2} className="text-zt-brown-muted" />
        </button>

        {renderItem && customization && (
          <>
            <div className="zt-hidescroll flex-1 overflow-y-auto px-[22px] pb-4">
              <div className="pr-12">
                <h2 className="font-serif text-[27px] leading-tight text-zt-brown">
                  {renderItem.name}
                </h2>
                {renderItem.description && (
                  <p className="mt-1 line-clamp-2 text-[13px] font-medium leading-snug text-zt-warm">
                    {renderItem.description}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[18px] font-extrabold tracking-[0.2px] text-zt-accent">
                  {formatRwf(renderItem.priceRwf)}
                </span>
                <div className="flex items-center gap-1 rounded-full border border-white/80 bg-white/70 p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-2xl text-zt-brown-muted disabled:opacity-40"
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <span className="min-w-[26px] text-center text-[16px] font-extrabold text-zt-brown">
                    {qty}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-zt-brown text-xl text-white"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <MenuItemImageCarousel
                  urls={galleryUrls}
                  fallbackBg={fallbackBg}
                  variant="hero"
                  indicator="count"
                />
              </div>

              <GlassPanel className="mt-4 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-[20px] leading-none text-zt-brown">
                    Ingredients
                  </h3>
                  <span className="rounded-full bg-[rgba(120,90,80,0.1)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.6px] text-zt-warm">
                    Optional
                  </span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-zt-warm">
                  Customize your order
                </p>

                <div className="mt-3 flex flex-col gap-2">
                  {customization.included.map((inc) => {
                    const kept = !removed.has(inc.id);
                    return (
                      <button
                        key={inc.id}
                        type="button"
                        onClick={() => toggleRemoved(inc.id)}
                        className="flex items-center gap-3 rounded-[16px] border border-white/60 bg-white/55 p-2.5 text-left transition active:scale-[0.99]"
                      >
                        <CheckBox checked={kept} />
                        <RowThumb icon={inc.icon} />
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "truncate text-[14px] font-bold text-zt-brown",
                              !kept && "line-through opacity-50"
                            )}
                          >
                            {inc.name}
                          </div>
                          {inc.description && (
                            <div className="truncate text-[12px] font-medium text-zt-warm">
                              {inc.description}
                            </div>
                          )}
                        </div>
                        <span
                          className={cn(
                            "flex-none rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.4px]",
                            kept
                              ? "bg-[rgba(120,90,80,0.08)] text-zt-warm"
                              : "bg-[rgba(176,90,70,0.12)] text-[#b05a46]"
                          )}
                        >
                          {kept ? "Included" : "Removed"}
                        </span>
                      </button>
                    );
                  })}

                  {customization.addOns.map((addOn) => {
                    const active = (addOnQty[addOn.id] ?? 0) > 0;
                    return (
                      <button
                        key={addOn.id}
                        type="button"
                        onClick={() => toggleAddOn(addOn.id)}
                        className={cn(
                          "flex items-center gap-3 rounded-[16px] border p-2.5 text-left transition active:scale-[0.99]",
                          active
                            ? "border-zt-brown/30 bg-white/80"
                            : "border-white/60 bg-white/45"
                        )}
                      >
                        <CheckBox checked={active} />
                        <RowThumb icon={addOn.icon} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14px] font-bold text-zt-brown">
                            {addOn.name}
                          </div>
                          {addOn.description && (
                            <div className="truncate text-[12px] font-medium text-zt-warm">
                              {addOn.description}
                            </div>
                          )}
                        </div>
                        <span className="flex-none text-[13px] font-extrabold text-zt-accent">
                          + {formatRwf(addOn.priceRwf)}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-zt-warm-lighter">
                  <Icon name="check" size={13} strokeWidth={2.4} />
                  You can always add more in the notes
                </div>
              </GlassPanel>

              <div className="mt-4">
                <label className="mb-[7px] block text-xs font-bold uppercase tracking-wide text-zt-warm">
                  Special instructions
                </label>
                <textarea
                  value={notes}
                  onChange={(e) =>
                    setNotes(e.target.value.slice(0, CUSTOMIZATION_NOTES_MAX))
                  }
                  maxLength={CUSTOMIZATION_NOTES_MAX}
                  rows={2}
                  placeholder="No onions, extra spicy, pack separately…"
                  className="zt-hidescroll w-full resize-none rounded-2xl border-[1.5px] border-[rgba(120,90,80,0.18)] bg-white/70 px-4 py-3 text-[15px] font-medium text-zt-brown placeholder:text-[#b59d92] focus:border-2 focus:border-zt-brown-dark focus:outline-none"
                />
                <div className="mt-1 text-right text-[11px] font-medium text-zt-warm-lighter">
                  {notes.length}/{CUSTOMIZATION_NOTES_MAX}
                </div>
              </div>

              <GlassPanel className="mt-2 p-4">
                <div className="flex items-center justify-between text-[13px] font-medium text-zt-warm">
                  <span>Base price</span>
                  <span className="font-bold text-zt-brown">
                    {formatRwf(renderItem.priceRwf)}
                  </span>
                </div>
                {selectedAddOns.map((addOn) => (
                  <div
                    key={addOn.id}
                    className="mt-1.5 flex items-center justify-between text-[13px] font-medium text-zt-warm"
                  >
                    <span className="truncate pr-2">+ {addOn.name}</span>
                    <span className="font-bold text-zt-brown">
                      {formatRwf(addOn.priceRwf * (addOnQty[addOn.id] ?? 1))}
                    </span>
                  </div>
                ))}
                <div className="mt-1.5 flex items-center justify-between text-[13px] font-medium text-zt-warm">
                  <span>Quantity</span>
                  <span className="font-bold text-zt-brown">×{qty}</span>
                </div>
                <div className="my-3 h-px bg-[rgba(120,90,80,0.15)]" />
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-zt-warm">Total</span>
                  <span className="text-[22px] font-extrabold text-zt-brown">
                    {formatRwf(displayTotal)}
                  </span>
                </div>
              </GlassPanel>
            </div>

            <div className="flex-none border-t border-white/50 bg-[rgba(252,240,233,0.6)] px-[22px] py-3.5 backdrop-blur-sm">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-[18px] bg-zt-brown text-[16px] font-extrabold text-white shadow-[0_14px_30px_rgba(58,44,38,0.32)] transition active:scale-[0.98]"
              >
                <Icon name="cart" size={20} strokeWidth={2} />
                Add to order
                <span className="tracking-[0.2px]">{formatRwf(displayTotal)}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 flex-none items-center justify-center rounded-[8px] border-2 transition",
        checked
          ? "border-zt-brown bg-zt-brown text-white"
          : "border-[rgba(120,90,80,0.3)] bg-white/70 text-transparent"
      )}
    >
      <Icon name="check" size={14} strokeWidth={3} />
    </span>
  );
}

function RowThumb({ icon }: { icon?: string }) {
  return (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[12px] bg-gradient-to-br from-[#ffd9c2] to-[#f5a87f] text-white shadow-[inset_0_1px_3px_rgba(255,255,255,0.5)]">
      <Icon name={(icon as IconName) ?? "plate"} size={16} strokeWidth={2} />
    </span>
  );
}
