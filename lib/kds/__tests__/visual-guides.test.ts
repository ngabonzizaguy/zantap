import { describe, expect, it } from "vitest";

import {
  deriveKdsReadiness,
  recordReadinessGuideChoice,
  recordReadinessGuideDismissal,
  shouldAutoShowReadinessGuide,
} from "@/lib/kds/visual-guides";
import type { MenuItem, Vendor } from "@/lib/types";

const vendor: Vendor = {
  id: "vendor-ready",
  name: "Ready Kitchen",
  slug: "ready-kitchen",
  phoneNumber: "0788123456",
  momoCode: "880001",
  isActive: true,
  location: "Kigali",
  logoUrl: "https://cdn.example.com/logo.png",
  coverImageUrl: "https://cdn.example.com/cover.png",
  description: "Fresh lunch every day",
  payoutMethod: "MERCHANT_CODE",
  featureWhatsappNotify: false,
  featureStockTracking: false,
  featureProfitInsights: false,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
};

const menu: MenuItem[] = [
  {
    id: "dish-1",
    vendorId: vendor.id,
    name: "Brochettes",
    priceRwf: 4_500,
    category: "Grills",
    isAvailable: true,
  },
];

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("KDS readiness guide", () => {
  it("derives the approved four-row ready state from live product data", () => {
    const readiness = deriveKdsReadiness({ vendor, menu, kitchenOpen: true });

    expect(readiness.items.map((item) => [item.id, item.complete])).toEqual([
      ["storefront", true],
      ["menu", true],
      ["payment", true],
      ["kitchen", true],
    ]);
    expect(readiness.completedCount).toBe(4);
    expect(readiness.isReady).toBe(true);
  });

  it("keeps each row incomplete until its real requirement is usable", () => {
    const readiness = deriveKdsReadiness({
      vendor: {
        ...vendor,
        coverImageUrl: undefined,
        momoCode: "not-a-merchant-code",
      },
      menu: menu.map((item) => ({ ...item, archivedAt: new Date() })),
      kitchenOpen: false,
    });

    expect(readiness.items.map((item) => [item.id, item.complete])).toEqual([
      ["storefront", false],
      ["menu", false],
      ["payment", false],
      ["kitchen", false],
    ]);
    expect(readiness.completedCount).toBe(0);
    expect(readiness.isReady).toBe(false);
  });

  it("tells the Vendor exactly where to start the first missing storefront detail", () => {
    const readiness = deriveKdsReadiness({
      vendor: {
        ...vendor,
        logoUrl: undefined,
        coverImageUrl: undefined,
      },
      menu,
      kitchenOpen: true,
    });

    expect(readiness.items[0]).toMatchObject({
      detail: "Add your logo",
      actionLabel: "Show me where",
      remainingCount: 2,
      target: "storefront-logo",
    });
  });

  it("advances the storefront target after a live detail is saved", () => {
    const readiness = deriveKdsReadiness({
      vendor: {
        ...vendor,
        coverImageUrl: undefined,
        description: undefined,
      },
      menu,
      kitchenOpen: true,
    });

    expect(readiness.items[0]).toMatchObject({
      detail: "Add a cover photo",
      target: "storefront-cover",
    });
  });

  it("gives every incomplete readiness row a plain direct destination", () => {
    const readiness = deriveKdsReadiness({
      vendor: { ...vendor, momoCode: "not-ready" },
      menu: [],
      kitchenOpen: false,
    });

    expect(readiness.items.slice(1)).toMatchObject([
      {
        detail: "No available dishes",
        actionLabel: "Show me where",
        target: "menu-add",
      },
      {
        detail: "Choose where payments go",
        actionLabel: "Show me where",
        target: "payment-setup",
      },
      {
        detail: "Open your kitchen",
        actionLabel: "Show me where",
        target: "kitchen-toggle",
      },
    ]);
  });

  it("auto-offers only to a fresh incomplete Vendor/device", () => {
    const storage = memoryStorage();
    const incomplete = deriveKdsReadiness({
      vendor: { ...vendor, coverImageUrl: undefined },
      menu,
      kitchenOpen: true,
    });
    const ready = deriveKdsReadiness({ vendor, menu, kitchenOpen: true });

    expect(
      shouldAutoShowReadinessGuide(storage, vendor.slug, incomplete)
    ).toBe(true);
    expect(shouldAutoShowReadinessGuide(storage, vendor.slug, ready)).toBe(
      false
    );
  });

  it.each(["guided", "self"] as const)(
    "%s choice stops future automatic openings for only that Vendor/device",
    (choice) => {
      const storage = memoryStorage();
      const incomplete = deriveKdsReadiness({
        vendor: { ...vendor, coverImageUrl: undefined },
        menu,
        kitchenOpen: true,
      });

      recordReadinessGuideChoice(storage, vendor.slug, choice);

      expect(
        shouldAutoShowReadinessGuide(storage, vendor.slug, incomplete)
      ).toBe(false);
      expect(
        shouldAutoShowReadinessGuide(storage, "another-vendor", incomplete)
      ).toBe(true);
    }
  );

  it("treats the first close as not now and the second as the final offer", () => {
    const storage = memoryStorage();
    const incomplete = deriveKdsReadiness({
      vendor: { ...vendor, coverImageUrl: undefined },
      menu,
      kitchenOpen: true,
    });

    expect(recordReadinessGuideDismissal(storage, vendor.slug)).toBe(1);
    expect(
      shouldAutoShowReadinessGuide(storage, vendor.slug, incomplete)
    ).toBe(true);

    expect(recordReadinessGuideDismissal(storage, vendor.slug)).toBe(2);
    expect(
      shouldAutoShowReadinessGuide(storage, vendor.slug, incomplete)
    ).toBe(false);
  });
});
