import { describe, expect, it } from "vitest";

import {
  deriveReadinessContext,
  deriveKdsReadiness,
  deriveMissingStorefrontReadiness,
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
  it("orders every missing storefront detail for one guided save", () => {
    expect(
      deriveMissingStorefrontReadiness({
        logoUrl: "",
        coverImageUrl: undefined,
        description: "",
        location: "Kigali",
        phoneNumber: "",
      })
    ).toEqual([
      { detail: "Add your logo", target: "storefront-logo" },
      { detail: "Add a cover photo", target: "storefront-cover" },
      {
        detail: "Add your business description",
        target: "storefront-description",
      },
      { detail: "Add your phone number", target: "storefront-phone" },
    ]);
  });

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
      contextStatus: "Missing: logo, cover photo",
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

  it("builds one contextual guide contract for every readiness row", () => {
    const readiness = deriveKdsReadiness({ vendor, menu, kitchenOpen: true });

    expect(
      readiness.items.map((item) => deriveReadinessContext(item, readiness))
    ).toMatchObject([
      {
        itemId: "storefront",
        actionLabel: "View setup",
        status: "All customer details are ready",
        screenshotSrc: expect.stringContaining("kds-full-business-logo"),
      },
      {
        itemId: "menu",
        actionLabel: "View setup",
        status: "1 available dish",
        screenshotSrc: expect.stringContaining("kds-menuitem-crud-additem"),
      },
      {
        itemId: "payment",
        actionLabel: "View setup",
        status: "Merchant code •••0001",
        screenshotSrc: expect.stringContaining("payment_settings"),
      },
      {
        itemId: "kitchen",
        actionLabel: "View setup",
        status: "OPEN — customers can order",
        screenshotSrc: expect.stringContaining("kds-dashboard"),
      },
    ]);
  });

  it("masks payment destinations and warns without blocking kitchen opening", () => {
    const readiness = deriveKdsReadiness({
      vendor: { ...vendor, payoutMethod: "PHONE", momoCode: "0788123456" },
      menu: [],
      kitchenOpen: false,
    });
    const payment = deriveReadinessContext(readiness.items[2], readiness);
    const kitchen = deriveReadinessContext(readiness.items[3], readiness);

    expect(payment.status).toBe("Phone •••3456");
    expect(payment.status).not.toContain("0788123456");
    expect(kitchen.actionLabel).toBe("Show me");
    expect(kitchen.warning).toContain("menu");
    expect(kitchen.warning).not.toContain("blocked");
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
