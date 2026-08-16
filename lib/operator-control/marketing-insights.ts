import { getStore } from "@/lib/store";
import { summarizeMarketingEvents, type MarketingInsights } from "@/lib/analytics/types";

export async function getOperatorMarketingInsights(days = 30): Promise<MarketingInsights> {
  const boundedDays = Math.min(365, Math.max(1, Math.round(days)));
  const from = new Date(Date.now() - boundedDays * 24 * 60 * 60 * 1000);
  const events = await getStore().listMarketingFunnelEvents(from);
  return summarizeMarketingEvents(events, boundedDays);
}
