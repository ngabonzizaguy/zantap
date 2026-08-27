"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function BriefingMotion() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const hero = gsap.timeline();
      hero
        .from("[data-briefing-brand]", {
          autoAlpha: 0,
          y: 12,
          duration: 0.65,
          ease: "power2.out",
        })
        .from(
          "[data-briefing-hero]",
          {
            autoAlpha: 0,
            y: 34,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.1,
          },
          "-=0.35"
        );

      ScrollTrigger.batch("[data-briefing-reveal]", {
        start: "top 86%",
        once: true,
        batchMax: 4,
        onEnter: (elements) =>
          gsap.from(elements, {
            autoAlpha: 0,
            y: 34,
            duration: 0.8,
            stagger: 0.08,
            ease: "power3.out",
            clearProps: "opacity,visibility,transform",
          }),
      });

      gsap.utils.toArray<HTMLElement>("[data-briefing-parallax]").forEach((el) => {
        gsap.fromTo(
          el,
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          }
        );
      });
    });

    return () => mm.revert();
  }, []);

  return null;
}
