import { describe, expect, it } from "vitest";
import {
  assertCanAdvanceKitchenStage,
  isForwardKitchenTransition,
  KitchenStageTransitionError,
} from "@/lib/kds/kitchen-stage";

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
