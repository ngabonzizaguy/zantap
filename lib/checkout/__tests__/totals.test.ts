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
    id: "item-c",
    vendorId: "v1",
    name: "Family Pilau",
    priceRwf: 5000,
    sizeOptions: [
      { id: "small", label: "Small", priceRwf: 5000, isAvailable: true },
      { id: "family", label: "Family tray", priceRwf: 12000, isAvailable: true },
    ],
    category: "Mains",
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
  {
    id: "item-d", vendorId: "v1", name: "Burger", priceRwf: 5000,
    category: "Mains", isAvailable: true,
    addOnGroups: [{
      id: "extras", name: "Extras", required: false, selection: "MULTIPLE", maxSelections: 2,
      choices: [
        { id: "avocado", label: "Avocado", priceRwf: 1000, isAvailable: true },
        { id: "cheese", label: "Cheese", priceRwf: 500, isAvailable: true },
      ],
    }],
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

  it("prices separate custom-size lines from their persisted option", () => {
    expect(
      computeTotal({ "item-c::small": 1, "item-c::family": 2 }, menu)
    ).toBe(29_000);
  });

  it("drops a stale cart line when its size is no longer available", () => {
    const unavailableMenu = menu.map((item) =>
      item.id === "item-c"
        ? {
            ...item,
            sizeOptions: item.sizeOptions?.map((option) => ({
              ...option,
              isAvailable: option.id === "family" ? false : option.isAvailable,
            })),
          }
        : item
    );
    expect(computeTotal({ "item-c::family": 1 }, unavailableMenu)).toBe(0);
    expect(computeLines({ "item-c::family": 1 }, unavailableMenu)).toEqual([]);
  });

  it("prices add-on signatures as distinct per-unit cart lines", () => {
    const cart = { "item-d##avocado": 2, "item-d##cheese": 1 };
    expect(computeTotal(cart, menu)).toBe(17_500);
    expect(computeLines(cart, menu)).toEqual([
      { lineKey: "item-d##avocado", menuItemId: "item-d", name: "Burger", addOnChoiceIds: ["avocado"], addOnLabels: ["Avocado"], qty: 2, lineTotal: 12_000 },
      { lineKey: "item-d##cheese", menuItemId: "item-d", name: "Burger", addOnChoiceIds: ["cheese"], addOnLabels: ["Cheese"], qty: 1, lineTotal: 5_500 },
    ]);
  });
});

describe("computeLines", () => {
  it("returns an empty array for an empty cart", () => {
    expect(computeLines({}, menu)).toEqual([]);
  });

  it("returns line items with qty and lineTotal", () => {
    expect(computeLines({ "item-a": 2 }, menu)).toEqual([
      {
        lineKey: "item-a",
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
        lineKey: "item-b",
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
        lineKey: "item-a",
        menuItemId: "item-a",
        name: "Brochettes",
        qty: 2,
        lineTotal: 6000,
        notes: "Extra spicy",
      },
    ]);
  });

  it("returns one checkout line per selected size", () => {
    expect(
      computeLines(
        { "item-c::small": 1, "item-c::family": 2 },
        menu,
        { "item-c::family": "Pack separately" }
      )
    ).toEqual([
      {
        lineKey: "item-c::small",
        menuItemId: "item-c",
        name: "Family Pilau",
        sizeOptionId: "small",
        sizeLabel: "Small",
        qty: 1,
        lineTotal: 5000,
      },
      {
        lineKey: "item-c::family",
        menuItemId: "item-c",
        name: "Family Pilau",
        sizeOptionId: "family",
        sizeLabel: "Family tray",
        qty: 2,
        lineTotal: 24000,
        notes: "Pack separately",
      },
    ]);
  });
});
