import "server-only";
import { getStore } from "@/lib/store";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { KDS_BASELINE_TRANSLATIONS } from "@/lib/i18n/kds-baselines";
import { selectKdsTranslations, type KdsDictionary, type KdsTranslations } from "@/lib/i18n/kds-localize";

/**
 * Kitchen dictionaries, resolved per key as: owner override (DB) → in-repo
 * baseline (`lib/i18n/kds-translations/`) → English (`KDS_COPY`, applied by
 * `createKdsTranslator`). Baselines are merged here, server-side only, so the
 * KDS renders translated copy without the owner having to save all 684 lines,
 * while any line they do edit in Ops still wins.
 */
export async function getKdsTranslations(): Promise<KdsTranslations> {
  let overrides: KdsTranslations = {};
  try {
    overrides = selectKdsTranslations(await getStore().listSiteTranslations());
  } catch {
    // Copy availability must not prevent the kitchen from handling orders —
    // fall through with baselines only.
  }

  const merged: KdsTranslations = {};
  for (const { code } of SUPPORTED_LOCALES) {
    const dictionary = { ...KDS_BASELINE_TRANSLATIONS[code], ...overrides[code] } as KdsDictionary;
    if (Object.keys(dictionary).length > 0) merged[code] = dictionary;
  }
  return merged;
}

/** Serializes only the languages Ops enables, keeping the KDS payload small. */
export function pickKdsLocales(translations: KdsTranslations, locales: Locale[]): KdsTranslations {
  const picked: KdsTranslations = {};
  for (const locale of locales) {
    if (translations[locale]) picked[locale] = translations[locale];
  }
  return picked;
}
