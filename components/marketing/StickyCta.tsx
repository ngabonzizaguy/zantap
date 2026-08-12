"use client";

import { useEffect, useState } from "react";
import { STICKY_CTA } from "@/lib/marketing/copy";

/**
 * Conversion guard (ADR-0047 decision 2): on mobile the lead form (or this
 * jump-to-form pill) is reachable within one viewport at all times. The pill
 * hides while the form itself is on screen.
 */
export function StickyCta() {
  const [formVisible, setFormVisible] = useState(true);

  useEffect(() => {
    const form = document.getElementById("lead-form");
    if (!form) return;
    const observer = new IntersectionObserver(
      ([entry]) => setFormVisible(entry.isIntersecting),
      { threshold: 0.15 }
    );
    observer.observe(form);
    return () => observer.disconnect();
  }, []);

  if (formVisible) return null;

  return (
    <a
      href="#lead-form"
      className="fixed bottom-4 left-1/2 z-[80] isolate flex -translate-x-1/2 transform-gpu items-center gap-2 rounded-pill bg-[#f5a623] px-7 py-3.5 font-body text-button font-semibold text-[#1a1205] shadow-[0_12px_36px_rgba(245,166,35,0.4)] transition-transform active:scale-95 md:hidden"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {STICKY_CTA} <span aria-hidden>→</span>
    </a>
  );
}
