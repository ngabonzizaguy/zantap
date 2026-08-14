"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export interface ScreenCard {
  src: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
}

interface Props {
  cards: readonly ScreenCard[];
}

/**
 * Auto-cycling 3-card screen deck (owner's reference-video style, supersedes
 * ADR-0046 §5's device-hardware-only rule for this section per owner request):
 * the front card sits large and centered, the other two peek from behind on
 * each side; every few seconds the deck rotates with an eased, slightly tilted
 * swap. A caption pill and dots track the active card. Cycling pauses while
 * hovered/pressed and never starts for prefers-reduced-motion users.
 */

// Slot layout: 0 = front/center, 1 = behind-right, 2 = behind-left.
// Back cards stay fully opaque (no see-through) — a dark scrim dims them.
const SLOTS = [
  { xPercent: 0, scale: 1, scrim: 0, rotation: 0, zIndex: 30 },
  { xPercent: 44, scale: 0.84, scrim: 0.55, rotation: 3.5, zIndex: 20 },
  { xPercent: -44, scale: 0.84, scrim: 0.55, rotation: -3.5, zIndex: 10 },
] as const;

// Slow, gentle swap: cards travel right → center → left with a soft
// ease-in-out; z-index interpolates during the tween so layers hand over
// gradually instead of popping.
const CYCLE_MS = 4200;
const SWAP_S = 1.5;
const SWAP_EASE = "power2.inOut";

export function ScreenCardDeck({ cards }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cardEls = Array.from(
      root.querySelectorAll<HTMLElement>("[data-deck-card]"),
    );
    if (cardEls.length < 2) return;

    // slotOf[i] = which slot card i currently occupies.
    const slotOf = cardEls.map((_, i) => i % SLOTS.length);

    const apply = (el: HTMLElement, slot: number, animate: boolean) => {
      const s = SLOTS[slot];
      const vars = {
        xPercent: s.xPercent,
        scale: s.scale,
        rotation: s.rotation,
        zIndex: s.zIndex,
      };
      const scrim = el.querySelector<HTMLElement>("[data-deck-scrim]");
      if (animate) {
        gsap.to(el, { ...vars, duration: SWAP_S, ease: SWAP_EASE });
        if (scrim)
          gsap.to(scrim, {
            opacity: s.scrim,
            duration: SWAP_S,
            ease: SWAP_EASE,
          });
      } else {
        gsap.set(el, vars);
        if (scrim) gsap.set(scrim, { opacity: s.scrim });
      }
    };

    cardEls.forEach((el, i) => apply(el, slotOf[i], false));

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let captionTimer: ReturnType<typeof setTimeout> | undefined;

    if (!reduced.matches) {
      timer = setInterval(() => {
        if (pausedRef.current || document.hidden) return;
        // Rotate every card one slot forward: front → behind-left,
        // behind-right → front, behind-left → behind-right.
        cardEls.forEach((el, i) => {
          slotOf[i] = (slotOf[i] + SLOTS.length - 1) % SLOTS.length;
          apply(el, slotOf[i], true);
        });
        // Swap the caption mid-transition, when the incoming card takes over.
        const next = slotOf.indexOf(0);
        captionTimer = setTimeout(() => setActive(next), SWAP_S * 500);
      }, CYCLE_MS);
    }

    const pause = () => {
      pausedRef.current = true;
    };
    const resume = () => {
      pausedRef.current = false;
    };
    root.addEventListener("pointerenter", pause);
    root.addEventListener("pointerleave", resume);
    root.addEventListener("pointerdown", pause);
    root.addEventListener("pointerup", resume);
    root.addEventListener("pointercancel", resume);

    return () => {
      if (timer) clearInterval(timer);
      if (captionTimer) clearTimeout(captionTimer);
      root.removeEventListener("pointerenter", pause);
      root.removeEventListener("pointerleave", resume);
      root.removeEventListener("pointerdown", pause);
      root.removeEventListener("pointerup", resume);
      root.removeEventListener("pointercancel", resume);
      cardEls.forEach((el) => {
        gsap.killTweensOf(el);
        const scrim = el.querySelector<HTMLElement>("[data-deck-scrim]");
        if (scrim) gsap.killTweensOf(scrim);
      });
    };
  }, [cards.length]);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div
        ref={rootRef}
        className="relative flex h-[420px] w-full max-w-[420px] items-center justify-center sm:h-[490px]"
        role="group"
        aria-roledescription="carousel"
        aria-label="ZanTap product screens"
      >
        {cards.map((card, i) => (
          /* Phone chassis (DeviceFrame look, minus the notch so no screenshot
             detail is covered; image keeps its natural aspect — no cropping) */
          <div
            key={card.src}
            data-deck-card
            className="absolute w-[200px] rounded-[36px] bg-[#1c1917] p-[8px] shadow-[0_24px_70px_rgba(0,0,0,0.6)] will-change-transform sm:w-[230px]"
            aria-hidden={active !== i}
          >
            <span className="absolute -left-[2px] top-[18%] h-12 w-[3px] rounded-l bg-[#292524]" />
            <span className="absolute -right-[2px] top-[26%] h-8 w-[3px] rounded-r bg-[#292524]" />
            {/* Uniform elongated screen; screenshot fills the width top-down,
                uncropped and full-size — the rest of the screen stays dark */}
            <div className="relative aspect-[10/19] overflow-hidden rounded-[28px] bg-[#0c0a09]">
              <Image
                src={card.src}
                alt={card.alt}
                width={card.width}
                height={card.height}
                className="h-auto w-full"
                sizes="230px"
              />
              {/* Glass sheen */}
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent" />
            </div>
            {/* Solid dark scrim dims back cards without transparency */}
            <span
              data-deck-scrim
              className="pointer-events-none absolute inset-0 rounded-[36px] bg-[#0c0a09]"
            />
          </div>
        ))}
      </div>

      {/* Caption pill + dots (mirrors the reference videos) */}
      <div className="flex flex-col items-center gap-3">
        <p
          aria-live="polite"
          className="rounded-pill border border-white/10 bg-white/[0.06] px-5 py-2 font-body text-body-sm text-white/85 backdrop-blur-sm"
        >
          {cards[active]?.caption}
        </p>
        <div className="flex items-center gap-2">
          {cards.map((card, i) => (
            <span
              key={card.src}
              aria-hidden
              className={
                i === active
                  ? "h-1.5 w-4 rounded-full bg-[#f5a623] transition-all"
                  : "h-1.5 w-1.5 rounded-full bg-white/25 transition-all"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
