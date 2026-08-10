"use client";

import { useState, useTransition } from "react";

import { Badge, Button, Card, Input } from "@/components/ui/primitives";
import type { LeadRoutingSettings } from "@/lib/leads/types";
import { patchLeadRoutingSettingsAction } from "@/lib/ops-actions/lead-actions";

interface LeadRoutingSettingsFormProps {
  settings: LeadRoutingSettings;
}

export function LeadRoutingSettingsForm({
  settings: initialSettings,
}: LeadRoutingSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialSettings.whatsappEnabled);
  const [phone, setPhone] = useState(initialSettings.whatsappPhone ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const updated = await patchLeadRoutingSettingsAction({
          whatsappEnabled: enabled,
          whatsappPhone: phone,
        });
        setEnabled(updated.whatsappEnabled);
        setPhone(updated.whatsappPhone ?? "");
        setSaved(true);
      } catch (caught) {
        setError(
          caught instanceof Error ? caught.message : "Could not save lead routing"
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-sm font-light tracking-tight text-ink">
          Lead routing
        </h1>
        <p className="mt-1 text-sm text-muted">
          Choose where new partner requests continue on WhatsApp.
        </p>
      </div>

      <Card className="max-w-2xl">
        <div className="flex flex-col gap-3 border-b border-hairline pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-body text-body-strong text-ink">
                WhatsApp handoff
              </h2>
              <Badge variant={enabled ? "success" : "muted"}>
                {enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              ZanTap always saves the Lead first. When enabled, the success state
              offers the partner a prefilled WhatsApp message to this number.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => {
                setEnabled(event.target.checked);
                setSaved(false);
              }}
              className="h-5 w-5 accent-ink"
            />
            <span>
              <span className="block text-sm font-medium text-ink">
                Offer WhatsApp after submission
              </span>
              <span className="block text-xs text-muted">
                The partner still reviews and taps Send in WhatsApp.
              </span>
            </span>
          </label>

          <Input
            id="lead-whatsapp-phone"
            label="Receiving WhatsApp number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+250 7XX XXX XXX"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setSaved(false);
            }}
            error={error ?? undefined}
          />
          <p className="-mt-3 text-xs text-muted">
            Include the country code. ZanTap stores the canonical international number.
          </p>

          {saved ? (
            <p role="status" className="rounded-brand-md bg-success/10 px-4 py-3 text-sm text-success">
              Lead routing settings saved.
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              className="min-h-11 w-full sm:w-auto"
              disabled={pending || (enabled && !phone.trim())}
              onClick={save}
            >
              {pending ? "Saving…" : "Save settings"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
