"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Listed for context but not choosable. */
  disabled?: boolean;
  /** Short badge explaining a listed option, e.g. "Soon". */
  note?: string;
}

interface SelectProps<T extends string = string> {
  label?: string;
  id?: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  variant?: "field" | "pill";
  align?: "start" | "end";
  ariaLabel?: string;
  prefix?: ReactNode;
  /** Shorter trigger text when the full option label would crowd the control. */
  triggerLabel?: string;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0 text-muted transition-transform", open && "rotate-180")}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function Select<T extends string = string>({
  label,
  id,
  value,
  onChange,
  options,
  disabled = false,
  className,
  triggerClassName,
  panelClassName,
  variant = "field",
  align = "start",
  ariaLabel,
  prefix,
  triggerLabel,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);
  const listboxId = `${selectId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? value;

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const choosableIndex = useCallback(
    (from: number, step: number) => {
      for (let index = from; index >= 0 && index < options.length; index += step) {
        if (!options[index].disabled) return index;
      }
      return -1;
    },
    [options]
  );

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(
      selectedIndex >= 0 && !options[selectedIndex].disabled
        ? selectedIndex
        : choosableIndex(0, 1)
    );
  }, [choosableIndex, disabled, options, selectedIndex]);

  const selectOption = useCallback(
    (index: number) => {
      const option = options[index];
      if (!option || option.disabled) return;
      onChange(option.value);
      close();
    },
    [close, onChange, options]
  );

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const index = activeIndex >= 0 ? activeIndex : selectedIndex;
    optionRefs.current[index]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, selectedIndex]);

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp":
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) {
          openList();
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      default:
        break;
    }
  };

  const handleListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = choosableIndex(prev < 0 ? 0 : prev + 1, 1);
          return next >= 0 ? next : prev;
        });
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((prev) => {
          const next = choosableIndex(prev < 0 ? options.length - 1 : prev - 1, -1);
          return next >= 0 ? next : prev;
        });
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(choosableIndex(0, 1));
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(choosableIndex(options.length - 1, -1));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (activeIndex >= 0) {
          selectOption(activeIndex);
        }
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
      default:
        break;
    }
  };

  const trigger = (
    <button
      type="button"
      id={selectId}
      disabled={disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-label={ariaLabel ?? (label ? undefined : selectedLabel)}
      onClick={() => (open ? close() : openList())}
      onKeyDown={handleTriggerKeyDown}
      className={cn(
        variant === "pill"
          ? "flex items-center gap-1.5 rounded-pill border border-hairline-strong px-3.5 py-2 font-body text-body-sm font-medium text-ink"
          : "flex h-11 min-h-11 w-full items-center justify-between gap-2 rounded-brand-md border border-hairline-strong bg-surface-card px-3 font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none",
        disabled && "cursor-not-allowed bg-canvas-soft text-muted-soft",
        triggerClassName
      )}
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        {prefix}
        <span className="truncate">{triggerLabel ?? selectedLabel}</span>
      </span>
      <Chevron open={open} />
    </button>
  );

  const listbox = open ? (
    <div
      id={listboxId}
      role="listbox"
      aria-labelledby={selectId}
      tabIndex={-1}
      onKeyDown={handleListKeyDown}
      className={cn(
        "absolute z-20 mt-1.5 max-h-60 overflow-y-auto rounded-brand-lg border border-hairline bg-surface-card shadow-kds",
        variant === "pill" ? "min-w-full w-max" : "w-full",
        align === "end" ? "right-0" : "left-0",
        panelClassName
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const active = index === activeIndex;
        return (
          <button
            key={option.value}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled}
            tabIndex={-1}
            onMouseEnter={() => {
              if (!option.disabled) setActiveIndex(index);
            }}
            onClick={() => selectOption(index)}
            className={cn(
              "flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left font-body text-body-sm transition-colors",
              option.disabled
                ? "cursor-not-allowed text-muted-soft"
                : cn(
                    active || selected ? "bg-surface-strong" : "hover:bg-surface-strong",
                    selected ? "text-primary" : "text-ink"
                  )
            )}
          >
            {option.label}
            {option.note ? (
              <span className="rounded-pill border border-hairline px-2 py-0.5 font-body text-caption-uppercase text-muted">
                {option.note}
              </span>
            ) : selected ? (
              <Icon name="check" size={14} className="text-primary" strokeWidth={2.6} />
            ) : (
              <span className="w-3.5" aria-hidden />
            )}
          </button>
        );
      })}
    </div>
  ) : null;

  const control = (
    <div ref={containerRef} className={cn("relative", className)}>
      {trigger}
      {listbox}
    </div>
  );

  if (!label) {
    return control;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="font-body text-body-sm font-medium text-ink">
        {label}
      </label>
      {control}
    </div>
  );
}
