import type { Order, OrderHistoryFilters, Pagination, Payment } from "@/lib/types";

/** Calendar-day boundaries for vendor order history (Rwanda-local). */
export const ORDER_HISTORY_TIMEZONE = "Africa/Kigali";

export const DEFAULT_ORDER_HISTORY_PAGE_SIZE = 20;

function formatDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split("-").map(Number);
  return { year, month, day };
}

function addDaysToDateKey(key: string, days: number): string {
  const anchor = new Date(`${key}T12:00:00.000Z`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toISOString().slice(0, 10);
}

/**
 * Midnight in Africa/Kigali is UTC+2 year-round (no DST). Other zones fall back
 * to the same calendar key interpreted at local noon UTC as a stable anchor.
 */
export function startOfDayInTimezone(
  ref: Date,
  timeZone: string = ORDER_HISTORY_TIMEZONE
): Date {
  const key = formatDateKey(ref, timeZone);
  const { year, month, day } = parseDateKey(key);
  if (timeZone === "Africa/Kigali") {
    return new Date(Date.UTC(year, month - 1, day, -2, 0, 0, 0));
  }
  return new Date(`${key}T00:00:00.000Z`);
}

export function endOfDayInTimezone(
  ref: Date,
  timeZone: string = ORDER_HISTORY_TIMEZONE
): Date {
  const start = startOfDayInTimezone(ref, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Resolves inclusive createdAt bounds from preset or custom dates.
 * Returns null when no date constraint applies.
 */
export function resolveDateRange(
  filters: OrderHistoryFilters,
  now: Date = new Date(),
  timeZone: string = ORDER_HISTORY_TIMEZONE
): { from: Date; to: Date } | null {
  const preset = filters.datePreset;

  if (!preset) {
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom
        ? startOfDayInTimezone(filters.dateFrom, timeZone)
        : new Date(0);
      const to = filters.dateTo
        ? endOfDayInTimezone(filters.dateTo, timeZone)
        : endOfDayInTimezone(now, timeZone);
      return { from, to };
    }
    return null;
  }

  const todayKey = formatDateKey(now, timeZone);

  switch (preset) {
    case "today":
      return {
        from: startOfDayInTimezone(now, timeZone),
        to: endOfDayInTimezone(now, timeZone),
      };
    case "yesterday": {
      const yesterdayKey = addDaysToDateKey(todayKey, -1);
      const yesterdayRef = new Date(`${yesterdayKey}T12:00:00.000Z`);
      return {
        from: startOfDayInTimezone(yesterdayRef, timeZone),
        to: endOfDayInTimezone(yesterdayRef, timeZone),
      };
    }
    case "last7": {
      const fromKey = addDaysToDateKey(todayKey, -6);
      const fromRef = new Date(`${fromKey}T12:00:00.000Z`);
      return {
        from: startOfDayInTimezone(fromRef, timeZone),
        to: endOfDayInTimezone(now, timeZone),
      };
    }
    case "last30": {
      const fromKey = addDaysToDateKey(todayKey, -29);
      const fromRef = new Date(`${fromKey}T12:00:00.000Z`);
      return {
        from: startOfDayInTimezone(fromRef, timeZone),
        to: endOfDayInTimezone(now, timeZone),
      };
    }
    case "custom": {
      if (!filters.dateFrom && !filters.dateTo) return null;
      const from = filters.dateFrom
        ? startOfDayInTimezone(filters.dateFrom, timeZone)
        : new Date(0);
      const to = filters.dateTo
        ? endOfDayInTimezone(filters.dateTo, timeZone)
        : endOfDayInTimezone(now, timeZone);
      return { from, to };
    }
    default:
      return null;
  }
}

export function matchesOrderSearch(order: Order, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;

  const phone = order.customerPhone.toLowerCase();
  const id = order.id.toLowerCase();
  const suffix = order.id.replace(/\D/g, "").slice(-4).toLowerCase();
  const needle = q.replace(/^#/, "");

  return (
    phone.includes(q) ||
    id.includes(q) ||
    (suffix.length > 0 && suffix.includes(needle))
  );
}

export function normalizePagination(pagination: Pagination): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const pageSize =
    pagination.pageSize > 0
      ? pagination.pageSize
      : DEFAULT_ORDER_HISTORY_PAGE_SIZE;
  const page = pagination.page > 0 ? pagination.page : 1;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paymentMatchesFilter(
  paymentStatus: Payment["status"] | null | undefined,
  filter: Payment["status"]
): boolean {
  return paymentStatus === filter;
}
