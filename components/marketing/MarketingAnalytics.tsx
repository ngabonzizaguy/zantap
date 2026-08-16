"use client";

import { useEffect } from "react";
import { trackMarketingEvent } from "@/lib/analytics/client";

export function MarketingAnalytics() {
  useEffect(() => {
    trackMarketingEvent("landing_view");

    const form = document.getElementById("lead-form");
    let formSeen = false;
    let observer: IntersectionObserver | null = null;
    if (form) {
      observer = new IntersectionObserver(([entry]) => {
          if (entry.isIntersecting && !formSeen) {
            formSeen = true;
            trackMarketingEvent("lead_form_view");
            observer?.disconnect();
          }
        }, { threshold: 0.35 });
      observer.observe(form);
    }

    const onClick = (event: MouseEvent) => {
      const element = (event.target as Element | null)?.closest<HTMLElement>("[data-analytics-target]");
      const target = element?.dataset.analyticsTarget;
      if (target) trackMarketingEvent("cta_click", target);
    };
    document.addEventListener("click", onClick);
    return () => {
      observer?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, []);
  return null;
}
