"use client";

import type { KitchenStage } from "@/lib/types";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";

interface BulkActionBarProps {
  selectedCount: number;
  busy: boolean;
  canAssignDriver?: boolean;
  onClear: () => void;
  onBulkAdvance: (stage: KitchenStage) => void;
  onBulkAssign?: () => void;
}

const BULK_ACTIONS: { stage: KitchenStage; label: string }[] = [
  { stage: "PREPARING", label: "Mark Preparing" },
  { stage: "READY", label: "Mark Ready" },
  { stage: "COMPLETED", label: "Mark Completed" },
];

export function BulkActionBar({
  selectedCount,
  busy,
  canAssignDriver = false,
  onClear,
  onBulkAdvance,
  onBulkAssign,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="zt-bar-enter fixed bottom-0 left-1/2 z-50 w-full max-w-kds -translate-x-1/2 border-t border-hairline bg-canvas/95 px-[18px] py-3.5 shadow-brand-soft backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-hairline bg-surface-card transition-colors hover:bg-canvas-soft disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Clear selection"
        >
          <Icon name="close" size={18} className="text-muted" strokeWidth={2.2} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-body text-body-md font-semibold text-ink">
            {selectedCount} selected
          </div>
          <div className="font-body text-caption text-muted">
            Bulk advance kitchen stage
            {canAssignDriver ? " or assign a driver" : ""}
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
        {canAssignDriver && onBulkAssign ? (
          <Button
            type="button"
            variant="primary"
            size="kds"
            disabled={busy}
            onClick={onBulkAssign}
            className="flex-none rounded-pill px-4 font-body text-caption-uppercase uppercase tracking-wide"
          >
            Assign driver
          </Button>
        ) : null}
        {BULK_ACTIONS.map(({ stage, label }) => (
          <Button
            key={stage}
            type="button"
            variant="outline"
            size="kds"
            disabled={busy}
            onClick={() => onBulkAdvance(stage)}
            className="flex-none rounded-pill px-4 font-body text-caption-uppercase uppercase tracking-wide"
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
