import { getStore } from "@/lib/store";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { isLocale } from "@/lib/i18n/config";
import { flattenCopy } from "@/lib/i18n/localize";
import type { SiteTranslation } from "@/lib/i18n/site-translation-types";
import { auditOperatorAction } from "@/lib/operator-control/audit";

/** Valid translation keys = translatable string leaves of MARKETING_COPY. */
let knownKeys: Set<string> | null = null;
function getKnownKeys(): Set<string> {
  if (!knownKeys) knownKeys = new Set(Object.keys(flattenCopy(MARKETING_COPY)));
  return knownKeys;
}

function assertValid(locale: string, key: string) {
  if (!isLocale(locale)) {
    throw new Error(`Unknown locale "${locale}".`);
  }
  if (!getKnownKeys().has(key)) {
    throw new Error(`Unknown copy key "${key}".`);
  }
}

export async function listOperatorSiteTranslations(
  locale?: string
): Promise<SiteTranslation[]> {
  if (locale !== undefined && !isLocale(locale)) {
    throw new Error(`Unknown locale "${locale}".`);
  }
  return getStore().listSiteTranslations(locale);
}

export async function upsertOperatorSiteTranslation(
  locale: string,
  key: string,
  value: string
): Promise<SiteTranslation> {
  assertValid(locale, key);
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(
      "Value cannot be empty — reset the override to restore the baseline."
    );
  }
  const saved = await getStore().upsertSiteTranslation(locale, key, trimmed);
  await auditOperatorAction({
    action: "SITE_TRANSLATION_UPSERT",
    detail: { locale, key },
  });
  return saved;
}

export async function deleteOperatorSiteTranslation(
  locale: string,
  key: string
): Promise<boolean> {
  assertValid(locale, key);
  const deleted = await getStore().deleteSiteTranslation(locale, key);
  if (deleted) {
    await auditOperatorAction({
      action: "SITE_TRANSLATION_DELETE",
      detail: { locale, key },
    });
  }
  return deleted;
}
