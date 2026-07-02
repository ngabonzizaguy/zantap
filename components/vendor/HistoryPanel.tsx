"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  OrderHistoryFilters,
  OrderHistoryItem,
  PaginatedOrders,
} from "@/lib/types";
import { loadOrderHistory } from "@/lib/actions/vendor-history";
import { DEFAULT_ORDER_HISTORY_PAGE_SIZE } from "@/lib/orders/history-filters";
import {
  exportFilename,
  serializeFiltersToSearchParams,
} from "@/lib/vendor/export-orders";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import {
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
}

const OWNER_TOKEN_HEADER = "x-vendor-owner-token";

const DEFAULT_FILTERS: OrderHistoryFilters = {
  datePreset: "last30",
  status: "ALL",
  paymentStatus: "ALL",
  search: "",
};

function hydrateOrderHistoryItem(row: OrderHistoryItem): OrderHistoryItem {
  return {
    ...row,
    order: {
      ...row.order,
      createdAt: new Date(row.order.createdAt),
    },
  };
}

function formatCreatedAt(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: "Africa/Kigali",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadgeVariant(
  status: OrderHistoryItem["order"]["status"]
): "default" | "success" | "muted" {
  if (status === "COMPLETED" || status === "DISPATCHED") return "muted";
  if (status === "PAID") return "success";
  return "default";
}

function paymentLabel(status: OrderHistoryItem["paymentStatus"]): string {
  if (!status) return "No payment";
  if (status === "SUCCESS") return "Paid";
  if (status === "PENDING") return "Pending";
  return "Failed";
}

export function HistoryPanel({ vendorSlug }: HistoryPanelProps) {
  const { token, hasToken, ready } = useOwnerToken(vendorSlug);
  const [filters, setFilters] = useState<OrderHistoryFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<OrderHistoryFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedOrders | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const fetchHistory = useCallback(
    async (
      nextFilters: OrderHistoryFilters,
      nextPage: number
    ) => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadOrderHistory(vendorSlug, nextFilters, {
          page: nextPage,
          pageSize: DEFAULT_ORDER_HISTORY_PAGE_SIZE,
        });
        setResult({
          ...data,
          orders: data.orders.map(hydrateOrderHistoryItem),
        });
      } catch {
        setError("Could not load order history. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [vendorSlug]
  );

  useEffect(() => {
    void fetchHistory(appliedFilters, page);
  }, [appliedFilters, page, fetchHistory]);

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
      setExportError(
        "Add your owner token in the Setup guide before exporting."
      );
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
          payload?.error ?? `Export failed (${response.status}). Try again.`
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
        <h2 className="font-display text-display-sm text-ink">Order history</h2>
        <p className="mt-1 font-body text-body-sm text-muted">
          Browse past orders with date, status, and search filters.
        </p>
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

      {loading && !result ? (
        <Card padding="md">
          <p className="font-body text-body-md text-muted">Loading orders…</p>
        </Card>
      ) : null}

      {result && result.total === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="font-display text-display-sm text-ink">No orders found</p>
          <p className="mt-2 font-body text-body-sm text-muted">
            Try widening the date range or clearing filters.
          </p>
        </Card>
      ) : null}

      {result && result.total > 0 ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-body text-body-sm text-muted">
              {result.total} order{result.total === 1 ? "" : "s"} · page{" "}
              {result.page} of {totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={!ready || !hasToken || exporting !== null || loading}
                onClick={() => void handleExport("csv")}
              >
                {exporting === "csv" ? "Exporting…" : "Export CSV"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={!ready || !hasToken || exporting !== null || loading}
                onClick={() => void handleExport("xlsx")}
              >
                {exporting === "xlsx" ? "Exporting…" : "Export Excel"}
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
                      {formatCreatedAt(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant="muted">{paymentLabel(paymentStatus)}</Badge>
                    <Link
                      href={`/vendor/${vendorSlug}/receipt/${order.id}`}
                      className={cn(
                        "inline-flex h-11 min-h-11 items-center justify-center rounded-brand-pill",
                        "border border-hairline-strong px-4 font-body text-body-sm font-medium text-ink",
                        "transition-colors hover:bg-surface-strong"
                      )}
                    >
                      Receipt
                    </Link>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">
                      Phone
                    </p>
                    <p className="font-body text-body-md text-ink">
                      {formatPhoneDisplay(order.customerPhone)}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">
                      Sector
                    </p>
                    <p className="font-body text-body-md text-ink">
                      {order.deliverySector}
                    </p>
                  </div>
                  <div>
                    <p className="font-body text-caption uppercase text-muted-soft">
                      Total
                    </p>
                    <p className="font-body text-body-md font-medium text-primary">
                      {formatRwf(order.totalAmount)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="kds"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <span
              className={cn(
                "font-body text-body-sm text-muted",
                loading && "opacity-60"
              )}
            >
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="kds"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
