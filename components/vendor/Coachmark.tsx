"use client";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export const COACHMARK_IDS = [
  "menu-add",
  "kitchen-toggle",
  "dispatch-button",
] as const;

export type CoachmarkId = (typeof COACHMARK_IDS)[number];

export function coachmarkStorageKey(id: string): string {
  return `zantap:kds-coachmark-${id}`;
}

export function isCoachmarkDismissed(id: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(coachmarkStorageKey(id)) === "1";
  } catch {
    return true;
  }
}

export function dismissCoachmark(id: string): void {
  try {
    localStorage.setItem(coachmarkStorageKey(id), "1");
  } catch {
    // ignore quota / private-mode failures
  }
}

export function resetCoachmarks(ids: readonly string[] = COACHMARK_IDS): void {
  try {
    for (const id of ids) {
      localStorage.removeItem(coachmarkStorageKey(id));
    }
    window.dispatchEvent(new CustomEvent("zantap:coachmarks-reset"));
  } catch {
    // ignore
  }
}

interface CoachmarkProps {
  id: CoachmarkId;
  targetSelector: string;
  title: string;
  body: string;
  enabled?: boolean;
  placement?: "top" | "bottom";
}

interface Position {
  top: number;
  left: number;
  width: number;
}

export function Coachmark({
  id,
  targetSelector,
  title,
  body,
  enabled = true,
  placement = "bottom",
}: CoachmarkProps) {
  const t = useKdsTranslation();
  const [dismissed, setDismissed] = useState(true);
  const [position, setPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // localStorage dismissal state is client-only; reading during render would
    // break SSR hydration.
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setMounted(true);
    setDismissed(isCoachmarkDismissed(id));

    const handleReset = () => setDismissed(isCoachmarkDismissed(id));
    window.addEventListener("zantap:coachmarks-reset", handleReset);
    return () => window.removeEventListener("zantap:coachmarks-reset", handleReset);
  }, [id]);

  const measure = useCallback(() => {
    if (!enabled || dismissed) {
      setPosition(null);
      return;
    }

    const target = document.querySelector<HTMLElement>(targetSelector);
    if (!target) {
      setPosition(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      setPosition(null);
      return;
    }

    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  }, [dismissed, enabled, targetSelector]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- measures live DOM geometry (external system); cannot run during render
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const interval = window.setInterval(measure, 400);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      window.clearInterval(interval);
    };
  }, [measure]);

  const handleDismiss = () => {
    dismissCoachmark(id);
    setDismissed(true);
    setPosition(null);
  };

  if (!mounted || dismissed || !enabled || !position) {
    return null;
  }

  const tooltipTop =
    placement === "bottom" ? position.top + 72 : position.top - 12;

  return createPortal(
    <>
      <div
        className="pointer-events-none fixed inset-0 z-[60]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute z-[61]"
        style={{
          top: tooltipTop,
          left: Math.max(12, position.left + position.width / 2 - 160),
          width: 320,
        }}
      >
        <div
          role="dialog"
          aria-labelledby={`coachmark-${id}-title`}
          className={cn(
            "pointer-events-auto rounded-brand-lg border border-hairline bg-surface-card p-4 shadow-brand-soft",
            placement === "top" && "-translate-y-full"
          )}
        >
          <p
            id={`coachmark-${id}-title`}
            className="font-display text-display-sm text-ink"
          >
            {title}
          </p>
          <p className="mt-2 font-body text-body-sm text-muted">{body}</p>
          <div className="mt-4">
            <Button size="default" className="w-full" onClick={handleDismiss}>{t("kds.coachmark.got-it")}</Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
