import { describe, expect, it } from "vitest";
import type { MenuImage, MenuItem } from "@/lib/types";
import { getMenuItemGalleryUrls } from "@/lib/menu/media";

const baseItem: MenuItem = {
  id: "item-1",
  vendorId: "v1",
  name: "Brochettes",
  priceRwf: 3500,
  category: "Grill",
  isAvailable: true,
};

function image(
  overrides: Partial<MenuImage> & Pick<MenuImage, "id" | "sortOrder" | "url">
): MenuImage {
  return {
    menuItemId: "item-1",
    isPrimary: false,
    createdAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("getMenuItemGalleryUrls", () => {
  it("returns sorted non-empty URLs from gallery rows", () => {
    const item: MenuItem = {
      ...baseItem,
      images: [
        image({ id: "b", sortOrder: 1, url: "https://cdn/b.jpg" }),
        image({ id: "a", sortOrder: 0, url: "https://cdn/a.jpg" }),
      ],
    };

    expect(getMenuItemGalleryUrls(item)).toEqual([
      "https://cdn/a.jpg",
      "https://cdn/b.jpg",
    ]);
  });

  it("falls back to legacy imageUrl when no gallery rows", () => {
    const item: MenuItem = {
      ...baseItem,
      imageUrl: "https://cdn/legacy.jpg",
    };

    expect(getMenuItemGalleryUrls(item)).toEqual(["https://cdn/legacy.jpg"]);
  });

  it("filters empty URLs and falls back to imageUrl when gallery is empty", () => {
    const item: MenuItem = {
      ...baseItem,
      imageUrl: "https://cdn/legacy.jpg",
      images: [image({ id: "x", sortOrder: 0, url: "   " })],
    };

    expect(getMenuItemGalleryUrls(item)).toEqual(["https://cdn/legacy.jpg"]);
  });

  it("returns two URLs when item has two gallery images", () => {
    const item: MenuItem = {
      ...baseItem,
      images: [
        image({ id: "1", sortOrder: 0, url: "https://cdn/1.jpg" }),
        image({ id: "2", sortOrder: 1, url: "https://cdn/2.jpg" }),
      ],
    };

    expect(getMenuItemGalleryUrls(item)).toHaveLength(2);
  });

  it("returns empty array when no images and no legacy URL", () => {
    expect(getMenuItemGalleryUrls(baseItem)).toEqual([]);
  });
});
