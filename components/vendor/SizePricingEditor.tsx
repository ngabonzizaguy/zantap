"use client";

import { useRef, useState } from "react";
import {
  GripVertical,
  Info,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  MAX_MENU_ITEM_SIZE_OPTIONS,
  MIN_MENU_ITEM_SIZE_OPTIONS,
} from "@/lib/menu/sizes";

export interface SizeOptionDraft {
  id: string;
  label: string;
  priceRwf: string;
  isAvailable: boolean;
}

interface SizePricingEditorProps {
  idPrefix: string;
  useSizes: boolean;
  singlePriceRwf: string;
  sizeOptions: SizeOptionDraft[];
  disabled?: boolean;
  onUseSizesChange: (useSizes: boolean) => void;
  onSinglePriceChange: (priceRwf: string) => void;
  onSizeOptionsChange: (options: SizeOptionDraft[]) => void;
}

const inputClass =
  "h-10 min-w-0 rounded-brand-md border border-hairline-strong bg-surface-card font-body text-body-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function displayPrice(value: string): string {
  const digits = digitsOnly(value);
  return digits ? Number(digits).toLocaleString("en-US") : "";
}

export function parsePriceDraft(value: string): number {
  return Number(digitsOnly(value));
}

function defaultDrafts(
  basePrice: string,
  current: readonly SizeOptionDraft[] = []
): SizeOptionDraft[] {
  const fallback = displayPrice(basePrice) || "";
  return ["Small", "Medium", "Large"].map((label, index) => ({
    id: label.toLowerCase(),
    label,
    priceRwf: current[index]?.priceRwf || fallback,
    isAvailable: true,
  }));
}

function customDraft(
  current: readonly SizeOptionDraft[],
  basePrice: string
): SizeOptionDraft {
  const used = new Set(current.map((option) => option.id));
  const usedLabels = new Set(
    current.map((option) => option.label.trim().toLowerCase())
  );
  let suffix = current.length + 1;
  while (
    used.has(`custom-${suffix}`) ||
    usedLabels.has(`size ${suffix}`)
  ) {
    suffix += 1;
  }
  return {
    id: `custom-${suffix}`,
    label: `Size ${suffix}`,
    priceRwf: displayPrice(basePrice),
    isAvailable: true,
  };
}

function moveOption(
  options: readonly SizeOptionDraft[],
  from: number,
  to: number
): SizeOptionDraft[] {
  if (from === to || from < 0 || to < 0) return [...options];
  const next = [...options];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function SizePricingEditor({
  idPrefix,
  useSizes,
  singlePriceRwf,
  sizeOptions,
  disabled = false,
  onUseSizesChange,
  onSinglePriceChange,
  onSizeOptionsChange,
}: SizePricingEditorProps) {
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const draggingIdRef = useRef<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const setMode = (nextUseSizes: boolean) => {
    if (nextUseSizes && sizeOptions.length === 0) {
      onSizeOptionsChange(defaultDrafts(singlePriceRwf));
    }
    onUseSizesChange(nextUseSizes);
  };

  const updateOption = (id: string, patch: Partial<SizeOptionDraft>) => {
    onSizeOptionsChange(
      sizeOptions.map((option) =>
        option.id === id ? { ...option, ...patch } : option
      )
    );
  };

  const reorderTowardPointer = (clientY: number) => {
    const draggingId = draggingIdRef.current;
    if (!draggingId) return;
    const from = sizeOptions.findIndex((option) => option.id === draggingId);
    const to = sizeOptions.findIndex((option) => {
      const rect = rowRefs.current.get(option.id)?.getBoundingClientRect();
      return rect ? clientY < rect.top + rect.height / 2 : false;
    });
    const target = to < 0 ? sizeOptions.length - 1 : to;
    if (from !== target) onSizeOptionsChange(moveOption(sizeOptions, from, target));
  };

  const stopDragging = () => {
    draggingIdRef.current = null;
    setDraggingId(null);
  };

  const availableCount = sizeOptions.filter((option) => option.isAvailable).length;

  return (
    <section className="border-t border-hairline pt-4" aria-labelledby={`${idPrefix}-pricing-heading`}>
      <div>
        <h3 id={`${idPrefix}-pricing-heading`} className="font-body text-body-sm font-medium text-ink">
          Pricing setup
        </h3>
        <p className="mt-0.5 font-body text-caption text-muted">
          Choose how this item will be priced.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-brand-md border border-hairline-strong bg-canvas-soft p-0.5">
        {[
          { value: false, label: "Single price" },
          { value: true, label: "By size" },
        ].map((option) => {
          const active = useSizes === option.value;
          return (
            <button
              key={option.label}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => setMode(option.value)}
              className={cn(
                "h-10 rounded-brand-md border font-body text-body-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-transparent text-muted hover:text-ink"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {useSizes ? (
        <>
          <p className="mt-2 flex items-center gap-1.5 font-body text-caption text-muted">
            <Info size={13} aria-hidden />
            Customers will choose a size on the storefront.
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <h4 className="font-body text-body-sm font-medium text-ink">Size pricing</h4>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSizeOptionsChange(defaultDrafts(singlePriceRwf, sizeOptions))}
              className="flex min-h-9 items-center gap-1.5 rounded-pill px-2 font-body text-caption text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Reset to default
              <RotateCcw size={13} aria-hidden />
            </button>
          </div>

          <div className="mt-2 flex flex-col gap-2" aria-label="Size options">
            {sizeOptions.map((option, index) => {
              const canDisable = !option.isAvailable || availableCount > 1;
              const canDelete =
                sizeOptions.length > MIN_MENU_ITEM_SIZE_OPTIONS &&
                (!option.isAvailable || availableCount > 1);
              return (
                <div
                  key={option.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(option.id, node);
                    else rowRefs.current.delete(option.id);
                  }}
                  className={cn(
                    "grid grid-cols-[24px_minmax(52px,1fr)_minmax(88px,1fr)_32px_26px] items-center gap-1 rounded-brand-md border border-hairline bg-surface-card p-1.5 transition-[opacity,transform,border-color]",
                    draggingId === option.id && "scale-[1.01] border-primary/60 opacity-75"
                  )}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={`Reorder ${option.label}. Use arrow keys or drag.`}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      draggingIdRef.current = option.id;
                      setDraggingId(option.id);
                    }}
                    onPointerMove={(event) => reorderTowardPointer(event.clientY)}
                    onPointerUp={stopDragging}
                    onPointerCancel={stopDragging}
                    onKeyDown={(event) => {
                      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                      event.preventDefault();
                      const to = event.key === "ArrowUp" ? index - 1 : index + 1;
                      if (to < 0 || to >= sizeOptions.length) return;
                      onSizeOptionsChange(moveOption(sizeOptions, index, to));
                    }}
                    className="flex h-9 touch-none items-center justify-center rounded-brand-sm text-muted hover:bg-surface-strong hover:text-ink"
                  >
                    <GripVertical size={16} aria-hidden />
                  </button>

                  <div className="relative min-w-0">
                    <span
                      aria-hidden
                      className="absolute left-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-primary/60 font-body text-[10px] font-medium text-primary"
                    >
                      {option.label.trim().charAt(0).toUpperCase() || "•"}
                    </span>
                    <input
                      id={`${idPrefix}-size-${option.id}-label`}
                      value={option.label}
                      maxLength={30}
                      disabled={disabled}
                      aria-label={`Size ${index + 1} name`}
                      onChange={(event) => updateOption(option.id, { label: event.target.value })}
                      className={cn(inputClass, "w-full pl-8 pr-1.5")}
                    />
                  </div>

                  <div className="relative min-w-0">
                    <span className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 font-body text-[9px] font-medium text-muted">
                      RWF
                    </span>
                    <input
                      value={option.priceRwf}
                      inputMode="numeric"
                      disabled={disabled}
                      aria-label={`${option.label || `Size ${index + 1}`} price in RWF`}
                      onChange={(event) =>
                        updateOption(option.id, { priceRwf: event.target.value.replace(/[^0-9,]/g, "") })
                      }
                      onBlur={() => updateOption(option.id, { priceRwf: displayPrice(option.priceRwf) })}
                      className={cn(inputClass, "w-full pl-9 pr-1.5 text-right font-mono")}
                    />
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={option.isAvailable}
                    aria-label={`${option.isAvailable ? "Hide" : "Show"} ${option.label} on the storefront`}
                    disabled={disabled || !canDisable}
                    title={!canDisable ? "Keep at least one size visible" : undefined}
                    onClick={() => updateOption(option.id, { isAvailable: !option.isAvailable })}
                    className={cn(
                      "relative h-5 w-9 rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      option.isAvailable ? "bg-primary" : "bg-muted-soft"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                        option.isAvailable ? "left-[18px]" : "left-0.5"
                      )}
                    />
                  </button>

                  <button
                    type="button"
                    disabled={disabled || !canDelete}
                    aria-label={`Delete ${option.label}`}
                    title={
                      sizeOptions.length <= MIN_MENU_ITEM_SIZE_OPTIONS
                        ? `Keep at least ${MIN_MENU_ITEM_SIZE_OPTIONS} sizes`
                        : !canDelete
                          ? "Keep at least one size visible"
                          : undefined
                    }
                    onClick={() => onSizeOptionsChange(sizeOptions.filter((row) => row.id !== option.id))}
                    className="flex h-9 items-center justify-center rounded-brand-sm text-muted transition-colors hover:bg-error/10 hover:text-error disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={disabled || sizeOptions.length >= MAX_MENU_ITEM_SIZE_OPTIONS}
            onClick={() => onSizeOptionsChange([...sizeOptions, customDraft(sizeOptions, singlePriceRwf)])}
            className="mt-2 flex min-h-10 items-center gap-2 rounded-brand-md border border-dashed border-primary/60 px-3 font-body text-body-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={15} aria-hidden />
            Add custom size
          </button>

          <div className="mt-3 flex items-start gap-2.5 rounded-brand-md border border-primary/35 bg-primary/10 px-3 py-2.5">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles size={13} aria-hidden />
            </span>
            <p className="font-body text-caption leading-relaxed text-ink">
              <span className="font-medium">Customers will see these size options on the storefront.</span>{" "}
              You can reorder, rename, or hide sizes as needed.
            </p>
          </div>
        </>
      ) : (
        <div className="mt-3">
          <label htmlFor={`${idPrefix}-single-price`} className="font-body text-body-sm font-medium text-ink">
            Price (RWF)
          </label>
          <input
            id={`${idPrefix}-single-price`}
            inputMode="numeric"
            value={singlePriceRwf}
            disabled={disabled}
            onChange={(event) => onSinglePriceChange(event.target.value.replace(/[^0-9,]/g, ""))}
            onBlur={() => onSinglePriceChange(displayPrice(singlePriceRwf))}
            placeholder="5,000"
            className={cn(inputClass, "mt-1.5 w-full px-4")}
          />
        </div>
      )}
    </section>
  );
}
