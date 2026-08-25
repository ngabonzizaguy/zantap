import { describe, expect, it } from "vitest";
import type { MenuItem, MenuItemSizeOption } from "@/lib/types";
import {
  buildCartLineKey,
  createDefaultSizeOptions,
  getMenuItemPrice,
  getMenuItemSizeOptions,
  getMenuItemStartingPrice,
  parseCartLineKey,
} from "@/lib/menu/sizes";
import {
  validateCreateMenuItemInput,
  validateUpdateMenuItemInput,
} from "@/lib/menu/validation";

const singlePriceItem: MenuItem = {
  id: "item-1",
  vendorId: "vendor-1",
  name: "Beef Pilau",
  priceRwf: 15_000,
  category: "Mains",
  isAvailable: true,
};

const sizeOptions: MenuItemSizeOption[] = [
  { id: "small", label: "Small", priceRwf: 15_000, isAvailable: true },
  { id: "medium", label: "Medium", priceRwf: 25_000, isAvailable: true },
  { id: "family", label: "Family tray", priceRwf: 40_000, isAvailable: false },
];

const sizedItem: MenuItem = {
  ...singlePriceItem,
  sizeOptions,
};

describe("menu item size options", () => {
  it("returns no options for a legacy single-price item", () => {
    expect(getMenuItemSizeOptions(singlePriceItem)).toEqual([]);
    expect(getMenuItemPrice(singlePriceItem)).toBe(15_000);
  });

  it("preserves custom labels and order while hiding disabled options publicly", () => {
    expect(getMenuItemSizeOptions(sizedItem)).toEqual(sizeOptions);
    expect(getMenuItemSizeOptions(sizedItem, { availableOnly: true })).toEqual(
      sizeOptions.slice(0, 2)
    );
  });

  it("resolves an enabled option without trusting a client price", () => {
    expect(getMenuItemPrice(sizedItem, "medium")).toBe(25_000);
    expect(() => getMenuItemPrice(sizedItem)).toThrow(/choose a size/i);
    expect(() => getMenuItemPrice(sizedItem, "family")).toThrow(/unavailable/i);
    expect(() => getMenuItemPrice(singlePriceItem, "small")).toThrow(/does not offer/i);
  });

  it("derives the starting price from the cheapest enabled option", () => {
    expect(getMenuItemStartingPrice(sizedItem)).toBe(15_000);
    expect(getMenuItemStartingPrice(singlePriceItem)).toBe(15_000);
  });

  it("creates the Small, Medium, Large reset preset", () => {
    expect(createDefaultSizeOptions(7_500)).toEqual([
      { id: "small", label: "Small", priceRwf: 7_500, isAvailable: true },
      { id: "medium", label: "Medium", priceRwf: 7_500, isAvailable: true },
      { id: "large", label: "Large", priceRwf: 7_500, isAvailable: true },
    ]);
  });

  it("round-trips stable cart line keys for custom options", () => {
    expect(buildCartLineKey("item-1")).toBe("item-1");
    expect(buildCartLineKey("item-1", "family-tray")).toBe(
      "item-1::family-tray"
    );
    expect(parseCartLineKey("item-1")).toEqual({ menuItemId: "item-1" });
    expect(parseCartLineKey("item-1::family-tray")).toEqual({
      menuItemId: "item-1",
      sizeOptionId: "family-tray",
    });
  });

  it("accepts custom options and rejects invalid collections", () => {
    expect(
      validateCreateMenuItemInput({
        name: "Pilau",
        priceRwf: 15_000,
        sizeOptions,
      })
    ).toBeNull();
    expect(
      validateUpdateMenuItemInput({
        sizeOptions: [
          { id: "same", label: "Small", priceRwf: 15_000, isAvailable: true },
          { id: "same", label: "Large", priceRwf: 40_000, isAvailable: true },
        ],
      })
    ).toMatch(/unique id/i);
    expect(
      validateUpdateMenuItemInput({
        sizeOptions: [
          { id: "small", label: "Small", priceRwf: 15_000, isAvailable: false },
          { id: "large", label: "Large", priceRwf: 40_000, isAvailable: false },
        ],
      })
    ).toMatch(/at least one size/i);
    expect(validateUpdateMenuItemInput({ sizeOptions: null })).toBeNull();
  });
});
