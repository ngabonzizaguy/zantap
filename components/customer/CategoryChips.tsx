"use client";

import { cn } from "@/lib/cn";

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

const chipBase =
  "h-10 flex-none rounded-pill px-[18px] font-body text-body-sm font-medium transition-colors duration-200";

export function CategoryChips({
  categories,
  active,
  onSelect,
}: CategoryChipsProps) {
  return (
    <div className="zt-hidescroll -mx-5 flex gap-2 overflow-x-auto px-5">
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
                ? "border border-primary bg-primary text-on-primary shadow-brand-soft"
                : "border border-hairline bg-surface-card/90 text-muted shadow-brand-soft hover:text-ink"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
