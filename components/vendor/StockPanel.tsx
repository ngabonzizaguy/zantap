"use client";

import { useCallback, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { formatRwf } from "@/lib/format";
import { updateMenuItemStock } from "@/lib/actions/vendor-stock";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { Icon } from "@/components/ui/Icon";
import { Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface StockPanelProps {
  vendorSlug: string;
  items: MenuItem[];
  onRefresh: () => Promise<void>;
}

interface StockEdit {
  itemId: string;
  stockCount: string;
  lowStockThreshold: string;
  costPriceRwf: string;
}

function parseIntOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed === "") return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseFloatOrNull(v: string): number | null {
  const trimmed = v.trim();
  if (trimmed === "") return null;
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function StockPanel({
  vendorSlug,
  items,
  onRefresh,
}: StockPanelProps) {
  const { token: ownerToken } = useOwnerToken(vendorSlug);
  const [editing, setEditing] = useState<StockEdit | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  const lowStockItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.stockCount != null &&
          item.stockCount <= (item.lowStockThreshold ?? 0)
      ),
    [items]
  );

  const startEdit = useCallback((item: MenuItem) => {
    setEditing({
      itemId: item.id,
      stockCount: item.stockCount != null ? String(item.stockCount) : "",
      lowStockThreshold:
        item.lowStockThreshold != null ? String(item.lowStockThreshold) : "",
      costPriceRwf:
        item.costPriceRwf != null ? String(item.costPriceRwf) : "",
    });
    setError(null);
    setSuccessId(null);
  }, []);

  const handleSave = async () => {
    if (!ownerToken || !editing) return;
    setSaving(true);
    setError(null);
    try {
      await updateMenuItemStock(ownerToken, vendorSlug, editing.itemId, {
        stockCount: parseIntOrNull(editing.stockCount),
        lowStockThreshold: parseIntOrNull(editing.lowStockThreshold),
        costPriceRwf: parseFloatOrNull(editing.costPriceRwf),
      });
      setSuccessId(editing.itemId);
      setEditing(null);
      setTimeout(() => setSuccessId(null), 2000);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      <div>
        <h2 className="font-display text-display-sm text-ink">Stock</h2>
        <p className="mt-1 font-body text-body-sm text-muted">
          Track inventory counts, set low-stock alerts, and record cost prices for margins.
        </p>
      </div>

      {lowStockItems.length > 0 && (
        <Card
          padding="sm"
          className="flex items-center gap-2.5 border-amber-500/30 bg-amber-500/10"
        >
          <span
            className="h-2 w-2 flex-none animate-pulse rounded-full bg-amber-400"
            aria-hidden
          />
          <span className="font-body text-body-sm font-medium text-amber-300">
            {lowStockItems.length} item{lowStockItems.length === 1 ? "" : "s"} low
            on stock
          </span>
        </Card>
      )}

      {error && (
        <p className="font-body text-body-sm text-error">{error}</p>
      )}

      {items.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-body text-body-sm text-muted">
            No menu items yet. Add items in the Menu tab.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => {
            const isEditing = editing?.itemId === item.id;
            const isLow =
              item.stockCount != null &&
              item.stockCount <= (item.lowStockThreshold ?? 0);
            const isSoldOut = item.stockCount === 0;
            const justSaved = successId === item.id;

            return (
              <Card
                key={item.id}
                padding="sm"
                className={cn(
                  "border border-hairline transition-colors",
                  isSoldOut && "border-error/30 bg-error/5",
                  isLow && !isSoldOut && "border-amber-500/30 bg-amber-500/5",
                  justSaved && "border-primary/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-body text-body-md font-medium text-ink">
                        {item.name}
                      </span>
                      {isSoldOut && (
                        <span className="rounded-pill bg-error/15 px-2 py-0.5 font-body text-caption font-medium text-error">
                          Sold out
                        </span>
                      )}
                      {isLow && !isSoldOut && (
                        <span className="rounded-pill bg-amber-500/15 px-2 py-0.5 font-body text-caption font-medium text-amber-400">
                          Low
                        </span>
                      )}
                      {justSaved && (
                        <span className="font-body text-caption text-primary">
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 font-body text-body-sm text-muted">
                      <span>{formatRwf(item.priceRwf)}</span>
                      <span>·</span>
                      <span>{item.category}</span>
                      {item.stockCount != null && (
                        <>
                          <span>·</span>
                          <span
                            className={cn(
                              "font-medium",
                              isSoldOut
                                ? "text-error"
                                : isLow
                                  ? "text-amber-400"
                                  : "text-ink"
                            )}
                          >
                            {item.stockCount} in stock
                          </span>
                        </>
                      )}
                      {item.costPriceRwf != null && (
                        <>
                          <span>·</span>
                          <span>Cost {formatRwf(item.costPriceRwf)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="flex h-10 w-10 flex-none items-center justify-center rounded-brand-md border border-hairline text-muted transition-colors hover:bg-canvas-soft hover:text-ink"
                      aria-label={`Edit stock for ${item.name}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </button>
                  )}
                </div>

                {isEditing && editing && (
                  <div className="mt-3 flex flex-col gap-3 border-t border-dashed border-hairline pt-3">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        label="Stock count"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={editing.stockCount}
                        onChange={(e) =>
                          setEditing({ ...editing, stockCount: e.target.value })
                        }
                        placeholder="∞"
                        disabled={saving}
                      />
                      <Input
                        label="Low alert"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={editing.lowStockThreshold}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            lowStockThreshold: e.target.value,
                          })
                        }
                        placeholder="5"
                        disabled={saving}
                      />
                      <Input
                        label="Cost (RWF)"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={editing.costPriceRwf}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            costPriceRwf: e.target.value,
                          })
                        }
                        placeholder="—"
                        disabled={saving}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        className="flex-1"
                        onClick={() => setEditing(null)}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="default"
                        className="flex-1"
                        onClick={() => void handleSave()}
                        disabled={saving || !ownerToken}
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
