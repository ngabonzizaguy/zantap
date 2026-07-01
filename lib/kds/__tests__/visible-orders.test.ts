import { describe, expect, it } from "vitest";
import { filterKdsQueueOrders, isKdsQueueOrder } from "@/lib/kds/visible-orders";
import type { Order } from "@/lib/types";

function order(
  overrides: Partial<Order> & Pick<Order, "status">
): Order {
  return {
    id: "o1",
    vendorId: "v1",
    customerPhone: "0780000000",
    deliverySector: "Kacyiru",
    landmark: "Test",
    totalAmount: 1000,
    orderItems: [],
    createdAt: new Date("2026-07-01T08:00:00.000Z"),
    ...overrides,
  };
}

describe("isKdsQueueOrder", () => {
  const ref = new Date("2026-07-01T12:00:00.000Z");

  it("includes PAID and DISPATCHED regardless of age", () => {
    expect(
      isKdsQueueOrder(
        order({
          status: "PAID",
          updatedAt: new Date("2026-06-01T08:00:00.000Z"),
        }),
        ref
      )
    ).toBe(true);
    expect(
      isKdsQueueOrder(
        order({
          status: "DISPATCHED",
          updatedAt: new Date("2026-06-01T08:00:00.000Z"),
        }),
        ref
      )
    ).toBe(true);
  });

  it("includes COMPLETED tickets touched today only", () => {
    expect(
      isKdsQueueOrder(
        order({
          status: "COMPLETED",
          updatedAt: new Date("2026-07-01T09:00:00.000Z"),
        }),
        ref
      )
    ).toBe(true);
    expect(
      isKdsQueueOrder(
        order({
          status: "COMPLETED",
          updatedAt: new Date("2026-06-30T09:00:00.000Z"),
        }),
        ref
      )
    ).toBe(false);
  });

  it("excludes PENDING", () => {
    expect(isKdsQueueOrder(order({ status: "PENDING" }), ref)).toBe(false);
  });
});

describe("filterKdsQueueOrders", () => {
  it("filters a mixed list", () => {
    const rows = filterKdsQueueOrders(
      [
        order({ id: "paid", status: "PAID" }),
        order({ id: "pending", status: "PENDING" }),
        order({
          id: "done-today",
          status: "COMPLETED",
          updatedAt: new Date("2026-07-01T10:00:00.000Z"),
        }),
        order({
          id: "done-yesterday",
          status: "COMPLETED",
          updatedAt: new Date("2026-06-30T10:00:00.000Z"),
        }),
      ],
      new Date("2026-07-01T12:00:00.000Z")
    );
    expect(rows.map((row) => row.id)).toEqual(["paid", "done-today"]);
  });
});
