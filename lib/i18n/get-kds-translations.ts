import "server-only";
import { getStore } from "@/lib/store";
import { selectKdsTranslations, type KdsTranslations } from "@/lib/i18n/kds-localize";

export async function getKdsTranslations(): Promise<KdsTranslations> {
  try {
    return selectKdsTranslations(await getStore().listSiteTranslations());
  } catch {
    // Copy availability must not prevent the kitchen from handling orders.
    return {};
  }
}
