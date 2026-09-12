"use client";

import { translateKdsLabel, translateKdsStatus } from "@/lib/i18n/kds-labels";

import { useKdsTranslation } from "@/components/vendor/KdsLanguageProvider";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  OrderHistoryFilters,
  OrderHistoryItem,
  PaginatedOrders,
} from "@/lib/types";
import { loadOrderHistory } from "@/lib/actions/vendor-history";
import { KDS_ORDER_PAGE_SIZE, clampPage, type HistoryQuery } from "@/lib/kds/order-pagination";
import {
  exportFilename,
  serializeFiltersToSearchParams,
} from "@/lib/vendor/export-orders";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import {
  formatKigaliDateTime,
  formatPhoneDisplay,
  formatRwf,
  orderDisplayId,
} from "@/lib/format";
import { Badge, Button, Card } from "@/components/ui/primitives";
import {
  OrderHistoryFilters as OrderHistoryFiltersBar,
  type DatePreset,
} from "@/components/vendor/OrderHistoryFilters";
import { cn } from "@/lib/cn";

interface HistoryPanelProps {
  vendorSlug: string;
  initialQuery: HistoryQuery;
  onUnlockEditing: () => void;
}

const OWNER_TOKEN_HEADER = "x-vendor-owner-token";
const HISTORY_ACCESS_MESSAGE = "Unlock editing to export order history.";

function hydrateOrderHistoryItem(row: OrderHistoryItem): OrderHistoryItem {
  return {
    ...row,
    order: {
      ...row.order,
      createdAt: new Date(row.order.createdAt),
    },
  };
}

function statusBadgeVariant(
  status: OrderHistoryItem["order"]["status"]
): "default" | "success" | "muted" {
  if (status === "COMPLETED" || status === "DISPATCHED") return "muted";
  if (status === "PAID") return "success";
  if (status === "CANCELLED") return "muted";
  return "default";
}

function paymentLabel(status: OrderHistoryItem["paymentStatus"]): string {
  if (!status) return "No payment";
  if (status === "SUCCESS") return "Paid";
  if (status === "PENDING") return "Pending";
  return "Failed";
}

function dateKey(value?: Date): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

export function HistoryPanel({ vendorSlug, initialQuery, onUnlockEditing }: HistoryPanelProps) {
  const t = useKdsTranslation();
  const { token, hasToken, ready } = useOwnerToken(vendorSlug);
  const [filters, setFilters] = useState<OrderHistoryFilters>(initialQuery.filters);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderHistoryFilters>(initialQuery.filters);
  const [page, setPage] = useState(initialQuery.page);
  const [result, setResult] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Flip to the loading state as soon as the query changes ("adjust state
  // during render"); the effect below only owns the async fetch.
  const [prevQuery, setPrevQuery] = useState({ vendorSlug, appliedFilters, page });
  if (
    prevQuery.vendorSlug !== vendorSlug ||
    prevQuery.appliedFilters !== appliedFilters ||
    prevQuery.page !== page
  ) {
    setPrevQuery({ vendorSlug, appliedFilters, page });
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let cancelled = false;
    void loadOrderHistory(vendorSlug, appliedFilters, {
      page,
      pageSize: KDS_ORDER_PAGE_SIZE,
    }).then((data) => {
      if (cancelled) return;
      const safePage = clampPage(page, data.total, KDS_ORDER_PAGE_SIZE);
      if (safePage !== page) {
        setPage(safePage);
        return;
      }
      setResult({
        ...data,
        orders: data.orders.map(hydrateOrderHistoryItem),
      });
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setError("Could not load order history. Try again.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [vendorSlug, appliedFilters, page]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", "history");
    if (page > 1) url.searchParams.set("historyPage", String(page));
    else url.searchParams.delete("historyPage");
    if (appliedFilters.datePreset && appliedFilters.datePreset !== "last30") {
      url.searchParams.set("historyDate", appliedFilters.datePreset);
    } else url.searchParams.delete("historyDate");
    const from = dateKey(appliedFilters.dateFrom);
    const to = dateKey(appliedFilters.dateTo);
    if (appliedFilters.datePreset === "custom" && from) url.searchParams.set("historyFrom", from);
    else url.searchParams.delete("historyFrom");
    if (appliedFilters.datePreset === "custom" && to) url.searchParams.set("historyTo", to);
    else url.searchParams.delete("historyTo");
    if (appliedFilters.status && appliedFilters.status !== "ALL") url.searchParams.set("historyStatus", appliedFilters.status);
    else url.searchParams.delete("historyStatus");
    if (appliedFilters.paymentStatus && appliedFilters.paymentStatus !== "ALL") url.searchParams.set("historyPayment", appliedFilters.paymentStatus);
    else url.searchParams.delete("historyPayment");
    if (appliedFilters.search?.trim()) url.searchParams.set("historySearch", appliedFilters.search.trim());
    else url.searchParams.delete("historySearch");
    window.history.replaceState(null, "", url);
  }, [appliedFilters, page]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(1);
  };

  const handleDatePresetApply = (preset: DatePreset) => {
    const nextApplied = {
      ...appliedFilters,
      datePreset: preset,
      dateFrom: undefined,
      dateTo: undefined,
    };
    setAppliedFilters(nextApplied);
    setFilters((prev) => ({
      ...prev,
      datePreset: preset,
      dateFrom: undefined,
      dateTo: undefined,
    }));
    setPage(1);
  };

  const handleExport = async (format: "csv" | "xlsx") => {
    if (!token) {
      setExportError(HISTORY_ACCESS_MESSAGE);
      return;
    }

    setExporting(format);
    setExportError(null);

    try {
      const params = serializeFiltersToSearchParams(appliedFilters, format);
      const response = await fetch(
        `/api/vendor/${encodeURIComponent(vendorSlug)}/export?${params.toString()}`,
        {
          headers: { [OWNER_TOKEN_HEADER]: token },
        }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setExportError(
          payload?.error?.toLowerCase().includes("owner token")
            ? HISTORY_ACCESS_MESSAGE
            : payload?.error ?? `Export failed (${response.status}). Try again.`
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = exportFilename(vendorSlug, format);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Export failed. Check your connection and try again.");
    } finally {
      setExporting(null);
    }
  };

  const totalPages = result
    ? Math.max(1, Math.ceil(result.total / result.pageSize))
    : 1;

  return (
    <div className="flex flex-col gap-5">
      <Card padding="md" className="bg-canvas/80 backdrop-blur-sm">
        <h2 className="font-display text-display-sm text-ink">{t("kds.history-panel.order-history")}</h2>
        <p className="mt-1 font-body text-body-sm text-muted">{t("kds.history-panel.browse-past-orders-with-date-status-and-search-filters")}</p>
        <div className="mt-4">
          <OrderHistoryFiltersBar
            filters={filters}
            onChange={setFilters}
            onDatePresetApply={handleDatePresetApply}
            onApply={applyFilters}
            loading={loading}
          />
        </div>
      </Card>

      {error ? (
        <Card padding="md" className="border-error/30 bg-error/5">
          <p className="font-body text-body-md text-error">{error}</p>
        </Card>
      ) : null}

      {ready && (!hasToken || exportError === HISTORY_ACCESS_MESSAGE) ? (
        <Card padding="sm" className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-body-sm text-muted">
            {HISTORY_ACCESS_MESSAGE}
          </p>
          <Button type="button" variant="outline" onClick={onUnlockEditing}>{t("kds.history-panel.unlock-editing")}</Button>
        </Card>
      ) : null}

      {loading && !result ? (
        <Card padding="md">
          <p className="font-body text-body-md text-muted">{t("kds.history-panel.loading-orders")}</p>
        </Card>
      ) : null}

      {result && result.total === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-display text-display-sm text-ink">{t("kds.history-panel.no-orders-found")}</p>
          <p className="mt-2 font-body text-body-sm text-muted">{t("kds.history-panel.try-widening-the-date-range-or-clearing-filters")}</p>
        </Card>
      ) : null}

      {result && result.total > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-body-sm text-muted">
              {t(result.total === 1 ? "kds.counts.history-order" : "kds.counts.history-orders", { count: result.total, page: result.page, pages: totalPages })}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={!ready || !hasToken || exporting !== null || loading}
                onClick={() => void handleExport("csv")}
              >
                {exporting === "csv" ? t("kds.history-panel.exporting") : t("kds.history-panel.export-csv")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={!ready || !hasToken || exporting !== null || loading}
                onClick={() => void handleExport("xlsx")}
              >
                {exporting === "xlsx" ? t("kds.history-panel.exporting") : t("kds.history-panel.export-excel")}
              </Button>
            </div>
          </div>

          {exportError ? (
            <Card padding="sm" className="border-error/30 bg-error/5">
              <p className="font-body text-body-sm text-error">{exportError}</p>
            </Card>
          ) : null}

          <div className="flex flex-col gap-3">
            {result.orders.map(({ order, paymentStatus }) => (
              <Card key={order.id} padding="sm" className="flex flex-col gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-display-sm text-ink">
                      {orderDisplayId(order.id)}
                    </p>
                    <p className="mt-1 font-body text-body-sm text-muted">
                      {formatKigaliDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {translateKdsStatus(t, order.status)}
                    </Badge>
                    <Badge variant="muted">{translateKdsLabel(t, paymentLabel(paymentStatus))}</Badge>
                    <Link
                      href={`/vendor/${vendorSlug}/receipt/${order.id}`}
                      className={cn(
                        "inline-flex h-11 min-h-11 items-center justify-center rounded-brand-pill",
                        "border border-hairline-strong px-4 font-body text-body-sm font-medium text-ink",
                        "transition-colors hover:bg-surface-strong"
                      )}
                    >{t("kds.history-panel.receipt")}</Link>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">{t("kds.history-panel.phone")}</p>
                    <p className="font-body text-body-md text-ink">
                      {formatPhoneDisplay(order.customerPhone)}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">{t("kds.history-panel.sector")}</p>
                    <p className="font-body text-body-md text-ink">
                      {order.deliverySector}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">{t("kds.history-panel.total")}</p>
                    <p className="font-body text-body-md font-medium text-primary">
                      {formatRwf(order.totalAmount)}
                    </p>
                  </div>
                  {order.assignedDriver ? (
                    <div>
                      <p className="font-body text-caption uppercase text-muted-soft">{t("kds.history-panel.driver")}</p>
                      <p className="font-body text-body-md text-ink">
                        {order.assignedDriver.name}
                      </p>
                    </div>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          <nav className="flex flex-wrap items-center justify-between gap-3" aria-label={t("kds.history-panel.order-history-pages")}>
            <Button
              type="button"
              variant="outline"
              size="kds"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >{t("kds.history-panel.previous")}</Button>
            <span
              className={cn(
                "font-body text-body-sm text-muted",
                loading && "opacity-60"
              )}
            >{t("kds.counts.page", { page, pages: totalPages })}
            </span>
            <Button
              type="button"
              variant="outline"
              size="kds"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >{t("kds.history-panel.next")}</Button>
          </nav>
        </>
      ) : null}
    </div>
  );
}
