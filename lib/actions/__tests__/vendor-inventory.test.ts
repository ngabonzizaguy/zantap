import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  adjustInventoryItem,
  archiveInventoryItem,
  createInventoryItem,
  restoreInventoryItem,
  updateInventoryItem,
} from "@/lib/actions/vendor-inventory";
import { provisionVendor } from "@/lib/actions/vendor-provision";
import { getStore } from "@/lib/store";
import type { ResettableStore } from "@/lib/store/types";
import { OwnerTokenError } from "@/lib/vendor/owner-token-guard";
import { __resetRateLimits } from "@/lib/vendor/rate-limit";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

describe("vendor inventory actions", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(async () => {
    delete process.env.DATABASE_URL;
    delete globalForStore.__zantapStore;
    __resetRateLimits();
    await (getStore() as ResettableStore).reset();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    delete globalForStore.__zantapStore;
  });

  it("rejects a create with an invalid vendor owner token", async () => {
    const { vendor } = await provisionVendor({
      name: "Inventory Test Kitchen",
      slug: "inventory-test-kitchen",
      phoneNumber: "0788111222",
      momoCode: "880001",
    });

    await expect(
      createInventoryItem("bad-token", vendor.slug, {
        name: "Rice",
        quantity: 3,
        unit: "bags",
        lowStockThreshold: 1,
        category: "Ingredients",
      })
    ).rejects.toThrow(OwnerTokenError);
  });

  it("guards edit, adjustment, archive, and restore with the same owner token", async () => {
    const { vendor, ownerToken } = await provisionVendor({
      name: "Guarded Inventory Kitchen",
      slug: "guarded-inventory-kitchen",
      phoneNumber: "0788333444",
      momoCode: "880002",
    });
    const item = await createInventoryItem(ownerToken, vendor.slug, {
      name: "Bottles",
      quantity: 8,
      unit: "bottles",
      lowStockThreshold: 2,
      category: "Drinks",
    });

    await expect(
      updateInventoryItem("bad-token", vendor.slug, item.id, { name: "Water bottles" })
    ).rejects.toThrow(OwnerTokenError);
    await expect(
      adjustInventoryItem("bad-token", vendor.slug, item.id, {
        type: "USED",
        quantity: 1,
      })
    ).rejects.toThrow(OwnerTokenError);
    await expect(
      archiveInventoryItem("bad-token", vendor.slug, item.id)
    ).rejects.toThrow(OwnerTokenError);
    await expect(
      restoreInventoryItem("bad-token", vendor.slug, item.id)
    ).rejects.toThrow(OwnerTokenError);
  });
});
