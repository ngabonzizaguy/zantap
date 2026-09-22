import { describe, expect, it } from "vitest";
import { KDS_BASELINE_TRANSLATIONS } from "@/lib/i18n/kds-baselines";
import { KDS_COPY, type KdsCopyKey } from "@/lib/i18n/kds-copy";
import { hasMatchingPlaceholders, isKdsCopyKey } from "@/lib/i18n/kds-localize";

const TRANSLATED_LOCALES = ["rw", "fr", "sw"] as const;

describe("KDS baseline dictionaries", () => {
  it("English has no baseline — it is the fallback source", () => {
    expect(KDS_BASELINE_TRANSLATIONS.en).toEqual({});
  });

  it("covers every registered KDS copy key in rw/fr/sw", () => {
    const keys = Object.keys(KDS_COPY);
    expect(keys).toHaveLength(684);
    for (const locale of TRANSLATED_LOCALES) {
      const dict = KDS_BASELINE_TRANSLATIONS[locale];
      const missing = keys.filter((key) => !dict[key]?.trim());
      expect(missing, `${locale} is missing ${missing.length} keys`).toEqual([]);
    }
  });

  it("uses only registered keys", () => {
    for (const locale of TRANSLATED_LOCALES) {
      const unknown = Object.keys(KDS_BASELINE_TRANSLATIONS[locale]).filter(
        (key) => !isKdsCopyKey(key)
      );
      expect(unknown, `${locale} has unknown keys`).toEqual([]);
    }
  });

  it("keeps every {placeholder} from the English source", () => {
    for (const locale of TRANSLATED_LOCALES) {
      const dict = KDS_BASELINE_TRANSLATIONS[locale];
      const drifted = Object.keys(dict).filter(
        (key) => !hasMatchingPlaceholders(KDS_COPY[key as KdsCopyKey], dict[key])
      );
      expect(drifted, `${locale} placeholder drift`).toEqual([]);
    }
  });

  it("translates the wording kitchens read most", () => {
    const samples: KdsCopyKey[] = [
      "kds.tabs.orders",
      "kds.status.ready",
      "kds.order-ticket.mark-completed",
      "kds.metrics-banner.open",
      "kds.setup-drawer.save-profile",
    ];
    for (const locale of TRANSLATED_LOCALES) {
      for (const key of samples) {
        const value = KDS_BASELINE_TRANSLATIONS[locale][key];
        expect(value, `${locale} missing ${key}`).toBeTruthy();
        expect(value).not.toBe(KDS_COPY[key]);
      }
    }
  });
});
