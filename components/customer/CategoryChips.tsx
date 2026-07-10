"use client";

import { cn } from "@/lib/cn";

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

const chipBase =
  "h-10 flex-none px-[18px] font-body text-body-sm font-medium transition-all duration-200";

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
