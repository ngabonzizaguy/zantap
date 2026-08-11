import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  createOperatorLeadRoutingRecipient,
  listOperatorLeadRoutingRecipients,
  removeOperatorLeadRoutingRecipient,
  updateOperatorLeadRoutingRecipient,
} from "@/lib/operator-control/leads";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const recipients = await listOperatorLeadRoutingRecipients();
      return operatorJson({ recipients });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function POST(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        name?: unknown;
        phone?: unknown;
        enabled?: unknown;
      }>(request);
      if (typeof body.name !== "string") {
        return operatorJson({ error: "name must be a string" }, 400);
      }
      if (typeof body.phone !== "string") {
        return operatorJson({ error: "phone must be a string" }, 400);
      }
      if (typeof body.enabled !== "boolean") {
        return operatorJson({ error: "enabled must be a boolean" }, 400);
      }

      const recipient = await createOperatorLeadRoutingRecipient({
        name: body.name,
        phone: body.phone,
        enabled: body.enabled,
      });
      return operatorJson({ recipient }, 201);
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        recipientId?: unknown;
        name?: unknown;
        phone?: unknown;
        enabled?: unknown;
      }>(request);
      if (typeof body.recipientId !== "string" || !body.recipientId.trim()) {
        return operatorJson({ error: "recipientId is required" }, 400);
      }
      if (body.name !== undefined && typeof body.name !== "string") {
        return operatorJson({ error: "name must be a string" }, 400);
      }
      if (body.phone !== undefined && typeof body.phone !== "string") {
        return operatorJson({ error: "phone must be a string" }, 400);
      }
      if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
        return operatorJson({ error: "enabled must be a boolean" }, 400);
      }

      const recipient = await updateOperatorLeadRoutingRecipient(
        body.recipientId,
        { name: body.name, phone: body.phone, enabled: body.enabled }
      );
      if (!recipient) {
        return operatorJson({ error: "Lead routing recipient not found" }, 404);
      }
      return operatorJson({ recipient });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function DELETE(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{ recipientId?: unknown }>(request);
      if (typeof body.recipientId !== "string" || !body.recipientId.trim()) {
        return operatorJson({ error: "recipientId is required" }, 400);
      }
      const removed = await removeOperatorLeadRoutingRecipient(body.recipientId);
      if (!removed) {
        return operatorJson({ error: "Lead routing recipient not found" }, 404);
      }
      return operatorJson({ removed: true });
    } catch (error) {
      return operatorError(error);
    }
  });
}
