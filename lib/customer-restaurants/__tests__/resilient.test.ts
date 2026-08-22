import { describe, expect, it } from "vitest";
import { createInMemorySavedRestaurantRepository } from "@/lib/customer-restaurants/in-memory";
import { createResilientSavedRestaurantRepository } from "@/lib/customer-restaurants/resilient";
import type { SavedRestaurantRepository } from "@/lib/customer-restaurants/types";

describe("resilient saved restaurant storage", () => {
  it("keeps meaningful actions usable when browser storage is unavailable", async () => {
    const unavailable: SavedRestaurantRepository = {
      async list() {
        throw new Error("storage denied");
      },
      async save() {
        throw new Error("storage denied");
      },
      async remove() {
        throw new Error("storage denied");
      },
      async getUpdateState() {
        throw new Error("storage denied");
      },
      async markUpdateViewed() {
        throw new Error("storage denied");
      },
      async markUpdateAnalyticsSent() {
        throw new Error("storage denied");
      },
    };
    const repository = createResilientSavedRestaurantRepository(
      unavailable,
      createInMemorySavedRestaurantRepository()
    );

    expect(await repository.list()).toEqual([]);
    await repository.save({
      vendorId: "vendor-1",
      slug: "fallback",
      name: "Fallback Restaurant",
      lastInteractedAt: "2026-08-21T10:00:00.000Z",
    });

    expect(await repository.list()).toEqual([
      expect.objectContaining({ vendorId: "vendor-1" }),
    ]);
  });

  it("falls back when browser storage hangs instead of leaving the hub loading forever", async () => {
    const hanging: SavedRestaurantRepository = {
      list: () => new Promise(() => undefined),
      save: () => new Promise(() => undefined),
      remove: () => new Promise(() => undefined),
      getUpdateState: () => new Promise(() => undefined),
      markUpdateViewed: () => new Promise(() => undefined),
      markUpdateAnalyticsSent: () => new Promise(() => undefined),
    };
    const repository = createResilientSavedRestaurantRepository(
      hanging,
      createInMemorySavedRestaurantRepository(),
      { timeoutMs: 10 }
    );

    expect(await repository.list()).toEqual([]);
  });
});
