import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  getOperatorLeadRoutingSettings,
  updateOperatorLeadRoutingSettings,
} from "@/lib/operator-control/leads";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const settings = await getOperatorLeadRoutingSettings();
      return operatorJson({ settings });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        whatsappEnabled?: unknown;
        whatsappPhone?: unknown;
      }>(request);
      if (typeof body.whatsappEnabled !== "boolean") {
        return operatorJson({ error: "whatsappEnabled must be a boolean" }, 400);
      }
      if (
        body.whatsappPhone !== undefined &&
        typeof body.whatsappPhone !== "string"
      ) {
        return operatorJson({ error: "whatsappPhone must be a string" }, 400);
      }

      const settings = await updateOperatorLeadRoutingSettings({
        whatsappEnabled: body.whatsappEnabled,
        whatsappPhone: body.whatsappPhone,
      });
      return operatorJson({ settings });
    } catch (error) {
      return operatorError(error);
    }
  });
}
