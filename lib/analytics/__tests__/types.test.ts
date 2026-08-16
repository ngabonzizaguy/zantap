import { describe, expect, it } from "vitest";
import { parseMarketingEvent, summarizeMarketingEvents, type MarketingFunnelEvent } from "../types";

describe("marketing funnel analytics", () => {
  it("accepts only allowlisted, privacy-minimal fields", () => {
    expect(parseMarketingEvent({ sessionId: "abc-123", event: "cta_click", target: "hero", locale: "rw", path: "/", email: "private@example.com" })).toEqual({
      sessionId: "abc-123", event: "cta_click", target: "hero", locale: "rw", path: "/", referrerHost: undefined, utmSource: undefined, utmMedium: undefined, utmCampaign: undefined,
    });
    expect(parseMarketingEvent({ sessionId: "abc", event: "password_capture" })).toBeNull();
  });

  it("summarizes unique sessions, conversion, clicks, locale and attribution", () => {
    const at = new Date();
    const events = [
      { id: "1", sessionId: "a", event: "landing_view", locale: "rw", path: "/", utmSource: "instagram", createdAt: at },
      { id: "2", sessionId: "a", event: "cta_click", target: "hero", locale: "rw", path: "/", utmSource: "instagram", createdAt: at },
      { id: "3", sessionId: "a", event: "lead_submit_success", locale: "rw", path: "/", createdAt: at },
      { id: "4", sessionId: "b", event: "landing_view", locale: "en", path: "/", createdAt: at },
    ] as MarketingFunnelEvent[];
    const result = summarizeMarketingEvents(events, 30);
    expect(result.visitors).toBe(2);
    expect(result.conversionRate).toBe(50);
    expect(result.clicks[0]).toEqual({ target: "hero", count: 1 });
    expect(result.sources).toContainEqual({ source: "instagram", visitors: 1 });
  });
});
