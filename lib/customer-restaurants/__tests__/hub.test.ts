import { describe, expect, it } from "vitest";
import {
  filterSavedRestaurants,
  reconcileSavedRestaurants,
  removeSavedRestaurant,
} from "@/lib/customer-restaurants/hub";
import { createInMemorySavedRestaurantRepository } from "@/lib/customer-restaurants/in-memory";

describe("Your restaurants hub", () => {
  it("follows current slugs while retaining suspended and missing Vendors as unavailable", () => {
    const local = [
      {
        vendorId: "vendor-1",
        slug: "old-slug",
        name: "Old Name",
        lastInteractedAt: "2026-08-21T10:00:00.000Z",
      },
      {
        vendorId: "vendor-2",
        slug: "suspended",
        name: "Suspended",
        lastInteractedAt: "2026-08-20T10:00:00.000Z",
      },
      {
        vendorId: "vendor-3",
        slug: "missing",
        name: "Last Known",
        lastInteractedAt: "2026-08-19T10:00:00.000Z",
      },
    ];

    expect(
      reconcileSavedRestaurants(local, [
        {
          vendorId: "vendor-1",
          restaurant: {
            vendorId: "vendor-1",
            slug: "new-slug",
            name: "New Name",
            isAvailable: true,
          },
        },
        {
          vendorId: "vendor-2",
          restaurant: {
            vendorId: "vendor-2",
            slug: "suspended",
            name: "Suspended",
            isAvailable: false,
          },
        },
        { vendorId: "vendor-3", restaurant: null },
      ])
    ).toEqual([
      expect.objectContaining({
        vendorId: "vendor-1",
        slug: "new-slug",
        name: "New Name",
        isAvailable: true,
      }),
      expect.objectContaining({ vendorId: "vendor-2", isAvailable: false }),
      expect.objectContaining({ vendorId: "vendor-3", isAvailable: false }),
    ]);
  });

  it("searches only the saved collection without changing recency order", () => {
    const saved = [
      {
        vendorId: "newest",
        slug: "kigali-grill",
        name: "Kigali Grill",
        location: "Kicukiro",
        lastInteractedAt: "2026-08-21T10:00:00.000Z",
      },
      {
        vendorId: "older",
        slug: "lilys",
        name: "Lily's Kitchen",
        location: "Remera",
        lastInteractedAt: "2026-08-20T10:00:00.000Z",
      },
    ];

    expect(filterSavedRestaurants(saved, "remera")).toEqual([
      expect.objectContaining({ vendorId: "older" }),
    ]);
    expect(filterSavedRestaurants(saved, "")).toEqual(saved);
  });

  it("removes a saved Vendor only after confirmation", async () => {
    const repository = createInMemorySavedRestaurantRepository([
      {
        vendorId: "vendor-1",
        slug: "saved",
        name: "Saved Restaurant",
        lastInteractedAt: "2026-08-21T10:00:00.000Z",
      },
    ]);

    expect(
      await removeSavedRestaurant(repository, "vendor-1", () => false)
    ).toBe(false);
    expect(await repository.list()).toHaveLength(1);

    expect(
      await removeSavedRestaurant(repository, "vendor-1", () => true)
    ).toBe(true);
    expect(await repository.list()).toEqual([]);
  });
});
