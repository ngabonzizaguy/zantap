import { describe, expect, it } from "vitest";
import {
  assertCanAdvanceKitchenStage,
  isForwardKitchenTransition,
  KitchenStageTransitionError,
  sortKdsQueueOrders,
} from "@/lib/kds/kitchen-stage";
import type { Order } from "@/lib/types";

function makeOrder(id: string, paidAt: string): Order {
  return {
    id,
    vendorId: "vendor-1",
    customerPhone: "250788123456",
    deliverySector: "Kacyiru",
    landmark: "Library",
    totalAmount: 1_000,
    status: "PAID",
    kitchenStage: "NEW",
    paidAt: new Date(paidAt),
    orderItems: [],
    createdAt: new Date(paidAt),
  };
}

describe("assertCanAdvanceKitchenStage", () => {
  it("allows forward jumps", () => {
    expect(() =>
      assertCanAdvanceKitchenStage("o1", { kitchenStage: "NEW" }, "READY")
    ).not.toThrow();
  });

  it("allows idempotent same-stage updates", () => {
    expect(() =>
      assertCanAdvanceKitchenStage("o1", { kitchenStage: "PREPARING" }, "PREPARING")
    ).not.toThrow();
  });

  it("throws KitchenStageTransitionError on backward moves", () => {
    expect(() =>
      assertCanAdvanceKitchenStage("o1", { kitchenStage: "READY" }, "NEW")
    ).toThrow(KitchenStageTransitionError);

    try {
      assertCanAdvanceKitchenStage("o1", { kitchenStage: "READY" }, "ACCEPTED");
    } catch (error) {
      expect(error).toBeInstanceOf(KitchenStageTransitionError);
      const err = error as KitchenStageTransitionError;
      expect(err.orderId).toBe("o1");
      expect(err.from).toBe("READY");
      expect(err.to).toBe("ACCEPTED");
    }
  });

  it("throws when the order is missing", () => {
    expect(() =>
      assertCanAdvanceKitchenStage("missing", null, "ACCEPTED")
    ).toThrow(/Order not found/);
  });

  it("throws when kitchen stage is not set yet", () => {
    expect(() =>
      assertCanAdvanceKitchenStage("o1", { kitchenStage: null }, "NEW")
    ).toThrow(/no kitchen stage yet/);
  });
});

describe("isForwardKitchenTransition", () => {
  it("is false for backward or equal stages", () => {
    expect(isForwardKitchenTransition("READY", "NEW")).toBe(false);
    expect(isForwardKitchenTransition("PREPARING", "PREPARING")).toBe(false);
  });
});

describe("sortKdsQueueOrders", () => {
  const older = makeOrder("older", "2026-08-08T08:00:00.000Z");
  const newer = makeOrder("newer", "2026-08-08T09:00:00.000Z");

  it("defaults to newest-first within a kitchen stage", () => {
    expect(sortKdsQueueOrders([older, newer]).map((order) => order.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("keeps oldest-first available as an explicit operator choice", () => {
    expect(
      sortKdsQueueOrders([newer, older], "oldest").map((order) => order.id)
    ).toEqual(["older", "newer"]);
  });
});
