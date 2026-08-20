import { describe, expect, it } from "vitest";
import {
  KDS_ORDER_PAGE_SIZE,
  clampPage,
  paginateOrders,
  parseHistoryQuery,
  parseLiveOrdersQuery,
  reconcileDeferredOrderIds,
} from "@/lib/kds/order-pagination";
import type { Order } from "@/lib/types";

function order(id: string): Order {
  return {
    id,
    vendorId: "vendor-1",
    customerPhone: "0788000000",
    deliverySector: "Kicukiro",
    landmark: "Test",
    totalAmount: 1_000,
    status: "PAID",
    kitchenStage: "NEW",
    orderItems: [],
    createdAt: new Date(`2026-08-20T${id.padStart(2, "0")}:00:00.000Z`),
  };
}

describe("KDS order pagination", () => {
  it("shows no more than ten orders and clamps invalid pages", () => {
    const orders = Array.from({ length: 23 }, (_, index) => order(String(index)));

    expect(paginateOrders(orders, 2).items).toHaveLength(KDS_ORDER_PAGE_SIZE);
    expect(paginateOrders(orders, 99)).toMatchObject({ page: 3, pageCount: 3 });
    expect(clampPage(Number.NaN, 0)).toBe(1);
  });

  it("parses safe live and history URL state", () => {
    expect(
      parseLiveOrdersQuery({ ordersPage: "2", ordersStage: "ready", ordersSort: "oldest" })
    ).toEqual({ page: 2, stage: "ready", sort: "oldest" });
    expect(
      parseLiveOrdersQuery({ ordersPage: "-4", ordersStage: "wrong", ordersSort: "wrong" })
    ).toEqual({ page: 1, stage: "all", sort: "newest" });

    expect(
      parseHistoryQuery({
        historyPage: "3",
        historyDate: "custom",
        historyFrom: "2026-08-01",
        historyTo: "2026-08-20",
        historyStatus: "COMPLETED",
        historyPayment: "SUCCESS",
        historySearch: "  0788  ",
      })
    ).toMatchObject({
      page: 3,
      filters: {
        datePreset: "custom",
        status: "COMPLETED",
        paymentStatus: "SUCCESS",
        search: "0788",
      },
    });
  });

  it("defers newly arriving orders on later pages until page one is opened", () => {
    const previous = [order("1"), order("2"), order("3")];
    const next = [order("4"), ...previous];

    expect(reconcileDeferredOrderIds(previous, next, 2, new Set())).toEqual(
      new Set(["4"])
    );
    expect(
      reconcileDeferredOrderIds(previous, next, 1, new Set(["4"]))
    ).toEqual(new Set());
  });

  it("keeps a later page stable while deferred arrivals wait", () => {
    const previous = Array.from({ length: 21 }, (_, index) => order(String(index)));
    const arrival = order("23");
    const next = [arrival, ...previous];
    const deferred = reconcileDeferredOrderIds(previous, next, 2, new Set());
    const stableNext = next.filter((candidate) => !deferred.has(candidate.id));

    expect(paginateOrders(stableNext, 2).items.map(({ id }) => id)).toEqual(
      paginateOrders(previous, 2).items.map(({ id }) => id)
    );
    expect(paginateOrders(previous.slice(0, 4), 3).page).toBe(1);
  });
});
