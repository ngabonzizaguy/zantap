"use client";

import { formatRwf, orderDisplayId } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface OpenApiAwaitSheetProps {
  open: boolean;
  amount: number;
  vendorName: string;
  orderId: string;
  error: string | null;
  onCancel: () => void;
}

/**
 * Open API Collection awaiting UI — Customer approves the MoMo prompt on phone;
 * storefront polls Payment status until webhook marks SUCCESS/FAILED.
 */
export function OpenApiAwaitSheet({
  open,
  amount,
  vendorName,
  orderId,
  error,
  onCancel,
}: OpenApiAwaitSheetProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-canvas-deep/40 backdrop-blur-sm transition-[opacity,visibility] duration-300",
        open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "glass-liquid-sheet w-full max-w-customer rounded-t-brand-xxl border border-hairline border-b-0 px-5 pb-8 pt-6 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
          open ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-hairline-strong" />

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-brand-lg bg-gradient-to-br from-gold to-momo">
            <Icon name="momo" size={22} className="text-momo-dark" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-display-sm leading-tight text-ink">
              Approve on your phone
            </h2>
            <p className="font-body text-caption text-muted">
              {formatRwf(amount)} to {vendorName}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
          <p className="font-body text-caption-uppercase text-muted">
            Waiting for MoMo
          </p>
          <p className="mt-1 font-body text-body-sm font-medium text-ink">
            {orderDisplayId(orderId)}
          </p>
          <p className="mt-2 font-body text-body-sm leading-relaxed text-muted">
            Waiting for MoMo to confirm payment. On a real phone you approve a
            prompt; in sandbox this often finishes by itself.
          </p>
          <div
            className="mt-3 flex items-center gap-2 font-body text-caption text-muted"
            aria-live="polite"
          >
            <span
              className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-hairline-strong border-t-ink"
              aria-hidden
            />
            Waiting for approval…
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-brand-lg bg-error/10 px-3 py-2 font-body text-body-sm font-medium text-error">
            {error}
          </p>
        ) : null}

        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            radius="lg"
            className="h-12 w-full text-body-sm"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
