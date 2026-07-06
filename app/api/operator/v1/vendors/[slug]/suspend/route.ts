import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import { suspendOperatorVendor } from "@/lib/operator-control/vendors";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const body = await readJsonBody<{ reason?: string }>(request).catch(
        (): { reason?: string } => ({})
      );
      const vendor = await suspendOperatorVendor(slug, body.reason);
      if (!vendor) {
        return operatorJson({ error: "Vendor not found" }, 404);
      }
      return operatorJson({ vendor });
    } catch (error) {
      return operatorError(error);
    }
  });
}
