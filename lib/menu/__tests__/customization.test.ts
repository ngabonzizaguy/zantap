import { describe, expect, it } from "vitest";
import type { MenuItem } from "@/lib/types";
import {
  computeCustomizeTotal,
  CUSTOMIZATION_NOTES_MAX,
  emptySelection,
  INGREDIENTS_UI_ENABLED,
  resolveCustomization,
  sanitizeItemNotes,
  type CustomizationSelection,
  type ItemCustomization,
} from "@/lib/menu/customization";

const baseItem: MenuItem = {
  id: "item-1",
  vendorId: "v1",
  name: "Beef Brochettes",
  priceRwf: 7500,
  category: "Grill",
  isAvailable: true,
};

const customItem: MenuItem = {
  ...baseItem,
  id: "item-2",
  customization: {
    included: [
      { id: "beef", name: "Beef", defaultIncluded: true },
      { id: "onion", name: "Onions", defaultIncluded: true },
    ],
    addOns: [
      { id: "pineapple", name: "Pineapple", priceRwf: 500 },
      { id: "spicy", name: "Spicy sauce", priceRwf: 300 },
    ],
  },
};

const sizedItem: MenuItem = {
  ...baseItem,
  id: "item-sized",
  priceRwf: 5_000,
  sizeOptions: [
    { id: "small", label: "Small", priceRwf: 5_000, isAvailable: true },
    { id: "family", label: "Family tray", priceRwf: 12_000, isAvailable: true },
  ],
};

describe("INGREDIENTS_UI_ENABLED", () => {
  it("is false so the customize modal shows images + notes only", () => {
    expect(INGREDIENTS_UI_ENABLED).toBe(false);
  });
});

describe("CUSTOMIZATION_NOTES_MAX", () => {
  it("caps special-instructions length", () => {
    expect(CUSTOMIZATION_NOTES_MAX).toBe(200);
  });
});

describe("sanitizeItemNotes", () => {
  it("trims whitespace and drops empty strings", () => {
    expect(sanitizeItemNotes("  no onions  ")).toBe("no onions");
    expect(sanitizeItemNotes("   ")).toBeUndefined();
  });

  it("caps at CUSTOMIZATION_NOTES_MAX characters", () => {
    const long = "a".repeat(CUSTOMIZATION_NOTES_MAX + 50);
    expect(sanitizeItemNotes(long)?.length).toBe(CUSTOMIZATION_NOTES_MAX);
  });
});

describe("resolveCustomization", () => {
  it("returns the item's own customization when present", () => {
    expect(resolveCustomization(customItem)).toBe(customItem.customization);
  });

  it("returns a generic fallback when the item has none", () => {
    const resolved = resolveCustomization(baseItem);
    expect(resolved.included.length).toBeGreaterThan(0);
    expect(resolved.addOns.length).toBeGreaterThan(0);
  });

  it("fallback options carry stable string ids and integer add-on prices", () => {
    const resolved: ItemCustomization = resolveCustomization(baseItem);
    for (const inc of resolved.included) {
      expect(typeof inc.id).toBe("string");
      expect(inc.id.length).toBeGreaterThan(0);
    }
    for (const addOn of resolved.addOns) {
      expect(typeof addOn.id).toBe("string");
      expect(Number.isInteger(addOn.priceRwf)).toBe(true);
    }
  });
});

describe("emptySelection", () => {
  it("starts at qty 1 with nothing removed or added", () => {
    expect(emptySelection(customItem)).toEqual<CustomizationSelection>({
      menuItemId: "item-2",
      qty: 1,
      removedIncludedIds: [],
      addOns: [],
      notes: "",
    });
  });
});

describe("computeCustomizeTotal", () => {
  it("returns base × qty when nothing is added", () => {
    const selection = { ...emptySelection(customItem), qty: 3 };
    expect(computeCustomizeTotal(selection, customItem)).toBe(7500 * 3);
  });

  it("adds selected add-on prices before multiplying by qty", () => {
    const selection: CustomizationSelection = {
      ...emptySelection(customItem),
      qty: 2,
      addOns: [{ id: "pineapple", qty: 1 }],
    };
    expect(computeCustomizeTotal(selection, customItem)).toBe((7500 + 500) * 2);
  });

  it("multiplies an add-on by its own qty", () => {
    const selection: CustomizationSelection = {
      ...emptySelection(customItem),
      addOns: [{ id: "pineapple", qty: 3 }],
    };
    expect(computeCustomizeTotal(selection, customItem)).toBe(7500 + 500 * 3);
  });

  it("treats removals as price-neutral", () => {
    const selection: CustomizationSelection = {
      ...emptySelection(customItem),
      removedIncludedIds: ["beef", "onion"],
    };
    expect(computeCustomizeTotal(selection, customItem)).toBe(7500);
  });

  it("ignores add-on ids that are not in the item's catalog", () => {
    const selection: CustomizationSelection = {
      ...emptySelection(customItem),
      addOns: [{ id: "does-not-exist", qty: 5 }],
    };
    expect(computeCustomizeTotal(selection, customItem)).toBe(7500);
  });

  it("prices add-ons against the generic fallback for items with no catalog", () => {
    const { addOns } = resolveCustomization(baseItem);
    const first = addOns[0];
    const selection: CustomizationSelection = {
      ...emptySelection(baseItem),
      addOns: [{ id: first.id, qty: 1 }],
    };
    expect(computeCustomizeTotal(selection, baseItem)).toBe(
      baseItem.priceRwf + first.priceRwf
    );
  });

  it("uses the selected persisted size price as the base", () => {
    const selection: CustomizationSelection = {
      ...emptySelection(sizedItem),
      sizeOptionId: "family",
      qty: 2,
    };
    expect(computeCustomizeTotal(selection, sizedItem)).toBe(24_000);
  });
});
