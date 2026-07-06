import { getStore } from "@/lib/store";
import { operatorError, operatorJson } from "@/lib/operator-control/http";
import {
  readSearchParam,
  withOperatorAuth,
} from "@/lib/operator-control/route-helper";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const url = new URL(request.url);
      const limitParam = readSearchParam(url, "limit");
      const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;
      const actions = await getStore().listOperatorActions(slug, limit);
      return operatorJson({ actions });
    } catch (error) {
      return operatorError(error);
    }
  });
}
