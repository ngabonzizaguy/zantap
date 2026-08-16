import { operatorError, operatorJson } from "@/lib/operator-control/http";
import { readSearchParam, withOperatorAuth } from "@/lib/operator-control/route-helper";
import { getOperatorMarketingInsights } from "@/lib/operator-control/marketing-insights";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const raw = readSearchParam(new URL(request.url), "days");
      const days = raw ? Number(raw) : 30;
      if (!Number.isFinite(days)) return operatorJson({ error: "Invalid days" }, 400);
      return operatorJson({ insights: await getOperatorMarketingInsights(days) });
    } catch (error) {
      return operatorError(error);
    }
  });
}
