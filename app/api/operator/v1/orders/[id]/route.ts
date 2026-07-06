import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import { patchOperatorOrder } from "@/lib/operator-control/orders";
import type { OperatorOrderPatch } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { id } = await context.params;
      const body = await readJsonBody<OperatorOrderPatch>(request);
      const order = await patchOperatorOrder(id, body);
      if (!order) {
        return operatorJson({ error: "Order not found" }, 404);
      }
      return operatorJson({ order });
    } catch (error) {
      return operatorError(error);
    }
  });
}
