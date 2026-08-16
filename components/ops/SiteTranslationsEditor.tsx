"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Card } from "@/components/ui/primitives";
import {
  deleteSiteTranslationAction,
  saveSiteTranslationAction,
} from "@/lib/ops-actions/site-translation-actions";
import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n/config";
import type { SiteTranslation } from "@/lib/i18n/site-translation-types";

/**
 * Word-for-word marketing copy editor (Ops → Settings → Languages).
 * Every translatable string on the marketing page is listed by key with its
 * English source. Per locale, the shown value = owner override (DB) →
 * in-repo baseline translation → English. Saving writes an override through
 * the Store seam; Reset deletes the override and restores the baseline.
 */

interface SiteTranslationsEditorProps {
  /** dot-path key → English source text (defines the editable key set). */
  englishSource: Record<string, string>;
  /** locale → key → in-repo baseline translation. */
  baselines: Record<string, Record<string, string>>;
  /** Current DB overrides across all locales. */
  overrides: SiteTranslation[];
}

// rw/fr/sw first (the translation work), English last (fine-tune originals).
const EDITABLE_LOCALES: { code: Locale; label: string }[] = [
  ...SUPPORTED_LOCALES.filter((l) => l.code !== "en"),
  ...SUPPORTED_LOCALES.filter((l) => l.code === "en"),
];

function sectionOf(key: string): string {
  return key.split(".")[0] ?? key;
}

const SECTION_LABELS: Record<string, string> = {
  meta: "Page title & SEO",
  nav: "Navigation",
  hero: "Hero",
  leadForm: "Lead form",
  howItWorks: "What happens next",
  product: "Product sections",
  scrollWorld: "Scroll walkthrough",
  comparison: "Comparison",
  offer: "Offer",
  close: "Closing",
  footer: "Footer",
  stickyCta: "Sticky button",
};

export function SiteTranslationsEditor({
  englishSource,
  baselines,
  overrides,
}: SiteTranslationsEditorProps) {
  const [locale, setLocale] = useState<Locale>("rw");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // key → override value, per locale, kept in sync optimistically after saves.
  const [overrideMap, setOverrideMap] = useState<Record<string, Record<string, string>>>(
    () => {
      const map: Record<string, Record<string, string>> = {};
      for (const t of overrides) {
        (map[t.locale] ??= {})[t.key] = t.value;
      }
      return map;
    }
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const keys = useMemo(() => Object.keys(englishSource), [englishSource]);
  const sections = useMemo(() => {
    const grouped = new Map<string, string[]>();
    for (const key of keys) {
      const section = sectionOf(key);
      const list = grouped.get(section) ?? [];
      list.push(key);
      grouped.set(section, list);
    }
    return [...grouped.entries()];
  }, [keys]);

  const localeBaseline = baselines[locale] ?? {};
  const localeOverrides = overrideMap[locale] ?? {};
  const overrideCount = Object.keys(localeOverrides).length;

  function currentValue(key: string): string {
    return (
      localeOverrides[key] ??
      localeBaseline[key] ??
      (locale === "en" ? englishSource[key] ?? "" : "")
    );
  }

  function draftFor(key: string): string {
    const draftKey = `${locale}:${key}`;
    return drafts[draftKey] ?? currentValue(key);
  }

  function setDraft(key: string, value: string) {
    setDrafts((d) => ({ ...d, [`${locale}:${key}`]: value }));
  }

  function save(key: string) {
    const value = draftFor(key).trim();
    if (!value || value === currentValue(key)) return;
    setError(null);
    setPendingKey(key);
    const activeLocale = locale;
    startTransition(async () => {
      try {
        await saveSiteTranslationAction(activeLocale, key, value);
        setOverrideMap((m) => ({
          ...m,
          [activeLocale]: { ...(m[activeLocale] ?? {}), [key]: value },
        }));
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  function reset(key: string) {
    if (!(key in localeOverrides)) return;
    setError(null);
    setPendingKey(key);
    const activeLocale = locale;
    startTransition(async () => {
      try {
        await deleteSiteTranslationAction(activeLocale, key);
        setOverrideMap((m) => {
          const next = { ...(m[activeLocale] ?? {}) };
          delete next[key];
          return { ...m, [activeLocale]: next };
        });
        setDrafts((d) => {
          const next = { ...d };
          delete next[`${activeLocale}:${key}`];
          return next;
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Reset failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <p className="font-medium text-ink">Languages — marketing copy</p>
        <p className="mt-1 text-xs text-muted">
          Word-for-word control of every string on the marketing page. Values
          start from the built-in translation; anything you save here overrides
          it immediately. Reset restores the built-in wording.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {EDITABLE_LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLocale(l.code)}
            className={
              locale === l.code
                ? "rounded-pill bg-ink px-4 py-2 text-sm font-medium text-white"
                : "rounded-pill border border-hairline px-4 py-2 text-sm text-muted hover:text-ink"
            }
          >
            {l.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted">
          {overrideCount} override{overrideCount === 1 ? "" : "s"} saved
        </span>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {sections.map(([section, sectionKeys]) => (
          <details
            key={section}
            className="rounded-brand-md border border-hairline"
          >
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink">
              {SECTION_LABELS[section] ?? section}{" "}
              <span className="text-xs font-normal text-muted">
                ({sectionKeys.length})
              </span>
            </summary>
            <div className="space-y-4 border-t border-hairline px-4 py-4">
              {sectionKeys.map((key) => {
                const overridden = key in localeOverrides;
                const draft = draftFor(key);
                const dirty = draft.trim() !== currentValue(key);
                const long = (englishSource[key] ?? "").length > 60;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-mono text-[11px] text-muted-soft">
                        {key}
                        {overridden ? (
                          <span className="ml-2 rounded-pill bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-ink">
                            overridden
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {locale !== "en" ? (
                      <p className="text-xs text-muted">{englishSource[key]}</p>
                    ) : null}
                    <div className="flex items-start gap-2">
                      {long ? (
                        <textarea
                          value={draft}
                          rows={2}
                          onChange={(e) => setDraft(key, e.target.value)}
                          className="w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                      ) : (
                        <input
                          value={draft}
                          onChange={(e) => setDraft(key, e.target.value)}
                          className="w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                      )}
                      <Button
                        type="button"
                        variant="primary"
                        className="min-h-9 px-3 text-xs"
                        disabled={!dirty || pendingKey === key}
                        onClick={() => save(key)}
                      >
                        {pendingKey === key ? "…" : "Save"}
                      </Button>
                      {overridden ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-9 px-3 text-xs"
                          disabled={pendingKey === key}
                          onClick={() => reset(key)}
                        >
                          Reset
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}
