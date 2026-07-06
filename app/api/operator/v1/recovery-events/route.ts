import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import {
  readSearchParam,
  withOperatorAuth,
} from "@/lib/operator-control/route-helper";
import {
  listOperatorRecoveryEvents,
  reviewOperatorRecoveryEvent,
} from "@/lib/operator-control/recovery";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const url = new URL(request.url);
      const vendorSlug = readSearchParam(url, "vendorSlug");
      const unreviewedOnly = readSearchParam(url, "unreviewedOnly") === "true";
      const limitParam = readSearchParam(url, "limit");
      const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;

      const events = await listOperatorRecoveryEvents({
        vendorSlug,
        unreviewedOnly,
        limit,
      });
      return operatorJson({ events });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{ eventId: string; reviewNote?: string }>(
        request
      );
      if (!body.eventId) {
        return operatorJson({ error: "eventId is required" }, 400);
      }
      const event = await reviewOperatorRecoveryEvent(
        body.eventId,
        body.reviewNote
      );
      if (!event) {
        return operatorJson({ error: "Event not found" }, 404);
      }
      return operatorJson({ event });
    } catch (error) {
      return operatorError(error);
    }
  });
}
