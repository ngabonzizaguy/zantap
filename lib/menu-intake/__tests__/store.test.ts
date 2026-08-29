import { describe, expect, it } from "vitest";

import { createInMemoryStore } from "@/lib/store/in-memory";

describe("Menu intake Store interface", () => {
  it("stages a submission as an immutable revision without creating a Vendor or live menu item", async () => {
    const store = createInMemoryStore();
    const vendorsBefore = await store.listVendors();

    const created = await store.createMenuIntake({
      reference: "MI-260829-0001",
      businessName: "Kigali Kitchen",
      contactName: "Aline",
      phone: "250781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "dish-1",
            name: "Isombe",
            category: "Main dishes",
            priceRwf: 3500,
          },
        ],
      },
      resumeTokenHash: "hash-1",
      resumeExpiresAt: new Date("2026-09-28T12:00:00.000Z"),
    });

    expect(created.intake).toMatchObject({
      reference: "MI-260829-0001",
      status: "SUBMITTED",
      currentRevision: 1,
    });
    expect(created.revision).toMatchObject({
      sequence: 1,
      source: "VENDOR",
      content: { path: "SELF_BUILD" },
    });
    expect(created.access).toMatchObject({
      kind: "BROWSER",
      tokenHash: "hash-1",
    });
    expect(await store.listVendors()).toHaveLength(vendorsBefore.length);
    expect(await store.getMenuIntake(created.intake.id)).toMatchObject({
      intake: { currentRevision: 1 },
      revisions: [{ sequence: 1 }],
    });
  });
});
