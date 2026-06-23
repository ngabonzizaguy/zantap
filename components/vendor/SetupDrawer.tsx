"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  countCompletedSteps,
  ONBOARDING_STEPS,
  type OnboardingChecklist,
} from "@/lib/vendor/onboarding";
import { useWriteSecret } from "@/lib/vendor/useWriteSecret";
import { resetCoachmarks } from "@/components/vendor/Coachmark";

interface SetupDrawerProps {
  open: boolean;
  onClose: () => void;
  checklist: OnboardingChecklist;
  onRefresh?: () => void;
}

export function SetupDrawer({
  open,
  onClose,
  checklist,
  onRefresh,
}: SetupDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const { secret, setSecret, hasSecret, ready } = useWriteSecret();
  const [secretDraft, setSecretDraft] = useState("");
  const [secretSaved, setSecretSaved] = useState(false);
  const [tipsReset, setTipsReset] = useState(false);

  const completed = countCompletedSteps(checklist);
  const total = ONBOARDING_STEPS.length;

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    onRefresh?.();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open, onClose, onRefresh]);

  useEffect(() => {
    if (open && ready) {
      setSecretDraft(secret ?? "");
    }
  }, [open, ready, secret]);

  const handleSaveSecret = () => {
    const trimmed = secretDraft.trim();
    if (!trimmed) return;
    setSecret(trimmed);
    setSecretSaved(true);
    window.setTimeout(() => setSecretSaved(false), 2000);
  };

  const handleShowTipsAgain = () => {
    resetCoachmarks();
    setTipsReset(true);
    window.setTimeout(() => setTipsReset(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close setup guide"
        className="absolute inset-0 bg-canvas-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface-card shadow-brand-soft"
        )}
      >
        <header className="border-b border-hairline px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={titleId}
                className="font-display text-display-md text-ink"
              >
                Setup guide
              </h2>
              <p className="mt-1 font-body text-body-sm text-muted">
                {completed} of {total} steps complete — progress updates from
                your live data.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-hairline text-lg font-bold text-ink hover:bg-canvas-soft"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-pill bg-canvas-soft">
            <div
              className="h-full rounded-pill bg-primary transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ol className="flex flex-col gap-3">
            {ONBOARDING_STEPS.map((step, index) => {
              const done = checklist[step.id];
              return (
                <li key={step.id}>
                  <Card
                    padding="sm"
                    className={cn(
                      done && "border-primary/30 bg-canvas-soft/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold",
                          done
                            ? "bg-primary text-on-primary"
                            : "border border-hairline bg-surface-card text-muted"
                        )}
                        aria-hidden
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div>
                        <p
                          className={cn(
                            "font-body text-body-md font-medium",
                            done ? "text-muted line-through" : "text-ink"
                          )}
                        >
                          {step.label}
                        </p>
                        {!done ? (
                          <p className="mt-1 font-body text-body-sm text-muted">
                            {step.hint}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Write secret
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Required for menu edits and exports. Stored on this device only.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label="Write secret"
                type="password"
                autoComplete="off"
                value={secretDraft}
                onChange={(event) => setSecretDraft(event.target.value)}
              />
              <Button
                size="default"
                onClick={handleSaveSecret}
                disabled={!secretDraft.trim()}
              >
                {hasSecret ? "Update secret" : "Save secret"}
              </Button>
              {secretSaved ? (
                <p className="font-body text-body-sm text-primary">
                  Secret saved on this device.
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">Tips</h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Coachmarks appear once on key controls. Use the button below to
              show them again.
            </p>
            <Button
              size="default"
              variant="outline"
              className="mt-4 w-full"
              onClick={handleShowTipsAgain}
            >
              Show tips again
            </Button>
            {tipsReset ? (
              <p className="mt-2 font-body text-body-sm text-primary">
                Tips will reappear on the relevant tabs.
              </p>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
