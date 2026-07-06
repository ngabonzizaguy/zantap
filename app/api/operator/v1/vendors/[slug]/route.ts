import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  getOperatorVendor,
  patchOperatorVendor,
} from "@/lib/operator-control/vendors";
import type { OperatorUpdateVendorInput } from "@/lib/types";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const detail = await getOperatorVendor(slug);
      if (!detail) {
        return operatorJson({ error: "Vendor not found" }, 404);
      }
      return operatorJson({ detail });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const body = await readJsonBody<OperatorUpdateVendorInput>(request);
      const vendor = await patchOperatorVendor(slug, body);
      if (!vendor) {
        return operatorJson({ error: "Vendor not found" }, 404);
      }
      return operatorJson({ vendor });
    } catch (error) {
      return operatorError(error);
    }
  });
}
