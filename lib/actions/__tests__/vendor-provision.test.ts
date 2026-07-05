import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createMenuItem } from "@/lib/actions/vendor-menu";
import {
  checkSlugAvailable,
  provisionVendor,
  recoverOwnerToken,
} from "@/lib/actions/vendor-provision";
import { getStore } from "@/lib/store";
import { DEMO_VENDOR_SLUG } from "@/lib/store/seed-data";
import type { ResettableStore } from "@/lib/store/types";
import { verifyOwnerToken } from "@/lib/vendor/owner-token";
import { OwnerTokenError } from "@/lib/vendor/owner-token-guard";
import { ProvisioningClosedError } from "@/lib/vendor/provision-gate";
import { __resetRateLimits, RateLimitError } from "@/lib/vendor/rate-limit";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

const validInput = {
  name: "Sunrise Café",
  slug: "sunrise-cafe",
  phoneNumber: "0788 123 456",
  momoCode: "MOMO001",
};

describe("vendor-provision actions", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalKillSwitch = process.env.PROVISION_KILL_SWITCH;

  beforeEach(async () => {
    delete process.env.DATABASE_URL;
    delete process.env.PROVISION_KILL_SWITCH;
    delete globalForStore.__zantapStore;
    __resetRateLimits();
    const store = getStore() as ResettableStore;
    await store.reset();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalKillSwitch === undefined) {
      delete process.env.PROVISION_KILL_SWITCH;
    } else {
      process.env.PROVISION_KILL_SWITCH = originalKillSwitch;
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
    it("provisions gate-free (no provision secret) and mints an owner token", async () => {
      const { vendor, menuItem, ownerToken } = await provisionVendor(
        validInput,
        { name: "Morning Brew", priceRwf: 3000 }
      );

      expect(vendor.slug).toBe("sunrise-cafe");
      expect(vendor.name).toBe("Sunrise Café");
      expect(vendor.phoneNumber).toBe("0788123456");
      expect(vendor.payoutMethod).toBe("MERCHANT_CODE");
      expect(menuItem?.name).toBe("Morning Brew");
      expect(menuItem?.priceRwf).toBe(3000);

      // Plaintext token is returned once; only its hash is persisted.
      expect(ownerToken).toBeTruthy();
      const hash = await getStore().getVendorOwnerTokenHash("sunrise-cafe");
      expect(hash).toBeTruthy();
      expect(verifyOwnerToken(ownerToken, hash)).toBe(true);
    });

    it("persists businessCategory + payoutMethod", async () => {
      const { vendor } = await provisionVendor({
        ...validInput,
        slug: "payout-phone-cafe",
        businessCategory: "Coffee",
        payoutMethod: "PHONE",
        momoCode: "+250 788 123 456",
      });

      const fetched = await getStore().getVendorBySlug("payout-phone-cafe");
      expect(fetched?.businessCategory).toBe("Coffee");
      expect(vendor.payoutMethod).toBe("PHONE");
      expect(vendor.momoCode).toBe("0788123456");
    });

    it("returns a token that unlocks that vendor's guarded writes", async () => {
      const { ownerToken } = await provisionVendor(validInput);

      await expect(
        createMenuItem(ownerToken, "sunrise-cafe", {
          name: "Latte",
          priceRwf: 2000,
        })
      ).resolves.toMatchObject({ name: "Latte" });

      await expect(
        createMenuItem("wrong-token", "sunrise-cafe", {
          name: "Nope",
          priceRwf: 1000,
        })
      ).rejects.toThrow(OwnerTokenError);
    });

    it("rejects a duplicate slug before create", async () => {
      await expect(
        provisionVendor({ ...validInput, slug: DEMO_VENDOR_SLUG })
      ).rejects.toThrow("This storefront URL is already taken");
    });

    it("creates vendor without starter item when omitted", async () => {
      const { vendor, menuItem } = await provisionVendor({
        ...validInput,
        slug: "no-starter-cafe",
      });

      expect(vendor.slug).toBe("no-starter-cafe");
      expect(menuItem).toBeUndefined();

      const menu = await getStore().getAvailableMenu("no-starter-cafe");
      expect(menu).toHaveLength(0);
    });

    it("is blocked when the kill-switch env is engaged", async () => {
      process.env.PROVISION_KILL_SWITCH = "1";
      await expect(provisionVendor(validInput)).rejects.toThrow(
        ProvisioningClosedError
      );
    });

    it("rate-limits rapid provisioning bursts", async () => {
      // PROVISION_LIMIT = 10 per window; the 11th within the window trips.
      for (let i = 0; i < 10; i++) {
        await provisionVendor({ ...validInput, slug: `burst-cafe-${i}` });
      }
      await expect(
        provisionVendor({ ...validInput, slug: "burst-cafe-over" })
      ).rejects.toThrow(RateLimitError);
    });
  });

  describe("recoverOwnerToken", () => {
    it("re-issues the token on slug + phone match and records an event", async () => {
      const { vendor } = await provisionVendor(validInput);
      const before = await getStore().getVendorOwnerTokenHash("sunrise-cafe");

      const result = await recoverOwnerToken("sunrise-cafe", "0788123456");
      expect(result.ok).toBe(true);

      const after = await getStore().getVendorOwnerTokenHash("sunrise-cafe");
      expect(after).toBeTruthy();
      expect(after).not.toBe(before);
      if (result.ok) {
        expect(verifyOwnerToken(result.ownerToken, after)).toBe(true);
      }

      const events = await getStore().listRecoveryEvents(vendor.id);
      expect(events).toHaveLength(1);
      expect(events[0]?.context).toBe("phone-recovery");
    });

    it("returns a generic miss for a wrong phone (no enumeration)", async () => {
      await provisionVendor(validInput);
      const result = await recoverOwnerToken("sunrise-cafe", "0700000000");
      expect(result.ok).toBe(false);
    });

    it("returns a generic miss for an unknown slug", async () => {
      const result = await recoverOwnerToken("does-not-exist", "0788123456");
      expect(result.ok).toBe(false);
    });

    it.each([
      {
        label: "intl stored (+250), local recovery (07…)",
        storePhone: "+250 788 123 456",
        recoverPhone: "0788123456",
      },
      {
        label: "local stored (07…), intl recovery (+250)",
        storePhone: "0788 123 456",
        recoverPhone: "+250 788 123 456",
      },
      {
        label: "national stored (250…), local recovery (07…)",
        storePhone: "250788123456",
        recoverPhone: "0788123456",
      },
      {
        label: "national stored (250…), intl recovery (+250)",
        storePhone: "250788123456",
        recoverPhone: "+250 788 123 456",
      },
      {
        label: "local stored (07…), national recovery (250…)",
        storePhone: "0788 123 456",
        recoverPhone: "250788123456",
      },
    ])(
      "recovers when formats differ ($label)",
      async ({ storePhone, recoverPhone }) => {
        await provisionVendor({
          ...validInput,
          phoneNumber: storePhone,
        });

        const result = await recoverOwnerToken("sunrise-cafe", recoverPhone);
        expect(result.ok).toBe(true);
        if (result.ok) {
          const hash = await getStore().getVendorOwnerTokenHash("sunrise-cafe");
          expect(verifyOwnerToken(result.ownerToken, hash)).toBe(true);
        }
      }
    );

    it("does not match payout/MoMo number — business phone only", async () => {
      await provisionVendor({
        ...validInput,
        phoneNumber: "+250 788 123 456",
        momoCode: "+250 780 999 888",
        payoutMethod: "PHONE",
      });

      const result = await recoverOwnerToken("sunrise-cafe", "0780999888");
      expect(result.ok).toBe(false);
    });

    it("rate-limits recovery attempts per slug", async () => {
      await provisionVendor(validInput);
      // RECOVERY_LIMIT = 5 per window; the 6th trips.
      for (let i = 0; i < 5; i++) {
        await recoverOwnerToken("sunrise-cafe", "0700000000");
      }
      await expect(
        recoverOwnerToken("sunrise-cafe", "0700000000")
      ).rejects.toThrow(RateLimitError);
    });
  });
});
