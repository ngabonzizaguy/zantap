/**
 * Marketing-site locales (owner decision 2026-08-14): English plus
 * Kinyarwanda, French, and Kiswahili. Baseline translations live in
 * `lib/i18n/translations/`; the owner can override EVERY string (any locale,
 * including English) from Ops → Settings → Languages, persisted through the
 * Store seam (`SiteTranslation`).
 */

export const SUPPORTED_LOCALES = [
  { code: "en", label: "English" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "fr", label: "Français" },
  { code: "sw", label: "Kiswahili" },
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie read server-side so the marketing page SSRs in the chosen language
 *  (no client-side text swap/flash). The LanguageSwitcher writes it. */
export const LOCALE_COOKIE = "zantap_lang";

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" &&
    SUPPORTED_LOCALES.some((locale) => locale.code === value)
  );
}

export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
