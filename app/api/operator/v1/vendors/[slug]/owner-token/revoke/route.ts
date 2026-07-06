import { operatorError, operatorJson } from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import { revokeOperatorOwnerToken } from "@/lib/operator-control/vendors";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const vendor = await revokeOperatorOwnerToken(slug);
      if (!vendor) {
        return operatorJson({ error: "Vendor not found" }, 404);
      }
      return operatorJson({ vendor });
    } catch (error) {
      return operatorError(error);
    }
  });
}
