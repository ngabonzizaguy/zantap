import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  archiveMenuItem,
  createMenuItem,
  restoreMenuItem,
  updateMenuItem,
} from "@/lib/actions/vendor-menu";
import { getStore } from "@/lib/store";
import {
  DEMO_OWNER_TOKEN,
  DEMO_VENDOR_SLUG,
} from "@/lib/store/seed-data";
import type { ResettableStore } from "@/lib/store/types";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

describe("Vendor menu update publication", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(async () => {
    delete process.env.DATABASE_URL;
    delete globalForStore.__zantapStore;
    await (getStore() as ResettableStore).reset();
  });

  afterEach(() => {
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
    delete globalForStore.__zantapStore;
  });

  it("publishes qualifying saves while keeping descriptive edits and archive silent", async () => {
    const created = await createMenuItem(
      DEMO_OWNER_TOKEN,
      DEMO_VENDOR_SLUG,
      { name: "Isombe", priceRwf: 4_000 }
    );
    expect((await getStore().getVendorUpdateOverview(DEMO_VENDOR_SLUG))?.activeBatch)
      .toEqual(expect.objectContaining({ revision: 1 }));

    await updateMenuItem(DEMO_OWNER_TOKEN, DEMO_VENDOR_SLUG, created.id, {
      name: "Isombe special",
      description: "New wording",
    });
    await archiveMenuItem(DEMO_OWNER_TOKEN, DEMO_VENDOR_SLUG, created.id);
    expect((await getStore().getVendorUpdateOverview(DEMO_VENDOR_SLUG))?.activeBatch)
      .toEqual(expect.objectContaining({ revision: 1 }));

    await restoreMenuItem(DEMO_OWNER_TOKEN, DEMO_VENDOR_SLUG, created.id);
    await updateMenuItem(
      DEMO_OWNER_TOKEN,
      DEMO_VENDOR_SLUG,
      created.id,
      { priceRwf: 4_500 },
      { announce: false }
    );
    const batch = (await getStore().getVendorUpdateOverview(DEMO_VENDOR_SLUG))
      ?.activeBatch;
    expect(batch?.revision).toBe(2);
    expect(batch?.entries.map((entry) => entry.type)).toEqual([
      "NEW_DISH",
      "DISH_RESTORED",
    ]);
  });
});
