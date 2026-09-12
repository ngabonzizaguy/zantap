"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { isLocale, SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import {
  createKdsTranslator,
  KDS_LOCALE_COOKIE,
  type KdsTranslate,
  type KdsTranslations,
} from "@/lib/i18n/kds-localize";

const KdsLanguageContext = createContext<{
  locale: Locale;
  t: KdsTranslate;
  changeLocale: (locale: Locale) => void;
}>({ locale: "en", t: createKdsTranslator(), changeLocale: () => {} });

export function KdsLanguageProvider({
  initialLocale,
  translations,
  children,
}: {
  initialLocale: Locale;
  translations: KdsTranslations;
  children: ReactNode;
}) {
  const [locale, setLocale] = useState(initialLocale);
  const value = useMemo(() => ({
    locale,
    t: createKdsTranslator(translations[locale]),
    changeLocale(next: Locale) {
      setLocale(next);
      document.cookie = `${KDS_LOCALE_COOKIE}=${next}; path=/vendor; max-age=31536000; samesite=lax`;
    },
  }), [locale, translations]);

  return (
    <KdsLanguageContext.Provider value={value}>
      <div lang={locale}>{children}</div>
    </KdsLanguageContext.Provider>
  );
}

export function useKdsTranslation(): KdsTranslate {
  return useContext(KdsLanguageContext).t;
}

export function KdsLanguageSelector() {
  const { locale, changeLocale } = useContext(KdsLanguageContext);
  return (
    <label className="flex items-center gap-2 font-body text-caption text-muted">
      <select
        aria-label="KDS language / Ururimi / Langue / Lugha"
        value={locale}
        onChange={(event) => { if (isLocale(event.target.value)) changeLocale(event.target.value); }}
        className="min-h-11 max-w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink"
      >
        {SUPPORTED_LOCALES.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </select>
    </label>
  );
}
