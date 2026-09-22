import type { Locale } from "@/lib/i18n/config";
import { KDS_RW_BASELINE } from "@/lib/i18n/kds-translations/rw";
import { KDS_FR_BASELINE } from "@/lib/i18n/kds-translations/fr";
import { KDS_SW_BASELINE } from "@/lib/i18n/kds-translations/sw";

/**
 * In-repo baseline dictionaries for the registered KDS catalog. English is
 * `KDS_COPY` itself. These pre-fill Ops → Settings → Languages (KDS copy) so
 * the owner reviews and edits real wording instead of empty fields; saving a
 * line writes a DB override that wins over the baseline.
 */
export const KDS_BASELINE_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  en: {},
  rw: KDS_RW_BASELINE,
  fr: KDS_FR_BASELINE,
  sw: KDS_SW_BASELINE,
};
