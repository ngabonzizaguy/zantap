import { KDS_COPY, type KdsCopyKey } from "@/lib/i18n/kds-copy";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { SiteTranslation } from "@/lib/i18n/site-translation-types";

export const KDS_LOCALE_COOKIE = "zantap_kds_lang";
export type KdsDictionary = Partial<Record<KdsCopyKey, string>>;
export type KdsTranslations = Partial<Record<Locale, KdsDictionary>>;
export type KdsTranslate = (key: KdsCopyKey, values?: Record<string, string | number>) => string;

export function isKdsCopyKey(key: string): key is KdsCopyKey {
  return Object.hasOwn(KDS_COPY, key);
}

export function copyPlaceholders(value: string): string[] {
  return [...new Set(value.match(/\{[a-zA-Z][a-zA-Z0-9_]*\}/g) ?? [])].sort();
}

export function hasMatchingPlaceholders(source: string, value: string): boolean {
  return JSON.stringify(copyPlaceholders(source)) === JSON.stringify(copyPlaceholders(value));
}

/** Only registered interface copy enters the browser; never arbitrary DB keys. */
export function selectKdsTranslations(rows: Pick<SiteTranslation, "locale" | "key" | "value">[]): KdsTranslations {
  const result: KdsTranslations = {};
  for (const row of rows) {
    if (isLocale(row.locale) && isKdsCopyKey(row.key) && row.value.trim() &&
      hasMatchingPlaceholders(KDS_COPY[row.key], row.value)) {
      (result[row.locale] ??= {})[row.key] = row.value;
    }
  }
  return result;
}

export function createKdsTranslator(dictionary: KdsDictionary = {}): KdsTranslate {
  return (key, values = {}) => {
    const source = KDS_COPY[key];
    const translated = dictionary[key];
    const text = translated?.trim() && hasMatchingPlaceholders(source, translated) ? translated : source;
    return text.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (token, name: string) =>
      Object.hasOwn(values, name) ? String(values[name]) : token
    );
  };
}
