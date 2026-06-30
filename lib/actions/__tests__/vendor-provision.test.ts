import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  checkSlugAvailable,
  provisionVendor,
} from "@/lib/actions/vendor-provision";
import { getStore } from "@/lib/store";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import type { ResettableStore } from "@/lib/store/types";
import { ProvisionSecretError } from "@/lib/vendor/provision-secret";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

const PROVISION_SECRET = "test-provision-secret";

const validInput = {
  name: "Sunrise Café",
  slug: "sunrise-cafe",
  phoneNumber: "0788 123 456",
  momoCode: "MOMO001",
};

describe("vendor-provision actions", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalProvisionSecret = process.env.PROVISION_SECRET;

  beforeEach(async () => {
    delete process.env.DATABASE_URL;
    delete globalForStore.__zantapStore;
    process.env.PROVISION_SECRET = PROVISION_SECRET;
    const store = getStore() as ResettableStore;
    await store.reset();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalProvisionSecret === undefined) {
      delete process.env.PROVISION_SECRET;
    } else {
      process.env.PROVISION_SECRET = originalProvisionSecret;
    }
    delete globalForStore.__zantapStore;
  });

  describe("checkSlugAvailable", () => {
    it("returns false for the seeded demo slug", async () => {
      expect(await checkSlugAvailable(DEMO_VENDOR_SLUG)).toBe(false);
    });

    it("returns true for an unused slug", async () => {
      expect(await checkSlugAvailable("brand-new-onboard-slug")).toBe(true);
    });

    it("normalizes slug before checking", async () => {
      expect(await checkSlugAvailable("  Brand-New-Onboard-Slug  ")).toBe(true);
    });
  });

  describe("provisionVendor", () => {
    it("rejects a wrong provision secret", async () => {
      await expect(
        provisionVendor("wrong-secret", validInput, {
          name: "Espresso",
          priceRwf: 2500,
        })
      ).rejects.toThrow(ProvisionSecretError);
    });

    it("rejects a missing provision secret", async () => {
      await expect(
        provisionVendor("", validInput, {
          name: "Espresso",
          priceRwf: 2500,
        })
      ).rejects.toThrow(ProvisionSecretError);
    });

    it("rejects a duplicate slug before create", async () => {
      await expect(
        provisionVendor(PROVISION_SECRET, {
          ...validInput,
          slug: DEMO_VENDOR_SLUG,
        })
      ).rejects.toThrow("This storefront URL is already taken");
    });

    it("creates vendor and starter item with available menu", async () => {
      const { vendor, menuItem } = await provisionVendor(
        PROVISION_SECRET,
        validInput,
        { name: "Morning Brew", priceRwf: 3000 }
      );

      expect(vendor.slug).toBe("sunrise-cafe");
      expect(vendor.name).toBe("Sunrise Café");
      expect(vendor.phoneNumber).toBe("0788123456");
      expect(menuItem?.name).toBe("Morning Brew");
      expect(menuItem?.priceRwf).toBe(3000);

      const store = getStore();
      const fetched = await store.getVendorBySlug("sunrise-cafe");
      expect(fetched?.id).toBe(vendor.id);

      const menu = await store.getAvailableMenu("sunrise-cafe");
      expect(menu.length).toBeGreaterThanOrEqual(1);
      expect(menu.some((item) => item.id === menuItem?.id)).toBe(true);
    });

    it("creates vendor without starter item when omitted", async () => {
      const { vendor, menuItem } = await provisionVendor(
        PROVISION_SECRET,
        { ...validInput, slug: "no-starter-cafe" }
      );

      expect(vendor.slug).toBe("no-starter-cafe");
      expect(menuItem).toBeUndefined();

      const menu = await getStore().getAvailableMenu("no-starter-cafe");
      expect(menu).toHaveLength(0);
    });
  });
});
