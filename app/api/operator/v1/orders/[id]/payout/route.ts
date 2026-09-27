import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  operatorVendorPayoutAction,
  type OperatorPayoutAction,
} from "@/lib/operator-control/payouts";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Ops Vendor payout controls (ADR-0096 Slice 2).
 * POST body: { action: "retry" | "sync" }
 * Order stays PAID regardless of Transfer outcome.
 */
export async function POST(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { id } = await context.params;
      const body = await readJsonBody<{ action?: string }>(request);
      const action = body.action as OperatorPayoutAction | undefined;
      if (action !== "retry" && action !== "sync") {
        return operatorJson(
          { error: 'action must be "retry" or "sync"' },
          400,
        );
      }

      const result = await operatorVendorPayoutAction(id, action);
      if (!result) {
        return operatorJson({ error: "Order not found" }, 404);
      }

      return operatorJson({
        ok: result.ok,
        code: result.ok ? undefined : result.code,
        message: result.ok
          ? result.started
            ? "Transfer started"
            : `Payout ${result.payout.status}`
          : result.message,
        payout: result.payout ?? null,
        started: result.ok ? result.started : false,
      });
    } catch (error) {
      return operatorError(error);
    }
  });
}
