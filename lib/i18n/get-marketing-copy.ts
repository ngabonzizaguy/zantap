import "server-only";

import { getStore } from "@/lib/store";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { BASELINE_TRANSLATIONS } from "@/lib/i18n/baselines";
import type { Locale } from "@/lib/i18n/config";
import {
  localizeTree,
  type Localized,
  type TranslationDict,
} from "@/lib/i18n/localize";

export type LocalizedMarketingCopy = Localized<typeof MARKETING_COPY>;

/**
 * Resolves the marketing copy for a locale: English tree ← in-repo baseline
 * dictionary ← owner overrides stored through the Store seam (Ops editor).
 * A Store failure falls back to the baseline so the marketing page never
 * hard-fails on the translations table.
 */
export async function getLocalizedMarketingCopy(
  locale: Locale
): Promise<LocalizedMarketingCopy> {
  let overrides: TranslationDict = {};
  try {
    const rows = await getStore().listSiteTranslations(locale);
    overrides = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    // Table missing / DB hiccup — baseline copy still renders.
  }
  return localizeTree(MARKETING_COPY, {
    ...BASELINE_TRANSLATIONS[locale],
    ...overrides,
  });
}
