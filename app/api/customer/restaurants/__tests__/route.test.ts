import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/customer/restaurants/route";
import { seedVendor } from "@/lib/store/seed-data";

describe("GET /api/customer/restaurants", () => {
  it("returns a private, allowlisted public result for supplied stable IDs", async () => {
    const response = await GET(
      new Request(
        `http://localhost/api/customer/restaurants?ids=${seedVendor.id},missing`
      )
    );
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body).toEqual({
      restaurants: [
        {
          vendorId: seedVendor.id,
          restaurant: expect.objectContaining({
            vendorId: seedVendor.id,
            slug: seedVendor.slug,
            name: seedVendor.name,
            isAvailable: true,
          }),
        },
        { vendorId: "missing", restaurant: null },
      ],
    });
    expect(JSON.stringify(body)).not.toContain(seedVendor.phoneNumber);
    expect(JSON.stringify(body)).not.toContain(seedVendor.momoCode);
  });
});
