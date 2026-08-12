"use client";

import { useEffect, useRef } from "react";
import { SCROLL_WORLD } from "@/lib/marketing/copy";
import {
  mountScrollWorld,
  type ScrollWorldSection as SectionConfig,
} from "./scrub-engine";

/**
 * Mid-page scroll-world embed (Issue 03 zero-credit preview): a sticky
 * viewport that scrubs the pre-rendered Kigali walkthrough legs by scroll.
 * Scenes 1–2 scrub video; scenes 3–6 crossfade their approved stills until
 * the owner decides how the film gets finished (real footage favored).
 */
export function ScrollWorldSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sw = SCROLL_WORLD;
    const media: Record<string, SectionConfig["media"]> = {
      order: {
        src: "/marketing/screen-storefront.png",
        alt: sw.media.storefrontScreenAlt,
        kind: "screen",
      },
      momo: {
        src: "/marketing/scroll/momo-logo.png",
        alt: sw.media.momoLogoAlt,
        kind: "logo",
      },
      kitchen: {
        src: "/marketing/screen-kitchen.png",
        alt: sw.media.kitchenScreenAlt,
        kind: "screen",
      },
    };
    // Scenes with rendered legs scrub video; the rest still-crossfade.
    // Scene 3 (momo) deliberately has NO clip: the rendered leg bakes in an
    // AI-invented payment screen (owner-rejected 2026-08-09) — it re-slots
    // once the film is finished with clean footage.
    const clips: Record<string, string> = {
      storefront: "/marketing/vid/storefront.mp4",
      order: "/marketing/vid/order.mp4",
    };

    const sections: SectionConfig[] = sw.sections.map((s) => ({
      id: s.id,
      label: s.label,
      still: `/marketing/scroll/${s.id}.webp`,
      clip: clips[s.id],
      eyebrow: s.eyebrow,
      title: s.title,
      body: s.body,
      media: media[s.id],
      ...("cta" in s && s.cta
        ? { cta: { label: s.cta, href: "#lead-form" } }
        : {}),
      ...(s.id === "grow" ? { scroll: 1.6, linger: 0.35 } : {}),
    }));

    return mountScrollWorld(track, {
      sections,
      diveScroll: 1.3,
      crossfade: 0.08,
      hint: sw.hint,
    });
  }, []);

  return (
    <section aria-label={SCROLL_WORLD.heading} className="border-t border-white/10">
      <div className="mx-auto max-w-6xl px-5 pt-20 sm:px-8 lg:pt-28">
        <div data-mkt-reveal className="max-w-xl pb-12">
          <p className="font-body text-caption-uppercase uppercase text-[#f5a623]">
            {SCROLL_WORLD.kicker}
          </p>
          <h2 className="mt-3 font-display text-[34px] font-light leading-tight sm:text-[44px]">
            {SCROLL_WORLD.heading}
          </h2>
        </div>
      </div>
      <div ref={trackRef} />
    </section>
  );
}
