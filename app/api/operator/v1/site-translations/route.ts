import {
  operatorError,
  operatorJson,
  readJsonBody,
} from "@/lib/operator-control/http";
import { withOperatorAuth } from "@/lib/operator-control/route-helper";
import {
  deleteOperatorSiteTranslation,
  listOperatorSiteTranslations,
  upsertOperatorSiteTranslation,
} from "@/lib/operator-control/site-translations";

export async function GET(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const locale =
        new URL(request.url).searchParams.get("locale") ?? undefined;
      const translations = await listOperatorSiteTranslations(locale);
      return operatorJson({ translations });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function PATCH(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{
        locale: string;
        key: string;
        value: string;
      }>(request);
      const translation = await upsertOperatorSiteTranslation(
        body.locale,
        body.key,
        body.value
      );
      return operatorJson({ translation });
    } catch (error) {
      return operatorError(error);
    }
  });
}

export async function DELETE(request: Request) {
  return withOperatorAuth(request, async () => {
    try {
      const body = await readJsonBody<{ locale: string; key: string }>(request);
      const deleted = await deleteOperatorSiteTranslation(body.locale, body.key);
      return operatorJson({ deleted });
    } catch (error) {
      return operatorError(error);
    }
  });
}
