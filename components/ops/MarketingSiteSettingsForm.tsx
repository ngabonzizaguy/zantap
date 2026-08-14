"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input } from "@/components/ui/primitives";
import { patchMarketingSiteSettingsAction } from "@/lib/ops-actions/marketing-settings-actions";
import type {
  MarketingSiteSettings,
  UpdateMarketingSiteSettingsInput,
} from "@/lib/vendor/feature-and-profit-types";

interface MarketingSiteSettingsFormProps {
  settings: MarketingSiteSettings;
}

export function MarketingSiteSettingsForm({
  settings: initial,
}: MarketingSiteSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    publicPhone: initial.publicPhone ?? "",
    publicEmail: initial.publicEmail ?? "",
    socialX: initial.socialX ?? "",
    socialTiktok: initial.socialTiktok ?? "",
    socialInstagram: initial.socialInstagram ?? "",
    socialFacebook: initial.socialFacebook ?? "",
    socialLinkedin: initial.socialLinkedin ?? "",
    socialYoutube: initial.socialYoutube ?? "",
    socialWhatsapp: initial.socialWhatsapp ?? "",
  });

  function field(key: keyof typeof form, label: string, placeholder: string) {
    return (
      <Input
        label={label}
        value={form[key]}
        placeholder={placeholder}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    );
  }

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const input: UpdateMarketingSiteSettingsInput = {};
        for (const [key, value] of Object.entries(form)) {
          const trimmed = value.trim();
          (input as Record<string, string | null>)[key] = trimmed || null;
        }
        await patchMarketingSiteSettingsAction(input);
        setSuccess(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      }
    });
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <p className="font-medium text-ink">Marketing site settings</p>
        <p className="mt-1 text-xs text-muted">
          Public contact info and social links shown on the marketing page footer. Leave blank to hide.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {field("publicPhone", "Public phone", "+250 7XX XXX XXX")}
        {field("publicEmail", "Public email", "hello@zantap.app")}
      </div>

      <p className="text-xs font-medium text-muted">Social links</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {field("socialWhatsapp", "WhatsApp", "https://wa.me/250…")}
        {field("socialInstagram", "Instagram", "https://instagram.com/zantap")}
        {field("socialX", "X (Twitter)", "https://x.com/zantap")}
        {field("socialTiktok", "TikTok", "https://tiktok.com/@zantap")}
        {field("socialFacebook", "Facebook", "https://facebook.com/zantap")}
        {field("socialLinkedin", "LinkedIn", "https://linkedin.com/company/zantap")}
        {field("socialYoutube", "YouTube", "https://youtube.com/@zantap")}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-error">{error}</p>
      ) : null}
      {success ? (
        <p className="text-sm text-emerald-600">Settings saved.</p>
      ) : null}

      <Button
        type="button"
        variant="primary"
        className="min-h-11"
        disabled={pending}
        onClick={handleSave}
      >
        Save settings
      </Button>
    </Card>
  );
}
