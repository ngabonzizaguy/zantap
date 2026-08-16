"use client";

import type { MarketingEventName } from "@/lib/analytics/types";

const SESSION_KEY = "zantap_marketing_session";

function sessionId(): string {
  try {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function trackMarketingEvent(
  event: MarketingEventName,
  target?: string
): void {
  const params = new URLSearchParams(location.search);
  let referrerHost: string | undefined;
  try {
    referrerHost = document.referrer ? new URL(document.referrer).hostname : undefined;
  } catch {
    referrerHost = undefined;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      sessionId: sessionId(),
      event,
      target,
      locale: document.documentElement.lang || "en",
      path: location.pathname,
      referrerHost,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    }),
  }).catch(() => undefined);
}
