"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Info,
  MoreHorizontal,
  Plus,
  RotateCcw,
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
  const [expandedId, setExpandedId] = useState<string | null>(() =>
    useSizes
      ? sizeOptions.find((option) => !option.isAvailable)?.id ??
        sizeOptions[0]?.id ??
        null
      : null
  );
  const [actionsId, setActionsId] = useState<string | null>(null);

  const activeExpandedId =
    expandedId && sizeOptions.some((option) => option.id === expandedId)
      ? expandedId
      : null;

  const setMode = (nextUseSizes: boolean) => {
    if (nextUseSizes && sizeOptions.length === 0) {
      const defaults = defaultDrafts(singlePriceRwf);
      onSizeOptionsChange(defaults);
      setExpandedId(defaults[0]?.id ?? null);
    } else if (!nextUseSizes) {
      setExpandedId(null);
      setActionsId(null);
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

  const deleteOption = (option: SizeOptionDraft) => {
    onSizeOptionsChange(sizeOptions.filter((row) => row.id !== option.id));
    if (activeExpandedId === option.id) setExpandedId(null);
    if (actionsId === option.id) setActionsId(null);
  };

  const resetOptions = () => {
    const defaults = defaultDrafts(singlePriceRwf, sizeOptions);
    onSizeOptionsChange(defaults);
    setExpandedId(defaults[0]?.id ?? null);
    setActionsId(null);
  };

  const addCustomOption = () => {
    const nextOption = customDraft(sizeOptions, singlePriceRwf);
    onSizeOptionsChange([...sizeOptions, nextOption]);
    setExpandedId(nextOption.id);
    setActionsId(null);
  };

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

      <div className="mt-3 grid grid-cols-2 overflow-hidden rounded-brand-md border border-hairline-strong bg-canvas-soft">
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
                "h-11 border-r border-hairline-strong font-body text-body-sm font-medium transition-[color,background-color,box-shadow] last:border-r-0",
                active
                  ? "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_currentColor]"
                  : "text-muted hover:bg-surface-strong hover:text-ink"
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
              onClick={resetOptions}
              className="flex min-h-11 items-center gap-1.5 rounded-pill px-2 font-body text-caption text-muted transition-colors hover:text-ink disabled:opacity-50"
            >
              Reset to default
              <RotateCcw size={14} strokeWidth={1.8} aria-hidden />
            </button>
          </div>

          <p className="font-body text-caption text-muted">
            Drag to reorder. Tap a size to edit.
          </p>

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
                    "relative overflow-visible rounded-brand-md border border-hairline bg-surface-card transition-[opacity,transform,border-color]",
                    draggingId === option.id && "scale-[1.01] border-primary/60 opacity-75"
                  )}
                >
                  <div className="grid min-h-14 grid-cols-[36px_minmax(0,1fr)_36px_36px_36px] items-center sm:grid-cols-[44px_minmax(0,1fr)_44px_44px_44px]">
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
                      className="flex h-11 touch-none items-center justify-center rounded-brand-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink"
                    >
                      <GripVertical size={18} strokeWidth={1.8} aria-hidden />
                    </button>

                    <button
                      type="button"
                      disabled={disabled}
                      aria-expanded={activeExpandedId === option.id}
                      aria-controls={`${idPrefix}-size-${option.id}-details`}
                      onClick={() => {
                        setExpandedId(activeExpandedId === option.id ? null : option.id);
                        setActionsId(null);
                      }}
                      className="grid min-h-11 min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-left"
                    >
                      <span className="truncate font-body text-body-sm font-medium text-ink">
                        {option.label || `Size ${index + 1}`}
                      </span>
                      <span className="whitespace-nowrap font-mono text-caption font-semibold text-ink">
                        {displayPrice(option.priceRwf) || "—"} RWF
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={disabled || !canDisable}
                      aria-label={`${option.isAvailable ? "Hide" : "Show"} ${option.label} on the storefront`}
                      title={!canDisable ? "Keep at least one size visible" : undefined}
                      onClick={() => updateOption(option.id, { isAvailable: !option.isAvailable })}
                      className={cn(
                        "flex h-11 w-9 items-center justify-center rounded-brand-sm transition-colors hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-40 sm:w-11",
                        option.isAvailable ? "text-success" : "text-muted"
                      )}
                    >
                      {option.isAvailable ? (
                        <Eye size={19} strokeWidth={1.8} aria-hidden />
                      ) : (
                        <EyeOff size={19} strokeWidth={1.8} aria-hidden />
                      )}
                    </button>

                    <div
                      className="relative"
                      onBlur={(event) => {
                        if (!event.currentTarget.contains(event.relatedTarget)) {
                          setActionsId(null);
                        }
                      }}
                    >
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label={`More actions for ${option.label}`}
                        aria-haspopup="menu"
                        aria-expanded={actionsId === option.id}
                        onClick={() => setActionsId(actionsId === option.id ? null : option.id)}
                        className="flex h-11 w-9 items-center justify-center rounded-brand-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink sm:w-11"
                      >
                        <MoreHorizontal size={20} strokeWidth={1.8} aria-hidden />
                      </button>

                      {actionsId === option.id ? (
                        <div
                          role="menu"
                          className="absolute right-0 top-11 z-30 w-52 overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card p-1 shadow-kds"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            disabled={!canDisable}
                            onClick={() => {
                              updateOption(option.id, { isAvailable: !option.isAvailable });
                              setActionsId(null);
                            }}
                            className="flex min-h-11 w-full items-center gap-3 rounded-brand-sm px-3 text-left font-body text-body-sm text-ink transition-colors hover:bg-surface-strong disabled:opacity-40"
                          >
                            {option.isAvailable ? (
                              <EyeOff size={18} strokeWidth={1.8} aria-hidden />
                            ) : (
                              <Eye size={18} strokeWidth={1.8} aria-hidden />
                            )}
                            {option.isAvailable ? "Hide on storefront" : "Show on storefront"}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            disabled={!canDelete}
                            onClick={() => deleteOption(option)}
                            className="flex min-h-11 w-full items-center gap-3 rounded-brand-sm px-3 text-left font-body text-body-sm text-error transition-colors hover:bg-error/10 disabled:opacity-40"
                          >
                            <Trash2 size={18} strokeWidth={1.8} aria-hidden />
                            Delete size
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`${activeExpandedId === option.id ? "Collapse" : "Edit"} ${option.label}`}
                      aria-expanded={activeExpandedId === option.id}
                      aria-controls={`${idPrefix}-size-${option.id}-details`}
                      onClick={() => {
                        setExpandedId(activeExpandedId === option.id ? null : option.id);
                        setActionsId(null);
                      }}
                      className="flex h-11 w-9 items-center justify-center rounded-brand-sm text-muted transition-colors hover:bg-surface-strong hover:text-ink sm:w-11"
                    >
                      <ChevronDown
                        size={18}
                        strokeWidth={1.8}
                        className={cn(
                          "transition-transform duration-200",
                          activeExpandedId === option.id && "rotate-180"
                        )}
                        aria-hidden
                      />
                    </button>
                  </div>

                  {activeExpandedId === option.id ? (
                    <div
                      id={`${idPrefix}-size-${option.id}-details`}
                      className="border-t border-hairline bg-canvas-soft px-3 pb-3 pt-3"
                    >
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <label className="min-w-0 font-body text-caption text-muted">
                          Size name
                          <input
                            id={`${idPrefix}-size-${option.id}-label`}
                            value={option.label}
                            maxLength={30}
                            disabled={disabled}
                            aria-label={`Size ${index + 1} name`}
                            onChange={(event) => updateOption(option.id, { label: event.target.value })}
                            className={cn(inputClass, "mt-1.5 w-full px-3 text-ink")}
                          />
                        </label>

                        <label className="min-w-0 font-body text-caption text-muted">
                          Price (RWF)
                          <input
                            value={option.priceRwf}
                            inputMode="numeric"
                            disabled={disabled}
                            aria-label={`${option.label || `Size ${index + 1}`} price in RWF`}
                            onChange={(event) =>
                              updateOption(option.id, { priceRwf: event.target.value.replace(/[^0-9,]/g, "") })
                            }
                            onBlur={() => updateOption(option.id, { priceRwf: displayPrice(option.priceRwf) })}
                            className={cn(inputClass, "mt-1.5 w-full px-3 text-right font-mono text-ink")}
                          />
                        </label>
                      </div>

                      <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
                        <span className="font-body text-body-sm text-ink">Show on storefront</span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={option.isAvailable}
                          aria-label={`${option.isAvailable ? "Hide" : "Show"} ${option.label} on the storefront`}
                          disabled={disabled || !canDisable}
                          title={!canDisable ? "Keep at least one size visible" : undefined}
                          onClick={() => updateOption(option.id, { isAvailable: !option.isAvailable })}
                          className={cn(
                            "relative h-6 w-11 flex-none rounded-pill transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            option.isAvailable ? "bg-primary" : "bg-muted-soft"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all",
                              option.isAvailable ? "left-5" : "left-0.5"
                            )}
                          />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={disabled || !canDelete}
                        title={
                          sizeOptions.length <= MIN_MENU_ITEM_SIZE_OPTIONS
                            ? `Keep at least ${MIN_MENU_ITEM_SIZE_OPTIONS} sizes`
                            : !canDelete
                              ? "Keep at least one size visible"
                              : undefined
                        }
                        onClick={() => deleteOption(option)}
                        className="mt-2 flex min-h-11 items-center gap-2 rounded-brand-sm font-body text-body-sm font-medium text-error transition-colors hover:bg-error/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={18} strokeWidth={1.8} aria-hidden />
                        Delete size
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={disabled || sizeOptions.length >= MAX_MENU_ITEM_SIZE_OPTIONS}
            onClick={addCustomOption}
            className="mt-3 flex min-h-11 items-center gap-2 rounded-brand-md border border-dashed border-primary/60 px-3 font-body text-body-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={17} strokeWidth={1.8} aria-hidden />
            Add custom size
          </button>

          <p className="mt-3 flex items-center gap-1.5 font-body text-caption text-muted">
            <Info size={14} strokeWidth={1.8} aria-hidden />
            Customers see enabled sizes on the storefront.
          </p>
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
