import ExcelJS from "exceljs";
import type { Store } from "@/lib/store/types";
import type { OrderHistoryFilters, OrderHistoryItem } from "@/lib/types";
import { ORDER_HISTORY_TIMEZONE } from "@/lib/orders/history-filters";
import {
  formatPhoneDisplay,
  formatRwf,
  orderDisplayId,
} from "@/lib/format";

/** Safety cap — exports beyond this require narrower filters (ADR-0011). */
export const EXPORT_MAX_ROWS = 10_000;

export class ExportRowCapError extends Error {
  readonly code = "EXPORT_ROW_CAP" as const;

  constructor(public readonly total: number) {
    super(
      `Too many orders (${total}). Narrow your filters — exports are capped at ${EXPORT_MAX_ROWS} rows.`
    );
    this.name = "ExportRowCapError";
  }
}

export const EXPORT_CSV_HEADERS = [
  "Order ID",
  "Date",
  "Order Status",
  "Payment Status",
  "Phone",
  "Sector",
  "Landmark",
  "Total (RWF)",
  "Items",
] as const;

function formatExportDate(date: Date): string {
  return date.toLocaleString("en-GB", {
    timeZone: ORDER_HISTORY_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function paymentStatusLabel(
  status: OrderHistoryItem["paymentStatus"]
): string {
  if (!status) return "No payment";
  if (status === "SUCCESS") return "Paid";
  if (status === "PENDING") return "Pending";
  return "Failed";
}

function formatItemsSummary(order: OrderHistoryItem["order"]): string {
  return order.orderItems
    .map((line) => {
      const name = line.menuItem?.name ?? "Item";
      return `${line.quantity}x ${name}`;
    })
    .join("; ");
}

export function orderHistoryItemToRow(
  item: OrderHistoryItem
): Record<(typeof EXPORT_CSV_HEADERS)[number], string> {
  const { order, paymentStatus } = item;
  return {
    "Order ID": orderDisplayId(order.id),
    Date: formatExportDate(order.createdAt),
    "Order Status": order.status,
    "Payment Status": paymentStatusLabel(paymentStatus),
    Phone: formatPhoneDisplay(order.customerPhone),
    Sector: order.deliverySector,
    Landmark: order.landmark,
    "Total (RWF)": String(order.totalAmount),
    Items: formatItemsSummary(order),
  };
}

/** RFC 4180-style CSV cell escaping. */
export function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: OrderHistoryItem[]): string {
  const lines = [EXPORT_CSV_HEADERS.join(",")];
  for (const item of rows) {
    const record = orderHistoryItemToRow(item);
    const cells = EXPORT_CSV_HEADERS.map((header) =>
      escapeCsvCell(record[header])
    );
    lines.push(cells.join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export async function buildXlsxBuffer(
  rows: OrderHistoryItem[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Order History");

  sheet.addRow([...EXPORT_CSV_HEADERS]);
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };

  for (const item of rows) {
    const record = orderHistoryItemToRow(item);
    sheet.addRow(EXPORT_CSV_HEADERS.map((header) => record[header]));
  }

  sheet.columns.forEach((column) => {
    let max = 12;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    column.width = Math.min(max + 2, 48);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

function hydrateFilters(filters: OrderHistoryFilters): OrderHistoryFilters {
  return {
    ...filters,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };
}

/**
 * Fetches every row matching the History filters (not just the current page).
 * Throws {@link ExportRowCapError} when `total` exceeds {@link EXPORT_MAX_ROWS}.
 */
export async function fetchAllFilteredOrders(
  store: Store,
  vendorSlug: string,
  filters: OrderHistoryFilters,
  maxRows: number = EXPORT_MAX_ROWS
): Promise<OrderHistoryItem[]> {
  const hydrated = hydrateFilters(filters);
  const probe = await store.listOrdersFiltered(vendorSlug, hydrated, {
    page: 1,
    pageSize: 1,
  });

  if (probe.total > maxRows) {
    throw new ExportRowCapError(probe.total);
  }

  if (probe.total === 0) {
    return [];
  }

  const full = await store.listOrdersFiltered(vendorSlug, hydrated, {
    page: 1,
    pageSize: probe.total,
  });

  return full.orders.map((row) => ({
    ...row,
    order: {
      ...row.order,
      createdAt: new Date(row.order.createdAt),
    },
  }));
}

const DATE_PRESETS = new Set([
  "today",
  "yesterday",
  "last7",
  "last30",
  "custom",
] as const);

const ORDER_STATUSES = new Set([
  "ALL",
  "PENDING",
  "PAID",
  "DISPATCHED",
  "COMPLETED",
] as const);

const PAYMENT_STATUSES = new Set(["ALL", "PENDING", "SUCCESS", "FAILED"] as const);

export function parseExportFiltersFromSearchParams(
  params: URLSearchParams
): OrderHistoryFilters {
  const filters: OrderHistoryFilters = {};

  const datePreset = params.get("datePreset");
  if (datePreset && DATE_PRESETS.has(datePreset as never)) {
    filters.datePreset = datePreset as NonNullable<
      OrderHistoryFilters["datePreset"]
    >;
  }

  const dateFrom = params.get("dateFrom");
  if (dateFrom) {
    filters.dateFrom = new Date(`${dateFrom}T12:00:00`);
  }

  const dateTo = params.get("dateTo");
  if (dateTo) {
    filters.dateTo = new Date(`${dateTo}T12:00:00`);
  }

  const status = params.get("status");
  if (status && ORDER_STATUSES.has(status as never)) {
    filters.status = status as OrderHistoryFilters["status"];
  }

  const paymentStatus = params.get("paymentStatus");
  if (paymentStatus && PAYMENT_STATUSES.has(paymentStatus as never)) {
    filters.paymentStatus =
      paymentStatus as OrderHistoryFilters["paymentStatus"];
  }

  const search = params.get("search");
  if (search) {
    filters.search = search;
  }

  return filters;
}

export function serializeFiltersToSearchParams(
  filters: OrderHistoryFilters,
  format: "csv" | "xlsx"
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("format", format);

  if (filters.datePreset) {
    params.set("datePreset", filters.datePreset);
  }
  if (filters.dateFrom) {
    const d =
      filters.dateFrom instanceof Date
        ? filters.dateFrom
        : new Date(filters.dateFrom);
    if (!Number.isNaN(d.getTime())) {
      params.set("dateFrom", d.toISOString().slice(0, 10));
    }
  }
  if (filters.dateTo) {
    const d =
      filters.dateTo instanceof Date
        ? filters.dateTo
        : new Date(filters.dateTo);
    if (!Number.isNaN(d.getTime())) {
      params.set("dateTo", d.toISOString().slice(0, 10));
    }
  }
  if (filters.status && filters.status !== "ALL") {
    params.set("status", filters.status);
  }
  if (filters.paymentStatus && filters.paymentStatus !== "ALL") {
    params.set("paymentStatus", filters.paymentStatus);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  return params;
}

export function exportFilename(slug: string, format: "csv" | "xlsx"): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `zantap-orders-${slug}-${stamp}.${format}`;
}
