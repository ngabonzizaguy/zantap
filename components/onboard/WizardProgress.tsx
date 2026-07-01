"use client";

import { cn } from "@/lib/cn";

interface WizardProgressProps {
  /** 1-based index of the current step within the counted flow. */
  current: number;
  total?: number;
  onBack?: () => void;
}

/**
 * Shared step header for the onboarding wizard: a back affordance plus the
 * segmented progress bar seen across the mockups ("Step N of 6"). The splash
 * and "You're Live" screens do not render this.
 */
export function WizardProgress({
  current,
  total = 6,
  onBack,
}: WizardProgressProps) {
  return (
    <div className="mb-8 flex items-center gap-4">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : (
        <span className="h-9 w-9 flex-none" aria-hidden="true" />
      )}

      <div className="flex-1">
        <p className="mb-2 font-body text-caption font-medium text-muted">
          <span className="text-ink">Step {current}</span> of {total}
        </p>
        <div className="flex gap-1.5" role="presentation">
          {Array.from({ length: total }, (_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-pill transition-colors",
                index < current ? "bg-primary" : "bg-surface-strong"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
