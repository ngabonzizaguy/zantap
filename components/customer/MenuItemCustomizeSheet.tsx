"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { getMenuItemGalleryUrls } from "@/lib/menu/media";
import {
  CUSTOMIZATION_NOTES_MAX,
  computeCustomizeTotal,
  INGREDIENTS_UI_ENABLED,
  resolveCustomization,
  type CustomizationSelection,
} from "@/lib/menu/customization";
import {
  MenuItemImageCarousel,
  MenuItemPhotoStrip,
} from "@/components/customer/MenuItemImageCarousel";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  getMenuItemPrice,
  getMenuItemSizeOptions,
} from "@/lib/menu/sizes";

const DRAG_CLOSE_PX = 130;
const FLICK_VELOCITY = 0.6;

interface MenuItemCustomizeSheetProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToOrder: (selection: CustomizationSelection) => void;
}

/** "Beef Brochettes" → "Customize your brochettes" */
function customizeSubtitle(name: string): string {
  const last = name.trim().split(/\s+/).pop()?.toLowerCase();
  return last ? `Customize your ${last}` : "Customize your order";
}

export function MenuItemCustomizeSheet({
  item,
  onClose,
  onAddToOrder,
}: MenuItemCustomizeSheetProps) {
  const isOpen = item !== null;

  const [renderItem, setRenderItem] = useState<MenuItem | null>(item);

  const [qty, setQty] = useState(1);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [addOnQty, setAddOnQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [sizeOptionId, setSizeOptionId] = useState<string | undefined>(() =>
    item
      ? getMenuItemSizeOptions(item, { availableOnly: true })[0]?.id
      : undefined
  );

  const dragRef = useRef<{ startY: number; startT: number } | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Reset selection when a new item opens ("adjust state during render").
  const [prevItem, setPrevItem] = useState<MenuItem | null>(item);
  if (item !== prevItem) {
    setPrevItem(item);
    if (item) {
      setRenderItem(item);
      setQty(1);
      if (INGREDIENTS_UI_ENABLED) {
        setRemoved(new Set());
        setAddOnQty({});
      }
      setNotes("");
      setPhotoIndex(0);
      setSizeOptionId(
        getMenuItemSizeOptions(item, { availableOnly: true })[0]?.id
      );
    }
  }

  useEffect(() => {
    if (!item) return;
    // Clear inline drag styles a cancelled gesture may have left behind.
    const el = sheetRef.current;
    if (el) {
      el.style.transition = "";
      el.style.transform = "";
    }
  }, [item]);

  const customization = useMemo(
    () =>
      renderItem && INGREDIENTS_UI_ENABLED
        ? resolveCustomization(renderItem)
        : null,
    [renderItem]
  );

  const selection = useMemo<CustomizationSelection | null>(() => {
    if (!renderItem) return null;
    return {
      menuItemId: renderItem.id,
      ...(sizeOptionId ? { sizeOptionId } : {}),
      qty,
      removedIncludedIds: INGREDIENTS_UI_ENABLED ? [...removed] : [],
      addOns: INGREDIENTS_UI_ENABLED
        ? Object.entries(addOnQty)
            .filter(([, n]) => n > 0)
            .map(([id, n]) => ({ id, qty: n }))
        : [],
      notes,
    };
  }, [renderItem, qty, removed, addOnQty, notes, sizeOptionId]);

  const displayTotal =
    renderItem && selection ? computeCustomizeTotal(selection, renderItem) : 0;

  const galleryUrls = renderItem ? getMenuItemGalleryUrls(renderItem) : [];
  const sizeOptions = renderItem
    ? getMenuItemSizeOptions(renderItem, { availableOnly: true })
    : [];
  const fallbackBg = renderItem
    ? `radial-gradient(circle at 32% 28%, ${renderItem.thumbFrom ?? "#ffd2b0"}, ${renderItem.thumbTo ?? "#f5945f"})`
    : "";

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

  // Drag writes go straight to the DOM node: routing every pointermove
  // through React state re-renders the whole sheet tree per frame, which is
  // exactly the finger-tracking jank this avoids on mid-range phones.
  const onPointerDown = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startY: e.clientY, startT: Date.now() };
    const el = sheetRef.current;
    if (el) el.style.transition = "none";
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    const dy = Math.max(0, e.clientY - dragRef.current.startY);
    const el = sheetRef.current;
    if (el) el.style.transform = `translateY(${dy}px)`;
  };

  const onPointerEnd = (e: ReactPointerEvent) => {
    const start = dragRef.current;
    if (!start) return;
    const dy = Math.max(0, e.clientY - start.startY);
    const velocity = dy / Math.max(Date.now() - start.startT, 1);
    dragRef.current = null;

    // Restoring the class-driven transform in the same frame as the state
    // change makes the sheet transition from the released finger position —
    // down and out on close, or springing back up on release.
    const el = sheetRef.current;
    const sheetHeight = el?.offsetHeight ?? 600;
    if (el) {
      el.style.transition = "";
      el.style.transform = "";
    }
    if (dy > Math.min(DRAG_CLOSE_PX, sheetHeight * 0.25) || velocity > FLICK_VELOCITY) {
      onClose();
    }
  };

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
        ref={sheetRef}
        className={cn(
          "glass-liquid-sheet relative flex max-h-[92vh] w-full max-w-customer flex-col rounded-t-brand-xxl border border-hairline border-b-0 transition-transform duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)]",
          isOpen ? "translate-y-0" : "translate-y-[101%]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex flex-none cursor-grab touch-none justify-center pb-3 pt-2.5 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="h-1 w-10 rounded-full bg-hairline-strong" />
        </div>

        {renderItem && (
          <>
            <div className="zt-hidescroll flex-1 overflow-y-auto px-[22px] pb-4 pt-1">
              {/* Header: square image + meta + stepper (mockup two-zone layout) */}
              <div className="relative flex gap-3.5">
                <MenuItemImageCarousel
                  urls={galleryUrls}
                  fallbackBg={fallbackBg}
                  variant="header"
                  indicator="count"
                  activeIndex={photoIndex}
                  onActiveIndexChange={setPhotoIndex}
                  className="flex-none"
                />

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="pr-9">
                    <h2 className="font-display text-display-md text-ink">
                      {renderItem.name}
                    </h2>
                    {renderItem.description && (
                      <p className="mt-0.5 line-clamp-2 font-body text-caption leading-snug text-muted">
                        {renderItem.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-2 flex w-full items-center">
                    <span className="flex-none font-body text-title-sm font-medium text-ink">
                      {formatRwf(getMenuItemPrice(renderItem, sizeOptionId))}
                    </span>
                    <div className="ml-auto flex items-center gap-0.5 rounded-pill border border-hairline bg-surface-card p-0.5 shadow-brand-soft">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="flex h-8 w-8 items-center justify-center rounded-full font-body text-xl text-muted disabled:opacity-40"
                        disabled={qty <= 1}
                      >
                        −
                      </button>
                      <span className="min-w-[22px] text-center font-body text-body-sm font-medium text-ink">
                        {qty}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => setQty((q) => q + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-body text-lg text-on-primary"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="absolute right-0 top-0 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-surface-strong text-muted transition-colors hover:text-ink"
                >
                  <Icon name="close" size={16} strokeWidth={2} />
                </button>
              </div>

              {sizeOptions.length > 0 && (
                <fieldset className="mt-5">
                  <legend className="sr-only">Choose a size</legend>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-body text-body-sm font-medium text-ink">
                      Choose a size
                    </span>
                    <span className="rounded-pill border border-gold/30 bg-gold/10 px-2 py-0.5 font-body text-caption font-medium text-gold">
                      Required
                    </span>
                  </div>
                  <p className="mt-1 font-body text-caption text-muted">
                    Select one option for this item.
                  </p>
                  <div className="mt-2.5 grid grid-cols-1 gap-2">
                    {sizeOptions.map((option) => {
                      const selected = sizeOptionId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSizeOptionId(option.id)}
                          className={cn(
                            "flex min-h-14 items-center gap-3 rounded-brand-lg border px-3.5 py-2.5 text-left transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.99]",
                            selected
                              ? "border-gold/50 bg-gold/10 shadow-[inset_0_0_0_1px_rgba(244,198,87,0.18)]"
                              : "border-hairline bg-surface-card hover:border-hairline-strong hover:bg-surface-strong"
                          )}
                        >
                          <span
                            aria-hidden
                            className={cn(
                              "flex h-5 w-5 flex-none items-center justify-center rounded-full border transition-colors",
                              selected
                                ? "border-gold bg-gold text-gold-on"
                                : "border-hairline-strong bg-transparent text-transparent"
                            )}
                          >
                            <Icon name="check" size={12} strokeWidth={3} />
                          </span>

                          <span className="min-w-0 flex-1 truncate font-body text-body-sm font-medium text-ink">
                            {option.label}
                          </span>
                          <span className={cn(
                            "flex-none font-mono text-caption font-medium",
                            selected ? "text-gold" : "text-muted"
                          )}>
                            {formatRwf(option.priceRwf)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {INGREDIENTS_UI_ENABLED && customization && (
                <Card padding="sm" className="mt-5 shadow-none">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-display-sm text-ink">
                      Ingredients
                    </h3>
                    <Badge variant="muted">Optional</Badge>
                  </div>
                  <p className="mt-1 font-body text-caption text-muted">
                    {customizeSubtitle(renderItem.name)}
                  </p>

                  <div className="mt-3 flex flex-col gap-2">
                    {customization.included.map((inc) => {
                      const kept = !removed.has(inc.id);
                      return (
                        <button
                          key={inc.id}
                          type="button"
                          onClick={() => toggleRemoved(inc.id)}
                          className="flex items-center gap-3 rounded-brand-lg border border-hairline bg-canvas-soft p-2.5 text-left transition active:scale-[0.99]"
                        >
                          <CheckBox checked={kept} />
                          <RowThumb icon={inc.icon} />
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "truncate font-body text-body-sm font-medium text-ink",
                                !kept && "line-through opacity-50"
                              )}
                            >
                              {inc.name}
                            </div>
                            {inc.description && (
                              <div className="truncate font-body text-caption text-muted">
                                {inc.description}
                              </div>
                            )}
                          </div>
                          {kept ? (
                            <Badge variant="muted" className="flex-none">
                              Included
                            </Badge>
                          ) : (
                            <Badge
                              variant="default"
                              className="flex-none bg-error/10 text-error"
                            >
                              Removed
                            </Badge>
                          )}
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
                            "flex items-center gap-3 rounded-brand-lg border p-2.5 text-left transition active:scale-[0.99]",
                            active
                              ? "border-hairline-strong bg-surface-card"
                              : "border-hairline bg-canvas-soft"
                          )}
                        >
                          <CheckBox checked={active} />
                          <RowThumb icon={addOn.icon} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-body text-body-sm font-medium text-ink">
                              {addOn.name}
                            </div>
                            {addOn.description && (
                              <div className="truncate font-body text-caption text-muted">
                                {addOn.description}
                              </div>
                            )}
                          </div>
                          <span className="flex-none font-body text-body-sm font-medium text-ink">
                            + {formatRwf(addOn.priceRwf)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 font-body text-caption text-muted-soft">
                    <Icon name="check" size={13} strokeWidth={2.4} />
                    You can always add more in the notes
                  </div>
                </Card>
              )}

              {galleryUrls.length >= 2 && (
                <div className={cn(INGREDIENTS_UI_ENABLED ? "mt-4" : "mt-5")}>
                  <h3 className="mb-2.5 font-display text-display-sm text-ink">
                    Photos
                  </h3>
                  <MenuItemPhotoStrip
                    urls={galleryUrls}
                    activeIndex={photoIndex}
                    onSelect={setPhotoIndex}
                  />
                </div>
              )}

              <div className="mt-4">
                <label className="mb-1.5 block font-body text-body-sm font-medium text-ink">
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
                  className="zt-hidescroll w-full resize-none rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-ink focus:px-[15px] focus:outline-none"
                />
                <div className="mt-1 text-right font-body text-caption text-muted-soft">
                  {notes.length}/{CUSTOMIZATION_NOTES_MAX}
                </div>
              </div>
            </div>

            <div className="flex-none border-t border-hairline bg-surface-card px-[22px] py-3.5">
              <Button
                type="button"
                radius="lg"
                onClick={handleConfirm}
                className="flex h-14 w-full items-center justify-between px-5 shadow-brand-soft active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5">
                  <Icon name="cart" size={20} strokeWidth={2} />
                  Add to order
                </span>
                <span>{formatRwf(displayTotal)}</span>
              </Button>
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
        "flex h-6 w-6 flex-none items-center justify-center rounded-brand-md border-2 transition",
        checked
          ? "border-primary bg-primary text-on-primary"
          : "border-hairline-strong bg-surface-card text-transparent"
      )}
    >
      <Icon name="check" size={14} strokeWidth={3} />
    </span>
  );
}

function RowThumb({ icon }: { icon?: string }) {
  return (
    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-brand-md bg-gradient-to-br from-gradient-peach/50 to-gradient-rose/40 text-muted shadow-brand-soft">
      <Icon name={(icon as IconName) ?? "plate"} size={16} strokeWidth={2} />
    </span>
  );
}
