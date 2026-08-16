import type { Locale } from "@/lib/i18n/config";
import type { TranslationDict } from "@/lib/i18n/localize";
import { RW_TRANSLATIONS } from "@/lib/i18n/translations/rw";
import { FR_TRANSLATIONS } from "@/lib/i18n/translations/fr";
import { SW_TRANSLATIONS } from "@/lib/i18n/translations/sw";

/** In-repo baseline dictionaries. English is the copy tree itself. */
export const BASELINE_TRANSLATIONS: Record<Locale, TranslationDict> = {
  en: {},
  rw: RW_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
  sw: SW_TRANSLATIONS,
};
