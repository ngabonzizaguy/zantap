"use server";

import { getStore } from "@/lib/store";
import { hydrateOrderHistoryFilters } from "@/lib/orders/history-filters";
import type {
  OrderHistoryFilters,
  PaginatedOrders,
  Pagination,
} from "@/lib/types";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

export async function loadOrderHistory(
  vendorSlug: string,
  filters: OrderHistoryFilters,
  pagination: Pagination
): Promise<PaginatedOrders> {
  return getStore().listOrdersFiltered(
    vendorSlug,
    hydrateOrderHistoryFilters(filters),
    pagination
  );
}
