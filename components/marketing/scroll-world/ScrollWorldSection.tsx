"use client";

import { useEffect, useRef } from "react";
import { SCROLL_WORLD } from "@/lib/marketing/copy";
import { TornEdge } from "@/components/marketing/TornPaint";
import {
  mountScrollWorld,
  type ScrollWorldSection as SectionConfig,
} from "./scrub-engine";

/**
 * Mid-page scroll-world embed: a sticky viewport that scrubs the
 * pre-rendered Kigali walkthrough legs by scroll. Scene 02 uses the
 * owner-approved Journey 02 native-reference generation; scene 03 uses the
 * owner-accepted Journey 03 payment-success still (2026-08-14); scenes 4–6
 * retain their approved stills until their separately gated production passes.
 */
export function ScrollWorldSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const sw = SCROLL_WORLD;
    // Owner-approved current screenshots (public/brand/UI-screens/new-UI-screens
    // & video walkthrough) — scene 02 shows the storefront UI per owner request.
    const media: Record<string, SectionConfig["media"]> = {
      order: {
        src: "/marketing/card-storefront.png",
        alt: sw.media.storefrontScreenAlt,
        kind: "screen",
      },
      momo: {
        src: "/marketing/card-momo-pay.png",
        alt: sw.media.momoScreenAlt,
        kind: "screen",
      },
      kitchen: {
        src: "/marketing/card-kds-dashboard.png",
        alt: sw.media.kitchenScreenAlt,
        kind: "screen",
      },
    };
    // Scenes with rendered legs scrub video; the rest still-crossfade.
    // Scene 3 (momo) deliberately has NO clip: its rendered leg baked in an
    // AI-invented payment screen (owner-rejected 2026-08-09) — a clip re-slots
    // once the film is finished with clean footage. Its poster momo.webp is
    // now the owner-accepted Journey 03 payment-success still (ADR-0058).
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
      {/* The dark page background tears into the footage at both seams */}
      <div className="relative">
        <TornEdge position="top" />
        <div ref={trackRef} />
        <TornEdge position="bottom" />
      </div>
    </section>
  );
}
