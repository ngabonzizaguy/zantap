import type { KdsSortDirection } from "@/lib/kds/kitchen-stage";
import type { KdsStageFilter } from "@/lib/kds/stage-styles";
import type { Order, OrderHistoryFilters, OrderStatus, Payment } from "@/lib/types";

export const KDS_ORDER_PAGE_SIZE = 10;

type QueryValue = string | string[] | undefined;
type Query = Record<string, QueryValue>;

export interface LiveOrdersQuery {
  page: number;
  stage: KdsStageFilter;
  sort: KdsSortDirection;
}

export interface HistoryQuery {
  page: number;
  filters: OrderHistoryFilters;
}

const LIVE_STAGES = new Set<KdsStageFilter>([
  "all",
  "new",
  "preparing",
  "ready",
  "completed",
]);
const HISTORY_PRESETS = new Set<NonNullable<OrderHistoryFilters["datePreset"]>>([
  "today",
  "yesterday",
  "last7",
  "last30",
  "custom",
]);
const ORDER_STATUSES = new Set<OrderStatus>([
  "PENDING",
  "PAID",
  "DISPATCHED",
  "COMPLETED",
  "CANCELLED",
]);
const PAYMENT_STATUSES = new Set<Payment["status"]>([
  "PENDING",
  "SUCCESS",
  "FAILED",
]);

function first(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositivePage(value: QueryValue): number {
  const parsed = Number.parseInt(first(value) ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseDate(value: QueryValue): Date | undefined {
  const key = first(value);
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return undefined;
  const parsed = new Date(`${key}T12:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function clampPage(requestedPage: number, totalItems: number, pageSize = KDS_ORDER_PAGE_SIZE): number {
  const pageCount = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));
  if (!Number.isFinite(requestedPage) || requestedPage < 1) return 1;
  return Math.min(Math.floor(requestedPage), pageCount);
}

export function paginateOrders(orders: Order[], requestedPage: number) {
  const page = clampPage(requestedPage, orders.length);
  const pageCount = Math.max(1, Math.ceil(orders.length / KDS_ORDER_PAGE_SIZE));
  const start = (page - 1) * KDS_ORDER_PAGE_SIZE;
  return {
    items: orders.slice(start, start + KDS_ORDER_PAGE_SIZE),
    total: orders.length,
    page,
    pageCount,
  };
}

export function parseLiveOrdersQuery(query: Query): LiveOrdersQuery {
  const stageValue = first(query.ordersStage);
  const sortValue = first(query.ordersSort);
  return {
    page: parsePositivePage(query.ordersPage),
    stage: LIVE_STAGES.has(stageValue as KdsStageFilter)
      ? (stageValue as KdsStageFilter)
      : "all",
    sort: sortValue === "oldest" ? "oldest" : "newest",
  };
}

export function parseHistoryQuery(query: Query): HistoryQuery {
  const presetValue = first(query.historyDate);
  const statusValue = first(query.historyStatus);
  const paymentValue = first(query.historyPayment);
  const search = first(query.historySearch)?.trim() ?? "";
  const datePreset = HISTORY_PRESETS.has(
    presetValue as NonNullable<OrderHistoryFilters["datePreset"]>
  )
    ? (presetValue as NonNullable<OrderHistoryFilters["datePreset"]>)
    : "last30";

  return {
    page: parsePositivePage(query.historyPage),
    filters: {
      datePreset,
      dateFrom: datePreset === "custom" ? parseDate(query.historyFrom) : undefined,
      dateTo: datePreset === "custom" ? parseDate(query.historyTo) : undefined,
      status:
        statusValue && ORDER_STATUSES.has(statusValue as OrderStatus)
          ? (statusValue as OrderStatus)
          : "ALL",
      paymentStatus:
        paymentValue && PAYMENT_STATUSES.has(paymentValue as Payment["status"])
          ? (paymentValue as Payment["status"])
          : "ALL",
      search,
    },
  };
}

export function reconcileDeferredOrderIds(
  previousOrders: Order[],
  nextOrders: Order[],
  currentPage: number,
  currentDeferred: ReadonlySet<string>
): Set<string> {
  if (currentPage <= 1) return new Set();
  const previousIds = new Set(previousOrders.map((order) => order.id));
  const nextIds = new Set(nextOrders.map((order) => order.id));
  const deferred = new Set(
    [...currentDeferred].filter((id) => nextIds.has(id))
  );
  for (const next of nextOrders) {
    if (!previousIds.has(next.id)) deferred.add(next.id);
  }
  return deferred;
}
