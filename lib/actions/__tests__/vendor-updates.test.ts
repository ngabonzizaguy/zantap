import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadVendorUpdateOverview,
  setVendorUpdatesEnabled,
} from "@/lib/actions/vendor-updates";
import { getStore } from "@/lib/store";
import {
  DEMO_OWNER_TOKEN,
  DEMO_VENDOR_SLUG,
} from "@/lib/store/seed-data";
import type { ResettableStore } from "@/lib/store/types";
import { OwnerTokenError } from "@/lib/vendor/owner-token-guard";

const globalForStore = globalThis as unknown as { __zantapStore?: unknown };

describe("Vendor update controls", () => {
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

  it("guards the global switch and returns the updated KDS overview", async () => {
    await expect(
      setVendorUpdatesEnabled("bad-token", DEMO_VENDOR_SLUG, false)
    ).rejects.toThrow(OwnerTokenError);

    const updated = await setVendorUpdatesEnabled(
      DEMO_OWNER_TOKEN,
      DEMO_VENDOR_SLUG,
      false
    );
    expect(updated?.settings.enabled).toBe(false);
    expect((await loadVendorUpdateOverview(DEMO_VENDOR_SLUG))?.settings.enabled)
      .toBe(false);
  });
});
