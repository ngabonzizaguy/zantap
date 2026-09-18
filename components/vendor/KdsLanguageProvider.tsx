"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import { Select } from "@/components/ui/primitives";
import type { KdsLanguageAvailability } from "@/lib/i18n/kds-language-availability";
import {
  createKdsTranslator,
  KDS_LOCALE_COOKIE,
  type KdsTranslate,
  type KdsTranslations,
} from "@/lib/i18n/kds-localize";

const ALL_LANGUAGES_AVAILABLE: KdsLanguageAvailability = {
  selectorVisible: true,
  enabled: SUPPORTED_LOCALES.map((item) => item.code),
  comingSoon: [],
};

const KdsLanguageContext = createContext<{
  locale: Locale;
  t: KdsTranslate;
  changeLocale: (locale: Locale) => void;
  languages: KdsLanguageAvailability;
}>({
  locale: DEFAULT_LOCALE,
  t: createKdsTranslator(),
  changeLocale: () => {},
  languages: ALL_LANGUAGES_AVAILABLE,
});

const LOCALE_CHIP_LABEL: Record<Locale, string> = {
  en: "EN",
  rw: "KN",
  fr: "FR",
  sw: "SW",
};

export function KdsLanguageProvider({
  initialLocale,
  translations,
  languages = ALL_LANGUAGES_AVAILABLE,
  children,
}: {
  initialLocale: Locale;
  translations: KdsTranslations;
  languages?: KdsLanguageAvailability;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const value = useMemo(() => ({
    locale,
    t: createKdsTranslator(translations[locale]),
    languages,
    changeLocale(next: Locale) {
      setLocale(next);
      document.cookie = `${KDS_LOCALE_COOKIE}=${next}; path=/vendor; max-age=31536000; samesite=lax`;
    },
  }), [languages, locale, translations]);

  return (
    <KdsLanguageContext.Provider value={value}>
      <div lang={locale}>{children}</div>
    </KdsLanguageContext.Provider>
  );
}

export function useKdsTranslation(): KdsTranslate {
  return useContext(KdsLanguageContext).t;
}

/** Renders its own header row so that an Ops-hidden selector leaves no gap. */
export function KdsLanguageSelector() {
  const { locale, changeLocale, languages, t } = useContext(KdsLanguageContext);
  if (!languages.selectorVisible) return null;

  return (
    <div className="flex justify-end px-4 pb-3 sm:px-[18px]">
      <Select<Locale>
        value={locale}
        onChange={changeLocale}
        options={SUPPORTED_LOCALES.map((item) => ({
          value: item.code,
          label: item.label,
          disabled: languages.comingSoon.includes(item.code),
          note: languages.comingSoon.includes(item.code) ? t("kds.language.soon") : undefined,
        }))}
        triggerLabel={LOCALE_CHIP_LABEL[locale]}
        variant="pill"
        align="end"
        ariaLabel="KDS language / Ururimi / Langue / Lugha"
        triggerClassName="tracking-wide"
        prefix={
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.5 2.5 4 5.8 4 9s-1.5 6.5-4 9M12 3c-2.5 2.5-4 5.8-4 9s1.5 6.5 4 9" />
          </svg>
        }
      />
    </div>
  );
}
