import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  getOperatorMarketingSiteSettings,
  updateOperatorMarketingSiteSettings,
} from "@/lib/operator-control/marketing-settings";
import type { UpdateMarketingSiteSettingsInput } from "@/lib/vendor/feature-and-profit-types";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const settings = await getOperatorMarketingSiteSettings();
      return operatorJson({ settings });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<UpdateMarketingSiteSettingsInput>(request);
      const settings = await updateOperatorMarketingSiteSettings(body);
      return operatorJson({ settings });
    } catch (error) {
      return operatorError(error);
    }
  });
}
