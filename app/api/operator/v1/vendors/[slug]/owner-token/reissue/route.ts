import { operatorError, operatorJson } from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import { reissueOperatorOwnerToken } from "@/lib/operator-control/vendors";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const result = await reissueOperatorOwnerToken(slug);
      if (!result) {
        return operatorJson({ error: "Vendor not found" }, 404);
      }
      return operatorJson(result);
    } catch (error) {
      return operatorError(error);
    }
  });
}
