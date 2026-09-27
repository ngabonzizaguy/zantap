"use client";

import { useState, useTransition } from "react";
import { Button, Card, Input } from "@/components/ui/primitives";
import { updateCommissionSettingsAction } from "@/lib/ops-actions/commission-actions";
import type {
  CommissionSettings,
  UpdateCommissionSettingsInput,
} from "@/lib/momo/commission";

interface CommissionSettingsFormProps {
  settings: CommissionSettings;
}

export function CommissionSettingsForm({
  settings: initial,
}: CommissionSettingsFormProps) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [globalEnabled, setGlobalEnabled] = useState(initial.globalEnabled);

  const [form, setForm] = useState({
    globalDefaultPercent: initial.globalDefaultPercent,
    minimumOrderTotalRwf: initial.minimumOrderTotalRwf,
  });

  function handleSave() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const input: UpdateCommissionSettingsInput = {
          globalEnabled,
          globalDefaultPercent: form.globalDefaultPercent,
          minimumOrderTotalRwf: form.minimumOrderTotalRwf,
        };
        await updateCommissionSettingsAction(input);
        setSuccess(true);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Save failed");
      }
    });
  }

  return (
    <Card className="space-y-6 p-6">
      <div>
        <p className="font-medium text-ink">Commission settings</p>
        <p className="mt-1 text-xs text-muted">
          Global controls for Vendor commission and minimum order totals.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-hairline p-4">
        <div>
          <p className="text-sm font-medium text-ink">Enable commission</p>
          <p className="mt-1 text-xs text-muted">
            Master switch — when off, all Vendors pay 0% regardless of their
            individual settings.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={globalEnabled}
          onClick={() => setGlobalEnabled((value) => !value)}
          className={`relative h-7 w-12 flex-none rounded-full transition ${globalEnabled ? "bg-ink" : "bg-hairline-strong"}`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${globalEnabled ? "translate-x-6" : "translate-x-1"}`}
          />
          <span className="sr-only">{globalEnabled ? "On" : "Off"}</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Default commission percent"
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={form.globalDefaultPercent}
          placeholder="0"
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              globalDefaultPercent: parseFloat(e.target.value) || 0,
            }))
          }
        />
        <Input
          label="Minimum order total (RWF)"
          type="number"
          step="1"
          min="1"
          value={form.minimumOrderTotalRwf}
          placeholder="1000"
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              minimumOrderTotalRwf: parseInt(e.target.value, 10) || 1000,
            }))
          }
        />
      </div>

      <p className="text-xs text-muted">
        When commission is enabled, Vendors pay the default percent unless they
        have a custom override. Minimum order total applies to all checkouts.
      </p>

      {error ? (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
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
