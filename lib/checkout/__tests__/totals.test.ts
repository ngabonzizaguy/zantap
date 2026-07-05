import { describe, expect, it } from "vitest";
import { computeCount, computeLines, computeTotal } from "@/lib/checkout/totals";
import type { MenuItem } from "@/lib/types";

const menu: MenuItem[] = [
  {
    id: "item-a",
    vendorId: "v1",
    name: "Brochettes",
    priceRwf: 3000,
    category: "Grills",
    isAvailable: true,
  },
  {
    id: "item-b",
    vendorId: "v1",
    name: "Chips",
    priceRwf: 1500,
    category: "Sides",
    isAvailable: true,
  },
];

describe("computeCount", () => {
  it("returns 0 for an empty cart", () => {
    expect(computeCount({})).toBe(0);
  });

  it("sums quantities across items", () => {
    expect(computeCount({ "item-a": 2, "item-b": 1 })).toBe(3);
  });
});

describe("computeTotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(computeTotal({}, menu)).toBe(0);
  });

  it("computes price × quantity per menu item", () => {
    expect(computeTotal({ "item-a": 2, "item-b": 1 }, menu)).toBe(7500);
  });

  it("ignores cart keys that are not on the menu", () => {
    expect(computeTotal({ "unknown-id": 5 }, menu)).toBe(0);
  });
});

describe("computeLines", () => {
  it("returns an empty array for an empty cart", () => {
    expect(computeLines({}, menu)).toEqual([]);
  });

  it("returns line items with qty and lineTotal", () => {
    expect(computeLines({ "item-a": 2 }, menu)).toEqual([
      {
        menuItemId: "item-a",
        name: "Brochettes",
        qty: 2,
        lineTotal: 6000,
      },
    ]);
  });

  it("preserves menu order and omits zero-qty items", () => {
    expect(computeLines({ "item-b": 1 }, menu)).toEqual([
      {
        menuItemId: "item-b",
        name: "Chips",
        qty: 1,
        lineTotal: 1500,
      },
    ]);
  });

  it("includes per-item notes when present", () => {
    expect(
      computeLines({ "item-a": 2 }, menu, { "item-a": "Extra spicy" })
    ).toEqual([
      {
        menuItemId: "item-a",
        name: "Brochettes",
        qty: 2,
        lineTotal: 6000,
        notes: "Extra spicy",
      },
    ]);
  });
});
