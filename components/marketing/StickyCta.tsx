"use client";

import { useEffect, useState } from "react";
import { STICKY_CTA as STICKY_CTA_EN } from "@/lib/marketing/copy";

/**
 * Conversion guard (ADR-0047 decision 2): on mobile the lead form (or this
 * jump-to-form pill) is reachable within one viewport at all times. The pill
 * hides when the form itself, the offer CTA, the footer — or the hero (whose
 * masthead already carries a Get setup button) — is on screen.
 */
export function StickyCta({ label }: { label?: string } = {}) {
  const STICKY_CTA = label ?? STICKY_CTA_EN;
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const targets = [
      document.getElementById("top"),
      document.getElementById("lead-form"),
      document.getElementById("offer"),
      document.getElementById("footer"),
    ].filter(Boolean) as HTMLElement[];

    if (!targets.length) return;

    const visibleSet = new Set<HTMLElement>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleSet.add(entry.target as HTMLElement);
          else visibleSet.delete(entry.target as HTMLElement);
        }
        setHidden(visibleSet.size > 0);
      },
      { threshold: 0.15 },
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  if (hidden) return null;

  return (
    <a
      href="#lead-form"
      data-analytics-target="sticky-lead-cta"
      className="fixed bottom-4 left-1/2 z-[80] isolate flex -translate-x-1/2 transform-gpu items-center gap-2 rounded-pill bg-[#f5a623] px-7 py-3.5 font-body text-button font-semibold text-[#1a1205] shadow-[0_12px_36px_rgba(245,166,35,0.4)] transition-transform active:scale-95 md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {STICKY_CTA} <span aria-hidden>→</span>
    </a>
  );
}
