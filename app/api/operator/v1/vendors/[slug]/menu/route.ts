import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  archiveOperatorMenuItem,
  listOperatorMenu,
  patchOperatorMenuItem,
  toggleOperatorMenuAvailability,
} from "@/lib/operator-control/menu";
import type { UpdateMenuItemInput } from "@/lib/types";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const menu = await listOperatorMenu(slug);
      return operatorJson({ menu });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  return withOperatorAuth(request, async () => {
    try {
      const { slug } = await context.params;
      const body = await readJsonBody<{
        itemId: string;
        action?: "archive" | "toggle";
        patch?: UpdateMenuItemInput;
      }>(request);
      if (!body.itemId) {
        return operatorJson({ error: "itemId is required" }, 400);
      }

      let item = null;
      if (body.action === "archive") {
        item = await archiveOperatorMenuItem(slug, body.itemId);
      } else if (body.action === "toggle") {
        item = await toggleOperatorMenuAvailability(slug, body.itemId);
      } else if (body.patch) {
        item = await patchOperatorMenuItem(slug, body.itemId, body.patch);
      } else {
        return operatorJson({ error: "patch or action required" }, 400);
      }

      if (!item) {
        return operatorJson({ error: "Menu item not found" }, 404);
      }
      return operatorJson({ item });
    } catch (error) {
      return operatorError(error);
    }
  });
}
