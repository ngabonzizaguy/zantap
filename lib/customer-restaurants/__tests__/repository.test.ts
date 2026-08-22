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

    it("keeps viewed revisions and analytics markers local to each batch revision", async () => {
      const repository = createRepository();

      expect(await repository.getUpdateState("batch-1")).toEqual({
        viewedRevision: 0,
        openSentRevision: 0,
        menuVisitSentRevision: 0,
      });

      await repository.markUpdateViewed("batch-1", "vendor-1", 2);
      await repository.markUpdateViewed("batch-1", "vendor-1", 1);
      await repository.markUpdateAnalyticsSent("batch-1", "vendor-1", "open", 2);
      await repository.markUpdateAnalyticsSent("batch-1", "vendor-1", "menuVisit", 3);

      expect(await repository.getUpdateState("batch-1")).toEqual({
        viewedRevision: 2,
        openSentRevision: 2,
        menuVisitSentRevision: 3,
      });

      await repository.remove("vendor-1");
      expect(await repository.getUpdateState("batch-1")).toEqual({
        viewedRevision: 0,
        openSentRevision: 0,
        menuVisitSentRevision: 0,
      });
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

  it("upgrades version 1 without losing saved restaurants", async () => {
    const indexedDB = new IDBFactory();
    const request = indexedDB.open("zantap-v1-upgrade-test", 1);
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onupgradeneeded = () => {
        request.result.createObjectStore("savedRestaurants", { keyPath: "vendorId" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const transaction = database.transaction("savedRestaurants", "readwrite");
    transaction.objectStore("savedRestaurants").put({
      vendorId: "vendor-v1",
      slug: "version-one",
      name: "Version One",
      lastInteractedAt: "2026-08-21T10:00:00.000Z",
    });
    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();

    const upgraded = createIndexedDbSavedRestaurantRepository({
      indexedDB,
      databaseName: "zantap-v1-upgrade-test",
    });
    expect(await upgraded.list()).toEqual([
      expect.objectContaining({ vendorId: "vendor-v1" }),
    ]);
    expect(await upgraded.getUpdateState("batch-new")).toEqual({
      viewedRevision: 0,
      openSentRevision: 0,
      menuVisitSentRevision: 0,
    });
  });
});
