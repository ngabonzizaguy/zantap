import { describe, expect, it } from "vitest";
import {
  buildStorefrontMenuHref,
  parseStorefrontMenuQuery,
  STOREFRONT_MENU_PAGE_SIZE,
  paginateStorefrontMenu,
} from "@/lib/menu/storefront-pagination";
import type { MenuItem } from "@/lib/types";

function menuItem(
  index: number,
  overrides: Partial<MenuItem> = {}
): MenuItem {
  return {
    id: `item-${index}`,
    vendorId: "vendor-1",
    name: `Dish ${index}`,
    description: `Description ${index}`,
    priceRwf: 1_000 + index,
    category: index % 2 === 0 ? "Grills" : "Sides",
    isAvailable: true,
    ...overrides,
  };
}

describe("storefront menu pagination", () => {
  it("excludes unavailable dishes before limiting a page to ten", () => {
    const menu = [
      menuItem(0, { isAvailable: false }),
      ...Array.from({ length: 12 }, (_, index) => menuItem(index + 1)),
    ];

    const result = paginateStorefrontMenu(menu, {
      category: "All",
      search: "",
      page: 1,
    });

    expect(result.items).toHaveLength(STOREFRONT_MENU_PAGE_SIZE);
    expect(result.items.some((item) => !item.isAvailable)).toBe(false);
    expect(result).toMatchObject({ total: 12, page: 1, pageCount: 2 });
  });

  it("filters by category and search before slicing and safely clamps pages", () => {
    const menu = Array.from({ length: 24 }, (_, index) =>
      menuItem(index, {
        name: index % 2 === 0 ? `Spicy grill ${index}` : `Mild side ${index}`,
      })
    );

    const result = paginateStorefrontMenu(menu, {
      category: "Grills",
      search: "spicy",
      page: 99,
    });

    expect(result).toMatchObject({ total: 12, page: 2, pageCount: 2 });
    expect(result.items).toHaveLength(2);
    expect(
      result.items.every(
        (item) => item.category === "Grills" && item.name.includes("Spicy")
      )
    ).toBe(true);
  });

  it("parses safe shareable URL state and preserves unrelated parameters", () => {
    expect(
      parseStorefrontMenuQuery(
        { category: "Grills", search: "  spicy  ", page: "2" },
        ["All", "Grills", "Sides"]
      )
    ).toEqual({ category: "Grills", search: "spicy", page: 2 });
    expect(
      parseStorefrontMenuQuery(
        { category: "Missing", search: ["chips", "ignored"], page: "-7" },
        ["All", "Grills", "Sides"]
      )
    ).toEqual({ category: "All", search: "chips", page: 1 });

    expect(
      buildStorefrontMenuHref(
        "/inka-steakhouse",
        new URLSearchParams("from=kds"),
        { category: "Grills", search: "spicy", page: 2 }
      )
    ).toBe("/inka-steakhouse?from=kds&category=Grills&search=spicy&page=2");
    expect(
      buildStorefrontMenuHref(
        "/inka-steakhouse",
        new URLSearchParams("from=kds&category=Grills&search=spicy&page=2"),
        { category: "All", search: "", page: 1 }
      )
    ).toBe("/inka-steakhouse?from=kds");
  });

  it("keeps empty and one-page result sets on an accessible first page", () => {
    expect(
      paginateStorefrontMenu([], { category: "All", search: "", page: 8 })
    ).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
    expect(
      paginateStorefrontMenu([menuItem(1)], {
        category: "All",
        search: "missing",
        page: Number.NaN,
      })
    ).toMatchObject({ items: [], total: 0, page: 1, pageCount: 1 });
  });
});
