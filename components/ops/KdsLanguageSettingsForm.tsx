"use client";

import { useState, useTransition } from "react";
import { Button, Card } from "@/components/ui/primitives";
import { patchMarketingSiteSettingsAction } from "@/lib/ops-actions/marketing-settings-actions";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";
import { KDS_LANGUAGE_FLAGS } from "@/lib/i18n/kds-language-availability";
import type { MarketingSiteSettings } from "@/lib/vendor/feature-and-profit-types";

/**
 * Controls which interface languages kitchens can pick in the KDS header.
 * A switched-off language stays listed with a "Soon" badge; English is always
 * available because it is the fallback for untranslated copy.
 */
export function KdsLanguageSettingsForm({
  settings,
}: {
  settings: MarketingSiteSettings;
}) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    showKdsLanguageSelector: settings.showKdsLanguageSelector,
    kdsLanguageRw: settings.kdsLanguageRw,
    kdsLanguageFr: settings.kdsLanguageFr,
    kdsLanguageSw: settings.kdsLanguageSw,
  });

  function toggleRow(key: keyof typeof form, title: string, description: string) {
    const on = form[key];
    return (
      <div
        key={key}
        className="flex items-center justify-between gap-4 rounded-2xl border border-hairline p-4"
      >
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="mt-1 text-xs text-muted">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={title}
          onClick={() => {
            setSuccess(false);
            setForm((f) => ({ ...f, [key]: !on }));
          }}
          className={`relative h-7 w-12 flex-none rounded-full transition ${on ? "bg-ink" : "bg-hairline-strong"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-6" : "translate-x-1"}`}
          />
          <span className="sr-only">{on ? "On" : "Off"}</span>
        </button>
      </div>
    );
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await patchMarketingSiteSettingsAction(form);
        setSuccess(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      }
    });
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <p className="font-medium text-ink">KDS languages</p>
        <p className="mt-1 text-xs text-muted">
          Which languages kitchens can switch to in the KDS header. Kitchens see the
          change after they reload the dashboard.
        </p>
      </div>

      <div className="space-y-3">
        {toggleRow(
          "showKdsLanguageSelector",
          "Show the language selector",
          "Off hides the selector and keeps every kitchen in English."
        )}
        {SUPPORTED_LOCALES.filter((locale) => locale.code !== "en").map((locale) =>
          toggleRow(
            KDS_LANGUAGE_FLAGS[locale.code as keyof typeof KDS_LANGUAGE_FLAGS],
            locale.label,
            form.showKdsLanguageSelector
              ? "Off lists it with a Soon badge that kitchens cannot select."
              : "The selector is hidden, so this has no effect yet."
          )
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-600">Languages saved.</p>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="min-h-11"
        disabled={pending}
        onClick={handleSave}
      >
        Save languages
      </Button>
    </Card>
  );
}
