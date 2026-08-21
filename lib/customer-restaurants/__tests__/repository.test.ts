import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import { createInMemorySavedRestaurantRepository } from "@/lib/customer-restaurants/in-memory";
import { createIndexedDbSavedRestaurantRepository } from "@/lib/customer-restaurants/indexeddb";
import type { SavedRestaurantRepository } from "@/lib/customer-restaurants/types";

function savedRestaurantRepositoryContract(
  name: string,
  createRepository: () => SavedRestaurantRepository
) {
  describe(name, () => {
    it("upserts by stable Vendor ID, follows slug changes, refreshes recency, and removes", async () => {
      const repository = createRepository();

    await repository.save({
      vendorId: "vendor-1",
      slug: "old-slug",
      name: "Kigali Grill",
      lastInteractedAt: "2026-08-20T10:00:00.000Z",
    });
    await repository.save({
      vendorId: "vendor-1",
      slug: "new-slug",
      name: "Kigali Grill & Co",
      lastInteractedAt: "2026-08-21T10:00:00.000Z",
    });

    expect(await repository.list()).toEqual([
      expect.objectContaining({
        vendorId: "vendor-1",
        slug: "new-slug",
        name: "Kigali Grill & Co",
        lastInteractedAt: "2026-08-21T10:00:00.000Z",
      }),
    ]);

      await repository.remove("vendor-1");
      expect(await repository.list()).toEqual([]);
    });
  });
}

savedRestaurantRepositoryContract("in-memory saved restaurants", () =>
  createInMemorySavedRestaurantRepository()
);

savedRestaurantRepositoryContract("IndexedDB saved restaurants", () =>
  createIndexedDbSavedRestaurantRepository({
    indexedDB: new IDBFactory(),
    databaseName: "zantap-customer-test",
  })
);

describe("IndexedDB install continuity", () => {
  it("keeps pre-install saves visible to a later app repository instance", async () => {
    const indexedDB = new IDBFactory();
    const beforeInstall = createIndexedDbSavedRestaurantRepository({
      indexedDB,
      databaseName: "zantap-pre-install-test",
    });
    await beforeInstall.save({
      vendorId: "vendor-before-install",
      slug: "before-install",
      name: "Before Install",
      lastInteractedAt: "2026-08-21T10:00:00.000Z",
    });

    const installedApp = createIndexedDbSavedRestaurantRepository({
      indexedDB,
      databaseName: "zantap-pre-install-test",
    });
    expect(await installedApp.list()).toEqual([
      expect.objectContaining({ vendorId: "vendor-before-install" }),
    ]);
  });
});
