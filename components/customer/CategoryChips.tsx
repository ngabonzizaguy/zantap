"use client";

import { cn } from "@/lib/cn";

interface CategoryChipsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

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
              "h-10 flex-none rounded-full px-[18px] text-[14px] font-semibold tracking-[0.1px] transition-all duration-200",
              isActive
                ? "bg-zt-brown text-white shadow-[0_6px_16px_rgba(58,44,38,0.28)]"
                : "glass-pill text-zt-brown-muted hover:text-zt-brown"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
