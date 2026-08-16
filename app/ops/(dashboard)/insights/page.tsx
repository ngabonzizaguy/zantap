import { MarketingInsights } from "@/components/ops/MarketingInsights";
import { getMarketingInsights } from "@/lib/operator-client";

export default async function OpsInsightsPage() {
  return <MarketingInsights insights={await getMarketingInsights(30)} />;
}
