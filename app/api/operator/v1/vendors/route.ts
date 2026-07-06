import { operatorError, operatorJson } from "@/lib/operator-control/http";
import {
  readSearchParam,
  withOperatorAuth,
} from "@/lib/operator-control/route-helper";
import { listOperatorVendors } from "@/lib/operator-control/vendors";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const url = new URL(request.url);
      const search = readSearchParam(url, "search");
      const activeParam = readSearchParam(url, "isActive");
      const isActive =
        activeParam === "true"
          ? true
          : activeParam === "false"
            ? false
            : undefined;

      const vendors = await listOperatorVendors({ search, isActive });
      return operatorJson({ vendors });
    } catch (error) {
      return operatorError(error);
    }
  });
}
