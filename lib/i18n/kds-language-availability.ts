import { DEFAULT_LOCALE, isLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";

/**
 * Ops-managed availability of the KDS interface languages
 * (Ops → Settings → KDS languages), persisted on the site settings singleton.
 * English is always available because it is the fallback for every missing
 * translation, so it has no switch.
 */
export interface KdsLanguageSettings {
  showKdsLanguageSelector: boolean;
  kdsLanguageRw: boolean;
  kdsLanguageFr: boolean;
  kdsLanguageSw: boolean;
}

export const KDS_LANGUAGE_FLAGS = {
  rw: "kdsLanguageRw",
  fr: "kdsLanguageFr",
  sw: "kdsLanguageSw",
} as const satisfies Record<Exclude<Locale, "en">, keyof KdsLanguageSettings>;

export interface KdsLanguageAvailability {
  /** False hides the selector and pins the kitchen to English. */
  selectorVisible: boolean;
  /** Selectable now, always including English, in display order. */
  enabled: Locale[];
  /** Listed but not selectable, shown with a "Soon" badge. */
  comingSoon: Locale[];
}

export function resolveKdsLanguageAvailability(
  settings: KdsLanguageSettings
): KdsLanguageAvailability {
  const enabled: Locale[] = [];
  const comingSoon: Locale[] = [];

  for (const { code } of SUPPORTED_LOCALES) {
    if (code === "en") {
      enabled.push(code);
    } else {
      (settings[KDS_LANGUAGE_FLAGS[code]] ? enabled : comingSoon).push(code);
    }
  }

  return { selectorVisible: settings.showKdsLanguageSelector, enabled, comingSoon };
}

/** A device cookie can name a language Ops has since switched off. */
export function resolveKdsLocale(
  cookieValue: unknown,
  availability: KdsLanguageAvailability
): Locale {
  if (!availability.selectorVisible) return DEFAULT_LOCALE;
  return isLocale(cookieValue) && availability.enabled.includes(cookieValue)
    ? cookieValue
    : DEFAULT_LOCALE;
}
