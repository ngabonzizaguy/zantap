"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * GSAP entrance + scroll reveals for the marketing page (ADR-0047).
 * Declarative: any element with `data-mkt-hero` animates on load; any element
 * with `data-mkt-reveal` fades/rises when scrolled into view. All motion is
 * scoped inside gsap.matchMedia so prefers-reduced-motion users see static
 * content (elements stay at full opacity — we only animate FROM hidden).
 */
export function MarketingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-mkt-hero]", {
        opacity: 0,
        y: 28,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        clearProps: "opacity,transform",
      });

      const revealElements = gsap.utils.toArray<HTMLElement>(
        "[data-mkt-reveal]"
      );
      for (const el of revealElements) {
        gsap.from(el, {
          opacity: 0,
          y: 36,
          duration: 0.8,
          ease: "power2.out",
          clearProps: "opacity,transform",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        });
      }
    });

    return () => mm.revert();
  }, []);

  return null;
}
