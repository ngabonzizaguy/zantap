"use server";

import { getStore } from "@/lib/store";
import type {
  OrderHistoryFilters,
  PaginatedOrders,
  Pagination,
} from "@/lib/types";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

function hydrateFilters(filters: OrderHistoryFilters): OrderHistoryFilters {
  return {
    ...filters,
    dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
    dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined,
  };
}

export async function loadOrderHistory(
  vendorSlug: string,
  filters: OrderHistoryFilters,
  pagination: Pagination
): Promise<PaginatedOrders> {
  return getStore().listOrdersFiltered(
    vendorSlug,
    hydrateFilters(filters),
    pagination
  );
}
