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
  surface?: "marketing" | "kds";
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
  const parts = key.split(".");
  return parts[0] === "kds" ? parts[1] : parts[0] ?? key;
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
  surface = "marketing",
  englishSource,
  baselines,
  overrides,
}: SiteTranslationsEditorProps) {
  const [locale, setLocale] = useState<Locale>("rw");
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [, startTransition] = useTransition();

  // key → override value, per locale, kept in sync optimistically after saves.
  const [overrideMap, setOverrideMap] = useState<Record<string, Record<string, string>>>(
    () => {
      const map: Record<string, Record<string, string>> = {};
      for (const t of overrides) {
        if (Object.hasOwn(englishSource, t.key)) (map[t.locale] ??= {})[t.key] = t.value;
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
  const missing = (key: string) => locale !== "en" && !localeOverrides[key] && !localeBaseline[key];
  const missingCount = keys.filter(missing).length;

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
    if (pendingKey || !value || value === currentValue(key)) return;
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
        setDrafts((draft) => {
          const next = { ...draft };
          delete next[`${activeLocale}:${key}`];
          return next;
        });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      } finally {
        setPendingKey(null);
      }
    });
  }

  function reset(key: string) {
    if (pendingKey || !(key in localeOverrides)) return;
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

  const query = search.trim().toLocaleLowerCase();
  const visibleSections = sections.map(([section, sectionKeys]) => [section, sectionKeys.filter((key) =>
    (!missingOnly || missing(key)) && (!query || [key, englishSource[key], draftFor(key)].some((text) => text.toLocaleLowerCase().includes(query)))
  )] as const).filter(([, sectionKeys]) => sectionKeys.length > 0);

  return (
    <Card className="space-y-6 p-6" data-translation-surface={surface}>
      <div>
        <h2 className="font-medium text-ink">Languages — {surface === "kds" ? "KDS copy" : "marketing copy"}</h2>
        <p className="mt-1 text-xs text-muted">
          {surface === "kds"
            ? "Edit kitchen interface wording for all vendors. Saved changes appear after the KDS is refreshed. Missing translations use English. Reset restores the English wording. Menu names and customer details stay as entered."
            : "Edit marketing wording. Saved values override built-in translations. Reset restores the built-in wording."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {EDITABLE_LOCALES.map((l) => (
          <button
            key={l.code}
            type="button"
            aria-pressed={locale === l.code}
            disabled={pendingKey !== null}
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
          {overrideCount} override{overrideCount === 1 ? "" : "s"} saved · {missingCount} untranslated
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          aria-label={`Search ${surface === "kds" ? "KDS" : "marketing"} translations`}
          placeholder="Search wording or key"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink"
        />
        <label className="flex min-h-11 items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={missingOnly} onChange={(event) => setMissingOnly(event.target.checked)} />
          Untranslated only
        </label>
      </div>

      {surface === "kds" ? <p className="text-xs text-muted">Keep any {"{placeholders}"} exactly as shown. You can move them within the sentence.</p> : null}

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        {visibleSections.length === 0 ? <p className="text-sm text-muted" role="status">No wording matches these filters.</p> : null}
        {visibleSections.map(([section, sectionKeys]) => (
          <details
            key={section}
            open={query ? true : undefined}
            className="rounded-brand-md border border-hairline"
          >
            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink">
              {SECTION_LABELS[section] ?? section.replaceAll("-", " ")}{" "}
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
                          aria-label={`${locale} ${key}`}
                          placeholder={englishSource[key]}
                          disabled={pendingKey === key}
                          value={draft}
                          rows={2}
                          onChange={(e) => setDraft(key, e.target.value)}
                          className="w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                      ) : (
                        <input
                          aria-label={`${locale} ${key}`}
                          placeholder={englishSource[key]}
                          disabled={pendingKey === key}
                          value={draft}
                          onChange={(e) => setDraft(key, e.target.value)}
                          className="w-full rounded-brand-md border border-hairline-strong bg-surface-card px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                        />
                      )}
                      <Button
                        type="button"
                        variant="primary"
                        className="min-h-9 px-3 text-xs"
                        disabled={!dirty || !draft.trim() || pendingKey !== null}
                        onClick={() => save(key)}
                      >
                        {pendingKey === key ? "…" : "Save"}
                      </Button>
                      {overridden ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-9 px-3 text-xs"
                          disabled={pendingKey !== null}
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
