import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/customer/updates/route";
import { getStore } from "@/lib/store";
import { seedVendor } from "@/lib/store/seed-data";

describe("GET /api/customer/updates", () => {
  it("returns only active public batches for deduplicated supplied Vendor IDs", async () => {
    const store = getStore();
    const menuItem = (await store.getMenu(seedVendor.slug))[0];
    await store.recordVendorUpdate(seedVendor.slug, {
      entry: {
        type: "PRICE_CHANGE",
        subjectId: menuItem.id,
        name: menuItem.name,
        oldPriceRwf: menuItem.priceRwf - 100,
        currentPriceRwf: menuItem.priceRwf,
      },
    });

    const response = await GET(
      new Request(
        `http://localhost/api/customer/updates?ids=${seedVendor.id},${seedVendor.id},missing`
      )
    );
    const body = await response.json();

    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.updates).toHaveLength(1);
    expect(body.updates[0]).toEqual(
      expect.objectContaining({
        vendorId: seedVendor.id,
        slug: seedVendor.slug,
        isAvailable: true,
      })
    );
    expect(body.updates[0].batches[0].entries[0]).toEqual(
      expect.objectContaining({ isCurrentlyAvailable: true })
    );
    expect(JSON.stringify(body)).not.toContain(seedVendor.phoneNumber);
    expect(JSON.stringify(body)).not.toContain(seedVendor.momoCode);
    expect(JSON.stringify(body)).not.toContain("openCount");
  });
});
