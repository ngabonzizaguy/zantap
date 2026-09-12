"use client";

import { translateKdsLabel } from "@/lib/i18n/kds-labels";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adjustInventoryItem,
  archiveInventoryItem,
  createInventoryItem,
  loadInventory,
  loadInventoryItem,
  restoreInventoryItem,
  updateInventoryItem,
} from "@/lib/actions/vendor-inventory";
import {
  INVENTORY_CATEGORIES,
  INVENTORY_STANDARD_UNITS,
  type InventoryAdjustmentType,
  type InventoryCategory,
  type InventoryItem,
  type InventoryItemDetail,
  type InventoryUnitInput,
  type PaginatedInventory,
} from "@/lib/inventory/types";
import { inventoryStatus } from "@/lib/inventory/validation";
import { formatRwf } from "@/lib/format";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { Button, Card, Input, Modal, Select } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface InventoryPanelProps {
  vendorSlug: string;
  initialResult: PaginatedInventory;
  initialQuery: {
    page: number;
    search: string;
    category: InventoryCategory | "ALL";
    archived: boolean;
  };
  onActiveCountChange: (count: number) => void;
  onUnlockEditing: () => void;
}

interface ItemFormState {
  name: string;
  quantity: string;
  unit: InventoryUnitInput;
  customUnit: string;
  lowStockThreshold: string;
  category: InventoryCategory;
  unitCostRwf: string;
  note: string;
}

interface AdjustmentState {
  item: InventoryItem;
  type: InventoryAdjustmentType;
  quantity: string;
  note: string;
}

const CATEGORY_OPTIONS = [
  { value: "ALL", label: "All categories" },
  ...INVENTORY_CATEGORIES.map((category) => ({ value: category, label: category })),
] as const;

const FORM_CATEGORY_OPTIONS = INVENTORY_CATEGORIES.map((category) => ({
  value: category,
  label: category,
}));

const UNIT_OPTIONS: { value: InventoryUnitInput; label: string }[] = [
  ...INVENTORY_STANDARD_UNITS.map((unit) => ({ value: unit, label: unit })),
  { value: "custom", label: "Custom unit" },
];

const ADJUSTMENT_OPTIONS = [
  { value: "RECEIVED", label: "Received" },
  { value: "USED", label: "Used" },
  { value: "WASTED", label: "Wasted" },
  { value: "CORRECTION", label: "Correction" },
] as const;

const EMPTY_FORM: ItemFormState = {
  name: "",
  quantity: "0",
  unit: "pieces",
  customUnit: "",
  lowStockThreshold: "0",
  category: "Ingredients",
  unitCostRwf: "",
  note: "",
};

function itemForm(item: InventoryItem): ItemFormState {
  const standard = INVENTORY_STANDARD_UNITS.find((unit) => unit === item.unit);
  return {
    name: item.name,
    quantity: String(item.quantity),
    unit: standard ?? "custom",
    customUnit: standard ? "" : item.unit,
    lowStockThreshold: String(item.lowStockThreshold),
    category: item.category,
    unitCostRwf: item.unitCostRwf == null ? "" : String(item.unitCostRwf),
    note: item.note ?? "",
  };
}

function parseNonNegative(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be zero or more`);
  }
  return parsed;
}

function displayQuantity(quantity: number): string {
  return new Intl.NumberFormat("en-RW", { maximumFractionDigits: 3 }).format(quantity);
}

const INVENTORY_ACCESS_MESSAGE = "Unlock editing to change inventory.";

function inventoryActionError(cause: unknown, fallback: string): string {
  const message = cause instanceof Error ? cause.message : fallback;
  return message.toLowerCase().includes("owner token")
    ? INVENTORY_ACCESS_MESSAGE
    : message;
}

export function InventoryPanel({
  vendorSlug,
  initialResult,
  initialQuery,
  onActiveCountChange,
  onUnlockEditing,
}: InventoryPanelProps) {
  const t = useKdsTranslation();
  const { token: ownerToken } = useOwnerToken(vendorSlug);
  const [result, setResult] = useState(initialResult);
  const [search, setSearch] = useState(initialQuery.search);
  const [category, setCategory] = useState<InventoryCategory | "ALL">(initialQuery.category);
  const [archived, setArchived] = useState(initialQuery.archived);
  const [page, setPage] = useState(initialResult.page);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState<InventoryItem | "create" | null>(null);
  const [form, setForm] = useState<ItemFormState>(EMPTY_FORM);
  const [adjusting, setAdjusting] = useState<AdjustmentState | null>(null);
  const [history, setHistory] = useState<InventoryItemDetail | null>(null);

  const pageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
  const canWrite = Boolean(ownerToken) && online && !saving;

  const refresh = useCallback(
    async (requestedPage = page) => {
      setLoading(true);
      setError(null);
      try {
        const next = await loadInventory(
          vendorSlug,
          { search, category, archived },
          { page: requestedPage, pageSize: 10 }
        );
        setResult(next);
        setPage(next.page);
        onActiveCountChange(next.counts.active);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not load inventory");
      } finally {
        setLoading(false);
      }
    }, [archived, category, onActiveCountChange, page, search, vendorSlug]
  );

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(page), 180);
    return () => window.clearTimeout(timer);
  }, [archived, category, page, search, refresh]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "inventory");
    if (page > 1) url.searchParams.set("inventoryPage", String(page));
    else url.searchParams.delete("inventoryPage");
    if (search.trim()) url.searchParams.set("inventorySearch", search.trim());
    else url.searchParams.delete("inventorySearch");
    if (category !== "ALL") url.searchParams.set("inventoryCategory", category);
    else url.searchParams.delete("inventoryCategory");
    if (archived) url.searchParams.set("inventoryArchived", "1");
    else url.searchParams.delete("inventoryArchived");
    window.history.replaceState(null, "", url);
  }, [archived, category, page, search]);

  const startCreate = () => {
    setEditing("create");
    setForm(EMPTY_FORM);
    setError(null);
  };

  const startEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm(itemForm(item));
    setError(null);
  };

  const saveItem = async () => {
    if (!ownerToken || !editing || !online) return;
    setSaving(true);
    setError(null);
    try {
      const lowStockThreshold = parseNonNegative(
        form.lowStockThreshold,
        "Low-stock threshold"
      );
      const unitCostRwf = form.unitCostRwf.trim()
        ? parseNonNegative(form.unitCostRwf, "Unit cost")
        : undefined;
      if (editing === "create") {
        await createInventoryItem(ownerToken, vendorSlug, {
          name: form.name,
          quantity: parseNonNegative(form.quantity, "Quantity"),
          unit: form.unit,
          customUnit: form.customUnit,
          lowStockThreshold,
          category: form.category,
          unitCostRwf,
          note: form.note,
        });
        setSuccess("Inventory item added");
      } else {
        await updateInventoryItem(ownerToken, vendorSlug, editing.id, {
          name: form.name,
          unit: form.unit,
          customUnit: form.customUnit,
          lowStockThreshold,
          category: form.category,
          unitCostRwf: unitCostRwf ?? null,
          note: form.note,
        });
        setSuccess("Inventory item saved");
      }
      setEditing(null);
      await refresh(editing === "create" ? 1 : page);
    } catch (cause) {
      setError(inventoryActionError(cause, "Could not save inventory item"));
    } finally {
      setSaving(false);
    }
  };

  const saveAdjustment = async () => {
    if (!ownerToken || !adjusting || !online) return;
    setSaving(true);
    setError(null);
    try {
      await adjustInventoryItem(ownerToken, vendorSlug, adjusting.item.id, {
        type: adjusting.type,
        quantity: parseNonNegative(adjusting.quantity, "Quantity"),
        note: adjusting.note,
      });
      setAdjusting(null);
      setSuccess("Stock quantity updated");
      await refresh(page);
    } catch (cause) {
      setError(inventoryActionError(cause, "Could not adjust stock"));
    } finally {
      setSaving(false);
    }
  };

  const toggleArchive = async (item: InventoryItem) => {
    if (!ownerToken || !online) return;
    setSaving(true);
    setError(null);
    try {
      if (item.archivedAt) {
        await restoreInventoryItem(ownerToken, vendorSlug, item.id);
        setSuccess(`${item.name} restored`);
      } else {
        await archiveInventoryItem(ownerToken, vendorSlug, item.id);
        setSuccess(`${item.name} archived`);
      }
      await refresh(page);
    } catch (cause) {
      setError(inventoryActionError(cause, "Could not update item"));
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async (item: InventoryItem) => {
    setLoading(true);
    setError(null);
    try {
      setHistory(await loadInventoryItem(vendorSlug, item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = useMemo(
    () => t("kds.inventory.alert-counts", { out: result.counts.out, low: result.counts.low }),
    [result.counts.low, result.counts.out, t]
  );

  return (
    <div className="flex flex-col gap-4 pb-24" aria-busy={loading}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-display-sm text-ink">{t("kds.inventory-panel.inventory")}</h2>
          <p className="mt-1 font-body text-body-sm text-muted">{t("kds.inventory-panel.supplies-only-dishes-and-availability-stay-in-menu")}</p>
        </div>
        <Button size="default" className="flex-none" onClick={startCreate} disabled={!canWrite}>{t("kds.inventory-panel.add-item")}</Button>
      </div>

      <div className="grid grid-cols-3 gap-2" aria-label={t("kds.inventory-panel.inventory-summary")}>
        <Card padding="sm" className="shadow-none">
          <p className="font-body text-caption text-muted">{t("kds.inventory-panel.active")}</p>
          <p className="mt-1 font-display text-display-sm text-ink">{result.counts.active}</p>
        </Card>
        <Card padding="sm" className="border-amber-500/30 bg-amber-500/10 shadow-none">
          <p className="font-body text-caption text-amber-300">{t("kds.inventory-panel.low")}</p>
          <p className="mt-1 font-display text-display-sm text-amber-200">{result.counts.low}</p>
        </Card>
        <Card padding="sm" className="border-red-500/30 bg-red-500/10 shadow-none">
          <p className="font-body text-caption text-red-300">{t("kds.inventory-panel.out")}</p>
          <p className="mt-1 font-display text-display-sm text-red-200">{result.counts.out}</p>
        </Card>
      </div>

      {(result.counts.low > 0 || result.counts.out > 0) && !archived ? (
        <Card padding="sm" className="border-amber-500/30 bg-amber-500/10 shadow-none" role="status">
          <p className="font-body text-body-sm font-medium text-amber-100">{t("kds.inventory-panel.stock-alert")}{" "}{statusLabel}{t("kds.inventory-panel.open-an-item-to-record-what-was-received-or-used")}</p>
        </Card>
      ) : null}

      {!online ? (
        <p className="rounded-brand-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 font-body text-body-sm text-amber-100" role="status">{t("kds.inventory-panel.inventory-is-online-only-reconnect-to-view-or-update-stock")}</p>
      ) : null}
      {!ownerToken || error === INVENTORY_ACCESS_MESSAGE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-brand-lg border border-hairline bg-surface-card p-4" role="status">
          <p className="font-body text-body-sm text-muted">
            {INVENTORY_ACCESS_MESSAGE}
          </p>
          <Button type="button" variant="outline" onClick={onUnlockEditing}>{t("kds.inventory-panel.unlock-editing")}</Button>
        </div>
      ) : null}
      {error && !editing && !adjusting ? (
        <p className="font-body text-body-sm text-error" role="alert">{error}</p>
      ) : null}
      {success ? <p className="font-body text-body-sm text-success" role="status">{success}</p> : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_190px]">
        <Input
          label={t("kds.inventory-panel.search-inventory")}
          type="search"
          value={search}
          placeholder={t("kds.inventory-panel.rice-bottles-boxes")}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          label={t("kds.inventory-panel.category")}
          value={category}
          options={CATEGORY_OPTIONS.map((option) => ({ ...option, label: translateKdsLabel(t, option.label) }))}
          onChange={(next) => {
            setCategory(next);
            setPage(1);
          }}
        />
      </div>

      <button
        type="button"
        aria-pressed={archived}
        onClick={() => {
          setArchived((value) => !value);
          setPage(1);
        }}
        className="min-h-11 self-start rounded-pill border border-hairline-strong px-4 font-body text-body-sm font-medium text-ink"
      >
        {archived ? t("kds.inventory-panel.show-active-inventory") : t("kds.inventory-panel.view-archived-items")}
      </button>

      {result.items.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-body text-body-md text-ink">
            {archived ? t("kds.inventory-panel.no-archived-inventory-items") : t("kds.inventory-panel.no-inventory-items-match-this-view")}
          </p>
          {!archived ? (
            <p className="mt-1 font-body text-body-sm text-muted">{t("kds.inventory-panel.add-a-supply-such-as-rice-tomato-sauce-or-takeaway-boxes")}</p>
          ) : null}
        </Card>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {result.items.map((item) => {
            const status = inventoryStatus(item.quantity, item.lowStockThreshold);
            return (
              <li key={item.id}>
                <Card
                  padding="sm"
                  className={cn(
                    "shadow-none",
                    status === "OUT" && "border-red-500/40 bg-red-500/10",
                    status === "LOW" && "border-amber-500/40 bg-amber-500/10"
                  )}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-body text-body-md font-medium text-ink">{item.name}</p>
                        {status !== "OK" ? (
                          <span className={cn(
                            "rounded-pill px-2 py-0.5 font-body text-caption font-medium",
                            status === "OUT" ? "bg-red-500/20 text-red-200" : "bg-amber-500/20 text-amber-100"
                          )}>
                            {status === "OUT" ? t("kds.inventory-panel.out") : t("kds.inventory-panel.low")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 font-body text-body-sm text-muted">
                        <span className="font-medium text-ink">{displayQuantity(item.quantity)} {item.unit}</span>
                        {" · "}{item.category}{" · "}{t("kds.inventory-panel.low-at")}{" "}{displayQuantity(item.lowStockThreshold)}
                      </p>
                      {item.unitCostRwf != null ? (
                        <p className="mt-1 font-body text-caption text-muted">{t("kds.inventory-panel.reference-cost")}{" "}{formatRwf(item.unitCostRwf)}{" "}{t("kds.inventory-panel.per")}{" "}{item.unit}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-none">
                      {!item.archivedAt ? (
                        <Button
                          size="default"
                          onClick={() => setAdjusting({ item, type: "RECEIVED", quantity: "", note: "" })}
                          disabled={!canWrite}
                        >{t("kds.inventory-panel.adjust")}</Button>
                      ) : null}
                      <Button variant="outline" size="default" onClick={() => startEdit(item)} disabled={!canWrite}>{t("kds.inventory-panel.edit")}</Button>
                      <Button variant="outline" size="default" onClick={() => void openHistory(item)}>{t("kds.inventory-panel.history")}</Button>
                      <Button variant="outline" size="default" onClick={() => void toggleArchive(item)} disabled={!canWrite}>
                        {item.archivedAt ? t("kds.inventory-panel.restore") : t("kds.inventory-panel.archive")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="flex items-center justify-between gap-3" aria-label={t("kds.inventory-panel.inventory-pages")}>
        <Button variant="outline" disabled={loading || result.page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>{t("kds.inventory-panel.previous")}</Button>
        <span className="font-body text-body-sm text-muted">{t("kds.counts.page", { page: result.page, pages: pageCount })}</span>
        <Button variant="outline" disabled={loading || result.page >= pageCount} onClick={() => setPage((value) => value + 1)}>{t("kds.inventory-panel.next")}</Button>
      </nav>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "create" ? t("kds.inventory-panel.add-inventory-item") : t("kds.inventory-panel.edit-inventory-item")}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="kds" className="flex-1" onClick={() => setEditing(null)} disabled={saving}>{t("kds.inventory-panel.cancel")}</Button>
            <Button size="kds" className="flex-1" onClick={() => void saveItem()} disabled={!canWrite}>{saving ? t("kds.inventory-panel.saving") : t("kds.inventory-panel.save")}</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <Input label={t("kds.inventory-panel.item-name")} value={form.name} onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} placeholder={t("kds.inventory-panel.e-g-rice")} />
          {editing === "create" ? (
            <Input label={t("kds.inventory-panel.opening-quantity")} type="number" inputMode="decimal" min="0" step="any" value={form.quantity} onChange={(event) => setForm((value) => ({ ...value, quantity: event.target.value }))} />
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label={t("kds.inventory-panel.unit")} value={form.unit} options={UNIT_OPTIONS.map((option) => ({ ...option, label: translateKdsLabel(t, option.label) }))} onChange={(unit) => setForm((value) => ({ ...value, unit }))} />
            {form.unit === "custom" ? (
              <Input label={t("kds.inventory-panel.custom-unit")} value={form.customUnit} onChange={(event) => setForm((value) => ({ ...value, customUnit: event.target.value }))} placeholder={t("kds.inventory-panel.e-g-jerrycans")} />
            ) : null}
            <Input label={t("kds.inventory-panel.low-stock-alert")} type="number" inputMode="decimal" min="0" step="any" value={form.lowStockThreshold} onChange={(event) => setForm((value) => ({ ...value, lowStockThreshold: event.target.value }))} />
            <Select label={t("kds.inventory-panel.category")} value={form.category} options={FORM_CATEGORY_OPTIONS.map((option) => ({ ...option, label: translateKdsLabel(t, option.label) }))} onChange={(next) => setForm((value) => ({ ...value, category: next }))} />
            <Input label={t("kds.inventory-panel.unit-cost-rwf-optional")} type="number" inputMode="numeric" min="0" step="1" value={form.unitCostRwf} onChange={(event) => setForm((value) => ({ ...value, unitCostRwf: event.target.value }))} />
          </div>
          <label className="flex flex-col gap-1.5 font-body text-body-sm font-medium text-ink">{t("kds.inventory-panel.note-optional")}<textarea className="min-h-24 rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none" value={form.note} onChange={(event) => setForm((value) => ({ ...value, note: event.target.value }))} />
          </label>
          {error ? <p role="alert" className="font-body text-body-sm text-error">{error}</p> : null}
        </div>
      </Modal>

      <Modal
        open={adjusting !== null}
        onClose={() => setAdjusting(null)}
        title={adjusting ? t("kds.inventory-panel.adjust-value1", { value1: adjusting.item.name }) : t("kds.inventory-panel.adjust-stock")}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" size="kds" className="flex-1" onClick={() => setAdjusting(null)} disabled={saving}>{t("kds.inventory-panel.cancel")}</Button>
            <Button size="kds" className="flex-1" onClick={() => void saveAdjustment()} disabled={!canWrite}>{saving ? t("kds.inventory-panel.saving") : t("kds.inventory-panel.record")}</Button>
          </div>
        }
      >
        {adjusting ? (
          <div className="flex flex-col gap-4">
            <p className="font-body text-body-sm text-muted">{t("kds.inventory-panel.current")}{" "}{displayQuantity(adjusting.item.quantity)} {adjusting.item.unit}{t("kds.inventory-panel.used-and-wasted-cannot-take-stock-below-zero")}</p>
            <Select label={t("kds.inventory-panel.change")} value={adjusting.type} options={ADJUSTMENT_OPTIONS.map((option) => ({ ...option, label: translateKdsLabel(t, option.label) }))} onChange={(type) => setAdjusting((value) => value ? { ...value, type } : null)} />
            <Input
              label={adjusting.type === "CORRECTION" ? t("kds.inventory-panel.correct-stock-count") : t("kds.inventory-panel.quantity")}
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={adjusting.quantity}
              onChange={(event) => setAdjusting((value) => value ? { ...value, quantity: event.target.value } : null)}
            />
            <label className="flex flex-col gap-1.5 font-body text-body-sm font-medium text-ink">{t("kds.inventory-panel.note-optional")}<textarea className="min-h-20 rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none" value={adjusting.note} onChange={(event) => setAdjusting((value) => value ? { ...value, note: event.target.value } : null)} />
            </label>
            {error ? <p role="alert" className="font-body text-body-sm text-error">{error}</p> : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={history !== null} onClose={() => setHistory(null)} title={history ? t("kds.inventory-panel.value1-history", { value1: history.item.name }) : t("kds.inventory-panel.inventory-history")}>
        {history ? (
          <ol className="flex flex-col gap-3">
            {history.history.map((entry) => (
              <li key={entry.id} className="rounded-brand-lg border border-hairline bg-canvas-soft px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-body text-body-md font-medium text-ink">
                    {translateKdsLabel(t, ADJUSTMENT_OPTIONS.find((option) => option.value === entry.type)?.label ?? entry.type)}
                  </p>
                  <time className="font-body text-caption text-muted" dateTime={entry.createdAt.toISOString()}>
                    {entry.createdAt.toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                <p className="mt-1 font-body text-body-sm text-muted">
                  {displayQuantity(entry.oldQuantity)} → {displayQuantity(entry.newQuantity)} {history.item.unit}
                </p>
                {entry.note ? <p className="mt-1 font-body text-body-sm text-ink">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        ) : null}
      </Modal>
    </div>
  );
}
