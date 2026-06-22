import { describe, expect, it } from "vitest";
import { transition } from "@/lib/checkout/stages";

describe("checkout stage transitions", () => {
  it("menu → cart on open_cart", () => {
    expect(transition("menu", "open_cart")).toBe("cart");
  });

  it("cart → loading on pay_start", () => {
    expect(transition("cart", "pay_start")).toBe("loading");
  });

  it("loading → ussd on stk_success", () => {
    expect(transition("loading", "stk_success")).toBe("ussd");
  });

  it("loading → cart on stk_failed", () => {
    expect(transition("loading", "stk_failed")).toBe("cart");
  });

  it("ussd → success on pin_success", () => {
    expect(transition("ussd", "pin_success")).toBe("success");
  });

  it("ussd stays on ussd for pin_failed", () => {
    expect(transition("ussd", "pin_failed")).toBe("ussd");
  });

  it("ussd → cart on cancel_ussd", () => {
    expect(transition("ussd", "cancel_ussd")).toBe("cart");
  });

  it("cart → menu on close_cart", () => {
    expect(transition("cart", "close_cart")).toBe("menu");
  });

  it("any active stage → menu on reset", () => {
    for (const stage of ["menu", "cart", "loading", "ussd", "success"] as const) {
      expect(transition(stage, "reset")).toBe("menu");
    }
  });

  it("returns null for illegal transitions", () => {
    expect(transition("menu", "pay_start")).toBeNull();
    expect(transition("loading", "pin_success")).toBeNull();
    expect(transition("success", "open_cart")).toBeNull();
  });
});
