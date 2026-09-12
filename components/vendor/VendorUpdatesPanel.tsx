"use client";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { useState } from "react";
import {
  loadVendorUpdateOverview,
  setVendorUpdatesEnabled,
} from "@/lib/actions/vendor-updates";
import { formatRwf } from "@/lib/format";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import type { VendorUpdateOverview } from "@/lib/vendor-updates/types";
import { Button, Card } from "@/components/ui/primitives";

interface VendorUpdatesPanelProps {
  vendorSlug: string;
  initialOverview: VendorUpdateOverview;
  onUnlockEditing: () => void;
}

function entrySummary(entry: VendorUpdateOverview["activeBatch"] extends infer _T
  ? NonNullable<VendorUpdateOverview["activeBatch"]>["entries"][number]
  : never): string {
  if (entry.type === "PRICE_CHANGE") {
    return `${entry.name}: ${formatRwf(entry.oldPriceRwf ?? 0)} → ${formatRwf(entry.currentPriceRwf ?? 0)}`;
  }
  if (entry.type === "NEW_DISH") return `New dish: ${entry.name}`;
  if (entry.type === "DISH_RESTORED") return `Back on the menu: ${entry.name}`;
  if (entry.type === "DISH_IMAGE") return `New photos: ${entry.name}`;
  return entry.summary ?? `Updated ${entry.name}`;
}

export function VendorUpdatesPanel({
  vendorSlug,
  initialOverview,
  onUnlockEditing,
}: VendorUpdatesPanelProps) {
  const t = useKdsTranslation();
  const { token, ready } = useOwnerToken(vendorSlug);
  const [overview, setOverview] = useState(initialOverview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleEnabled = async () => {
    if (!token) {
      onUnlockEditing();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const next = await setVendorUpdatesEnabled(
        token,
        vendorSlug,
        !overview.settings.enabled
      );
      if (next) setOverview(next);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      if (message.toLowerCase().includes("owner token")) {
        setError("Unlock editing to change update settings.");
      } else {
        setError("We couldn't change restaurant updates. Try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      const next = await loadVendorUpdateOverview(vendorSlug);
      if (next) setOverview(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card padding="md" className="mb-5 bg-canvas/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-caption uppercase tracking-wide text-muted">{t("kds.vendor-updates-panel.customer-updates")}</p>
          <h2 className="mt-1 font-display text-display-sm text-ink">{t("kds.vendor-updates-panel.share-meaningful-menu-changes")}</h2>
          <p className="mt-1 max-w-xl font-body text-body-sm text-muted">{t("kds.vendor-updates-panel.new-dishes-prices-photos-and-storefront-details-are-grouped-for")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={overview.settings.enabled}
          disabled={busy || !ready}
          onClick={() => void toggleEnabled()}
          className="flex min-h-11 items-center gap-2 rounded-brand-pill border border-hairline-strong px-4 font-body text-body-sm font-medium text-ink"
        >
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${overview.settings.enabled ? "bg-success" : "bg-muted-soft"}`}
          />
          {overview.settings.enabled ? t("kds.vendor-updates-panel.updates-on") : t("kds.vendor-updates-panel.updates-off")}
        </button>
      </div>

      {ready && (!token || error === "Unlock editing to change update settings.") ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-brand-lg border border-hairline bg-surface-card p-4">
          <p className="font-body text-body-sm text-muted">{t("kds.vendor-updates-panel.unlock-editing-to-change-update-settings")}</p>
          <Button type="button" variant="outline" onClick={onUnlockEditing}>{t("kds.vendor-updates-panel.unlock-editing")}</Button>
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Batches", overview.totals.batches],
          ["Changes", overview.totals.revisions],
          ["Opens", overview.totals.opens],
          ["Menu visits", overview.totals.menuVisits],
        ].map(([label, value]) => (
          <div key={label} className="rounded-brand-lg bg-surface-card px-3 py-3">
            <p className="font-body text-caption text-muted">{label}</p>
            <p className="mt-1 font-display text-display-sm text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-brand-lg border border-hairline bg-surface-card p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-body text-body-sm font-medium text-ink">{t("kds.vendor-updates-panel.active-batch-preview")}</p>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void refresh()}>{t("kds.vendor-updates-panel.refresh")}</Button>
        </div>
        {overview.activeBatch ? (
          <ul className="mt-3 space-y-2">
            {overview.activeBatch.entries.map((entry) => (
              <li key={entry.id} className="font-body text-body-sm text-muted">
                {entrySummary(entry)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-body text-body-sm text-muted">{t("kds.vendor-updates-panel.no-active-customer-update-your-next-qualifying-save-publishes-im")}</p>
        )}
      </div>
      {error ? <p className="mt-3 font-body text-body-sm text-error" role="alert">{error}</p> : null}
    </Card>
  );
}
