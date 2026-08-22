import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/customer/updates/[batchId]/analytics/route";
import { getStore } from "@/lib/store";
import { seedVendor } from "@/lib/store/seed-data";

describe("POST /api/customer/updates/:batchId/analytics", () => {
  it("increments only an aggregate batch counter and rejects unknown kinds", async () => {
    const store = getStore();
    const batch = await store.recordVendorUpdate(seedVendor.slug, {
      entry: { type: "PROFILE_CHANGE", subjectId: seedVendor.id, name: seedVendor.name },
    });
    const before = await store.getVendorUpdateOverview(seedVendor.slug);
    const response = await POST(
      new Request("http://localhost/api/customer/updates/batch/analytics", {
        method: "POST",
        body: JSON.stringify({ kind: "open" }),
      }),
      { params: Promise.resolve({ batchId: batch!.id }) }
    );
    const after = await store.getVendorUpdateOverview(seedVendor.slug);

    expect(response.status).toBe(204);
    expect(after!.totals.opens).toBe(before!.totals.opens + 1);

    const invalid = await POST(
      new Request("http://localhost/api/customer/updates/batch/analytics", {
        method: "POST",
        body: JSON.stringify({ kind: "viewerIdentity" }),
      }),
      { params: Promise.resolve({ batchId: batch!.id }) }
    );
    expect(invalid.status).toBe(400);
  });
});
