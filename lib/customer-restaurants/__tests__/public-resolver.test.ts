import { describe, expect, it } from "vitest";
import {
  MAX_PUBLIC_RESTAURANT_IDS,
  parsePublicRestaurantIds,
  resolvePublicRestaurantResults,
} from "@/lib/customer-restaurants/public-resolver";

describe("public saved-restaurant resolver", () => {
  it("accepts only a bounded, deduplicated stable-ID list", () => {
    const ids = Array.from(
      { length: MAX_PUBLIC_RESTAURANT_IDS + 5 },
      (_, index) => `vendor-${index}`
    );

    expect(
      parsePublicRestaurantIds(
        `${ids.join(",")},vendor-0, ,${"x".repeat(201)}`
      )
    ).toEqual(ids.slice(0, MAX_PUBLIC_RESTAURANT_IDS));
  });

  it("returns one result per requested ID and marks missing Vendors unavailable", async () => {
    const resolve = async () => [
      {
        vendorId: "vendor-2",
        slug: "renamed",
        name: "Renamed Restaurant",
        isAvailable: true,
      },
    ];

    expect(
      await resolvePublicRestaurantResults(["vendor-1", "vendor-2"], resolve)
    ).toEqual([
      { vendorId: "vendor-1", restaurant: null },
      {
        vendorId: "vendor-2",
        restaurant: expect.objectContaining({ slug: "renamed" }),
      },
    ]);
  });
});
