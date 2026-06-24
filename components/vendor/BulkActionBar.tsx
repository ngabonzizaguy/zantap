"use client";

import type { KitchenStage } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

interface BulkActionBarProps {
  selectedCount: number;
  busy: boolean;
  onClear: () => void;
  onBulkAdvance: (stage: KitchenStage) => void;
}

const BULK_ACTIONS: { stage: KitchenStage; label: string }[] = [
  { stage: "PREPARING", label: "Mark Preparing" },
  { stage: "READY", label: "Mark Ready" },
  { stage: "COMPLETED", label: "Mark Completed" },
];

export function BulkActionBar({
  selectedCount,
  busy,
  onClear,
  onBulkAdvance,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-1/2 z-50 w-full max-w-kds -translate-x-1/2 border-t-[1.5px] border-zk-borderDark bg-[#14100c]/95 px-[18px] py-3.5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border-[1.5px] border-zk-border bg-zk-surface"
          aria-label="Clear selection"
        >
          <Icon name="close" size={18} className="text-zk-sub" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-zk-text">
            {selectedCount} selected
          </div>
          <div className="text-xs font-semibold text-zk-muted">
            Bulk advance kitchen stage
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
        {BULK_ACTIONS.map(({ stage, label }) => (
          <button
            key={stage}
            type="button"
            disabled={busy}
            onClick={() => onBulkAdvance(stage)}
            className={cn(
              "flex h-11 flex-none items-center rounded-full border-[1.5px] border-momo/45 bg-momo/15 px-4 text-[13px] font-extrabold tracking-wide text-momo",
              busy && "opacity-60"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
