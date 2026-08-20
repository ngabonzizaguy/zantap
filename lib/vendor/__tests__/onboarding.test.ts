import { describe, expect, it } from "vitest";
import type { MenuItem, Order } from "@/lib/types";
import {
  countCompletedSteps,
  deriveOnboardingState,
  ONBOARDING_STEPS,
} from "@/lib/vendor/onboarding";

const baseItem: MenuItem = {
  id: "item-1",
  vendorId: "v1",
  name: "Brochettes",
  priceRwf: 3500,
  category: "Grill",
  isAvailable: true,
  thumbFrom: "#ffd2b0",
  thumbTo: "#f5945f",
};

function order(status: Order["status"]): Order {
  return {
    id: "ord-1",
    vendorId: "v1",
    customerPhone: "+250780000000",
    deliverySector: "Kacyiru",
    landmark: "Near station",
    status,
    totalAmount: 3500,
    createdAt: new Date(),
    orderItems: [],
  };
}

describe("deriveOnboardingState", () => {
  it("returns all false for an empty vendor", () => {
    const state = deriveOnboardingState([], false, []);
    expect(state).toEqual({
      hasMenuItem: false,
      hasPhoto: false,
      hasInventoryItem: false,
      kitchenOpen: false,
      hasFirstOrder: false,
      hasDispatch: false,
    });
    expect(countCompletedSteps(state)).toBe(0);
  });

  it("completes inventory setup after the first active supply item", () => {
    expect(deriveOnboardingState([], false, [], 0).hasInventoryItem).toBe(false);
    expect(deriveOnboardingState([], false, [], 1).hasInventoryItem).toBe(true);
  });

  it("detects menu item and photo from hydrated menu", () => {
    const withPhoto: MenuItem = {
      ...baseItem,
      images: [
        {
          id: "img-1",
          menuItemId: "item-1",
          url: "https://example.com/photo.jpg",
          sortOrder: 0,
          isPrimary: true,
          createdAt: new Date(),
        },
      ],
    };
    const state = deriveOnboardingState([withPhoto], true, [order("PAID")]);
    expect(state.hasMenuItem).toBe(true);
    expect(state.hasPhoto).toBe(true);
    expect(state.kitchenOpen).toBe(true);
    expect(state.hasFirstOrder).toBe(true);
    expect(state.hasDispatch).toBe(false);
    expect(countCompletedSteps(state)).toBe(4);
  });

  it("marks dispatch when any order is DISPATCHED or COMPLETED", () => {
    expect(
      deriveOnboardingState([baseItem], false, [order("DISPATCHED")]).hasDispatch
    ).toBe(true);
    expect(
      deriveOnboardingState([baseItem], false, [order("COMPLETED")]).hasDispatch
    ).toBe(true);
    expect(
      deriveOnboardingState([baseItem], false, [order("PAID")]).hasDispatch
    ).toBe(false);
  });

  it("ignores PENDING orders for first-order step", () => {
    const state = deriveOnboardingState([baseItem], false, [order("PENDING")]);
    expect(state.hasFirstOrder).toBe(false);
  });

  it("covers every checklist key via ONBOARDING_STEPS", () => {
    const keys = new Set(ONBOARDING_STEPS.map((step) => step.id));
    expect(keys).toEqual(
      new Set([
        "hasMenuItem",
        "hasPhoto",
        "hasInventoryItem",
        "kitchenOpen",
        "hasFirstOrder",
        "hasDispatch",
      ])
    );
  });
});
