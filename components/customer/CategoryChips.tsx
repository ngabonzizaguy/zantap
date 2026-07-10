"use client";

import { cn } from "@/lib/cn";

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

// Transition only compositor-friendly properties — `transition-all` also
// animates layout properties and stutters on mobile. The active:scale gives
// taps immediate tactile feedback while the category content loads in.
const chipBase =
  "h-10 flex-none px-[18px] font-body text-body-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:scale-[0.96]";

export function CategoryChips({
  categories,
  active,
  onSelect,
}: CategoryChipsProps) {
  return (
    // py/-my keep layout height while letting the active chip's glow paint
    // inside the scroll container's clip region instead of being cut off
    <div className="zt-hidescroll -mx-5 -my-3 flex gap-2 overflow-x-auto px-5 py-3">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            className={cn(
              chipBase,
              isActive
                ? "glass-gold-pill"
                : "glass-liquid-pill text-muted hover:text-ink"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
