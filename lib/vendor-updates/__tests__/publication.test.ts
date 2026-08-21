import { describe, expect, it } from "vitest";
import {
  buildMenuUpdateEntry,
  buildProfileUpdateEntry,
} from "@/lib/vendor-updates/publication";
import type { MenuItem, Vendor } from "@/lib/types";

const menuItem: MenuItem = {
  id: "dish-1",
  vendorId: "vendor-1",
  name: "Isombe",
  description: "Cassava leaves",
  priceRwf: 4_000,
  imageUrl: "https://img.test/old.jpg",
  category: "Mains",
  isAvailable: true,
};

const vendor: Vendor = {
  id: "vendor-1",
  name: "Inka",
  slug: "inka",
  phoneNumber: "250788123456",
  momoCode: "880001",
  isActive: true,
  payoutMethod: "MERCHANT_CODE",
  featureWhatsappNotify: false,
  featureStockTracking: false,
  featureProfitInsights: false,
  createdAt: new Date("2026-08-21T08:00:00.000Z"),
};

describe("Vendor update publication", () => {
  it("publishes a price change with only approved public dish fields", () => {
    expect(
      buildMenuUpdateEntry(menuItem, { ...menuItem, priceRwf: 4_500 })
    ).toEqual({
      type: "PRICE_CHANGE",
      subjectId: "dish-1",
      name: "Isombe",
      imageUrl: "https://img.test/old.jpg",
      oldPriceRwf: 4_000,
      currentPriceRwf: 4_500,
    });
  });

  it("keeps name, description, availability, Stock, and cost-only edits silent", () => {
    expect(
      buildMenuUpdateEntry(menuItem, {
        ...menuItem,
        name: "Isombe special",
        description: "New words",
        isAvailable: false,
        stockCount: 2,
        lowStockThreshold: 1,
        costPriceRwf: 1_500,
      })
    ).toBeNull();
  });

  it("normalizes profile values so equivalent saves do not publish", () => {
    expect(
      buildProfileUpdateEntry(vendor, {
        ...vendor,
        tagline: "  Great food  ",
      })
    ).not.toBeNull();
    expect(
      buildProfileUpdateEntry(
        { ...vendor, tagline: "Great food" },
        { ...vendor, tagline: "  Great food  " }
      )
    ).toBeNull();
  });
});
