import { describe, expect, it } from "vitest";
import { MARKETING_COPY } from "@/lib/marketing/copy";
import { flattenCopy, localizeTree, isTranslatableKey } from "@/lib/i18n/localize";
import { BASELINE_TRANSLATIONS } from "@/lib/i18n/baselines";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

describe("marketing copy localization", () => {
  const english = flattenCopy(MARKETING_COPY);

  it("flattens string leaves to dot paths, excluding asset/id keys", () => {
    expect(english["hero.headline"]).toBe(MARKETING_COPY.hero.headline);
    expect(english["offer.includes.0"]).toBe(MARKETING_COPY.offer.includes[0]);
    expect(english["stickyCta"]).toBe(MARKETING_COPY.stickyCta);
    // Asset paths and machine ids never become translation keys.
    expect(Object.keys(english).some((k) => /\.(src|icon|id)$/.test(k))).toBe(false);
  });

  it("applies a dictionary by dot path with English fallback", () => {
    const localized = localizeTree(MARKETING_COPY, {
      "hero.headline": "Umutwe",
      "offer.includes.1": "Ibindi",
    });
    expect(localized.hero.headline).toBe("Umutwe");
    expect(localized.offer.includes[1]).toBe("Ibindi");
    // Untranslated leaves keep English; non-strings pass through.
    expect(localized.hero.summary).toBe(MARKETING_COPY.hero.summary);
    expect(localized.product.kitchen.cards[0].width).toBe(
      MARKETING_COPY.product.kitchen.cards[0].width
    );
  });

  it("never rewrites asset paths even if a dictionary tries", () => {
    const localized = localizeTree(MARKETING_COPY, {
      "product.kitchen.cards.0.src": "/evil.png",
    });
    expect(localized.product.kitchen.cards[0].src).toBe(
      MARKETING_COPY.product.kitchen.cards[0].src
    );
    expect(isTranslatableKey("product.kitchen.cards.0.src")).toBe(false);
  });

  it("every baseline dictionary key exists in the English copy tree", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const dict = BASELINE_TRANSLATIONS[code];
      const unknown = Object.keys(dict).filter((key) => !(key in english));
      expect(unknown, `${code} has unknown keys`).toEqual([]);
    }
  });

  it("rw/fr/sw baselines cover the headline surfaces", () => {
    for (const code of ["rw", "fr", "sw"] as const) {
      const dict = BASELINE_TRANSLATIONS[code];
      for (const key of [
        "hero.headline",
        "leadForm.submit",
        "offer.cta",
        "stickyCta",
        "comparison.heading",
      ]) {
        expect(dict[key], `${code} missing ${key}`).toBeTruthy();
      }
    }
  });

  it("keeps the complete 140-key marketing contract translated", () => {
    expect(Object.keys(english)).toHaveLength(140);
    for (const code of ["rw", "fr", "sw"] as const) {
      const missing = Object.keys(english).filter(
        (key) => !BASELINE_TRANSLATIONS[code][key]
      );
      expect(missing, `${code} missing marketing keys`).toEqual([]);
    }
  });

  it("covers every one of the 33 Lead Form strings in all non-English locales", () => {
    const leadFormKeys = Object.keys(english).filter((key) =>
      key.startsWith("leadForm.")
    );
    expect(leadFormKeys).toHaveLength(33);
    for (const code of ["rw", "fr", "sw"] as const) {
      for (const key of leadFormKeys) {
        expect(BASELINE_TRANSLATIONS[code][key], `${code} missing ${key}`).toBeTruthy();
      }
    }
  });
});
