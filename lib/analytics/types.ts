export const MARKETING_EVENT_NAMES = [
  "landing_view",
  "lead_form_view",
  "lead_form_start",
  "cta_click",
  "lead_submit_success",
] as const;

export type MarketingEventName = (typeof MARKETING_EVENT_NAMES)[number];

export interface CreateMarketingFunnelEventInput {
  sessionId: string;
  event: MarketingEventName;
  target?: string;
  locale: string;
  path: string;
  referrerHost?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface MarketingFunnelEvent extends CreateMarketingFunnelEventInput {
  id: string;
  createdAt: Date;
}

export interface MarketingInsights {
  days: number;
  visitors: number;
  landingViews: number;
  leadFormViews: number;
  leadFormStarts: number;
  successfulLeads: number;
  conversionRate: number;
  clicks: Array<{ target: string; count: number }>;
  locales: Array<{ locale: string; visitors: number }>;
  sources: Array<{ source: string; visitors: number }>;
}

const SAFE_TEXT = /^[\w./:#?=&%+ -]+$/u;

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, max);
  return trimmed && SAFE_TEXT.test(trimmed) ? trimmed : undefined;
}

export function parseMarketingEvent(
  value: unknown
): CreateMarketingFunnelEventInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const event = input.event;
  const sessionId = clean(input.sessionId, 64);
  const locale = clean(input.locale, 8) ?? "en";
  const path = clean(input.path, 180) ?? "/";
  if (
    !sessionId ||
    typeof event !== "string" ||
    !MARKETING_EVENT_NAMES.includes(event as MarketingEventName)
  ) {
    return null;
  }
  return {
    sessionId,
    event: event as MarketingEventName,
    target: clean(input.target, 80),
    locale,
    path,
    referrerHost: clean(input.referrerHost, 120),
    utmSource: clean(input.utmSource, 80),
    utmMedium: clean(input.utmMedium, 80),
    utmCampaign: clean(input.utmCampaign, 80),
  };
}

export function summarizeMarketingEvents(
  events: MarketingFunnelEvent[],
  days: number
): MarketingInsights {
  const sessions = new Set(events.map((row) => row.sessionId));
  const count = (name: MarketingEventName) =>
    events.filter((row) => row.event === name).length;
  const successfulLeads = count("lead_submit_success");
  const clicks = new Map<string, number>();
  const localeSessions = new Map<string, Set<string>>();
  const sourceSessions = new Map<string, Set<string>>();

  for (const row of events) {
    if (row.event === "cta_click" && row.target) {
      clicks.set(row.target, (clicks.get(row.target) ?? 0) + 1);
    }
    const localeSet = localeSessions.get(row.locale) ?? new Set<string>();
    localeSet.add(row.sessionId);
    localeSessions.set(row.locale, localeSet);
    const source = row.utmSource ?? row.referrerHost ?? "Direct";
    const sourceSet = sourceSessions.get(source) ?? new Set<string>();
    sourceSet.add(row.sessionId);
    sourceSessions.set(source, sourceSet);
  }

  const sorted = (map: Map<string, number>) =>
    [...map].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return {
    days,
    visitors: sessions.size,
    landingViews: count("landing_view"),
    leadFormViews: count("lead_form_view"),
    leadFormStarts: count("lead_form_start"),
    successfulLeads,
    conversionRate: sessions.size ? Math.round((successfulLeads / sessions.size) * 1000) / 10 : 0,
    clicks: sorted(clicks).map(({ name, value }) => ({ target: name, count: value })),
    locales: [...localeSessions].map(([locale, values]) => ({ locale, visitors: values.size })).sort((a, b) => b.visitors - a.visitors),
    sources: [...sourceSessions].map(([source, values]) => ({ source, visitors: values.size })).sort((a, b) => b.visitors - a.visitors),
  };
}
