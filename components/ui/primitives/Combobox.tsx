"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";

interface ComboboxProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: readonly string[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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

export function Combobox({
  label,
  id,
  value,
  onChange,
  suggestions,
  disabled = false,
  placeholder,
  className,
}: ComboboxProps) {
  const generatedId = useId();
  const comboboxId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);
  const listboxId = `${comboboxId}-listbox`;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredSuggestions = useMemo(() => {
    const unique = [...new Set(suggestions.map((s) => s.trim()).filter(Boolean))];
    const needle = value.trim().toLowerCase();
    const matched = needle
      ? unique.filter((suggestion) => suggestion.toLowerCase().includes(needle))
      : unique;
    return matched.sort((a, b) => a.localeCompare(b));
  }, [suggestions, value]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(filteredSuggestions.length > 0 ? 0 : -1);
  }, [disabled, filteredSuggestions.length]);

  const pickSuggestion = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      close();
      inputRef.current?.focus();
    },
    [close, onChange]
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
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          setActiveIndex((prev) =>
            prev < 0 ? 0 : Math.min(prev + 1, filteredSuggestions.length - 1)
          );
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          setActiveIndex((prev) =>
            prev < 0 ? filteredSuggestions.length - 1 : Math.max(prev - 1, 0)
          );
        }
        break;
      case "Home":
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          event.preventDefault();
          setActiveIndex(filteredSuggestions.length - 1);
        }
        break;
      case "Enter":
        if (open && activeIndex >= 0 && filteredSuggestions[activeIndex]) {
          event.preventDefault();
          pickSuggestion(filteredSuggestions[activeIndex]!);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case "Tab":
        close();
        break;
      default:
        if (!open) {
          setOpen(true);
        }
        break;
    }
  };

  const listbox =
    open && filteredSuggestions.length > 0 ? (
      <div
        id={listboxId}
        role="listbox"
        aria-labelledby={label ? comboboxId : undefined}
        className="absolute z-20 mt-1.5 max-h-60 w-full overflow-y-auto rounded-brand-lg border border-hairline bg-surface-card shadow-kds"
      >
        {filteredSuggestions.map((suggestion, index) => {
          const selected = suggestion === value;
          const active = index === activeIndex;
          return (
            <button
              key={suggestion}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="option"
              aria-selected={selected}
              tabIndex={-1}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pickSuggestion(suggestion)}
              className={cn(
                "flex w-full items-center px-3.5 py-2.5 text-left font-body text-body-sm transition-colors",
                active || selected ? "bg-surface-strong" : "hover:bg-surface-strong",
                selected ? "text-primary" : "text-ink"
              )}
            >
              {suggestion}
            </button>
          );
        })}
      </div>
    ) : null;

  const control = (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex h-11 min-h-11 w-full items-stretch overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card focus-within:border-2 focus-within:border-ink",
          disabled && "cursor-not-allowed bg-canvas-soft"
        )}
      >
        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onFocus={openList}
          onKeyDown={handleInputKeyDown}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:outline-none",
            disabled && "cursor-not-allowed text-muted-soft"
          )}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          aria-label="Show category suggestions"
          onClick={() => (open ? close() : openList())}
          className="flex items-center px-3 text-muted disabled:cursor-not-allowed"
        >
          <Chevron open={open} />
        </button>
      </div>
      {listbox}
    </div>
  );

  if (!label) {
    return control;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={comboboxId} className="font-body text-body-sm font-medium text-ink">
        {label}
      </label>
      {control}
    </div>
  );
}
