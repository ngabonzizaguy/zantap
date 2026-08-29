import { describe, expect, it } from "vitest";
import { createInMemoryStore } from "@/lib/store/in-memory";
import { putPrivateMenuIntakeBlob } from "@/lib/menu-intake/blob-storage";

describe("menu intake import", () => {
  it("is idempotent and updates catalog data without changing KDS-owned fields", async () => {
    const store = createInMemoryStore();
    const before = await store.getMenu("inka-steakhouse");
    const existing = before.find((item) => item.name === "Beef Brochettes");
    if (!existing) throw new Error("seed item missing");
    await store.updateMenuItem("inka-steakhouse", existing.id, {
      stockCount: 7,
      lowStockThreshold: 2,
      costPriceRwf: 1400,
    });
    const created = await store.createMenuIntake({
      reference: "MI-IMPORT-1",
      businessName: "Inka",
      contactName: "Aline",
      phone: "250781234567",
      locale: "en",
      alreadyOnZantap: true,
      storefrontHint: "inka-steakhouse",
      resumeTokenHash: "hash",
      resumeExpiresAt: new Date(Date.now() + 60_000),
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "existing",
            name: "Brochettes Special",
            category: "Grill",
            priceRwf: 6500,
          },
          {
            clientId: "new",
            name: "Isombe",
            category: "Rwandan",
            priceRwf: 3500,
          },
          {
            clientId: "skip",
            name: "Ignored",
            category: "Other",
            priceRwf: 1000,
          },
        ],
      },
    });
    const privatePath = `${created.intake.id}/private-source.jpg`;
    await putPrivateMenuIntakeBlob(
      privatePath,
      Buffer.from("image-bytes"),
      "image/jpeg",
    );
    const attachment = await store.addMenuIntakeAttachment({
      intakeId: created.intake.id,
      resumeTokenHash: "hash",
      kind: "DISH_IMAGE",
      dishClientId: "new",
      fileName: "isombe.jpg",
      mime: "image/jpeg",
      byteLength: 11,
      blobPath: privatePath,
      at: new Date(),
    });
    if (!attachment) throw new Error("attachment not created");
    const request = {
      intakeId: created.intake.id,
      idempotencyKey: "approve-once",
      destination: { kind: "EXISTING" as const, vendorSlug: "inka-steakhouse" },
      items: [
        {
          intakeDishClientId: "existing",
          decision: "UPDATE_EXISTING" as const,
          existingMenuItemId: existing.id,
          reviewedDish: {
            clientId: "existing",
            name: "Brochettes Special",
            category: "Grill",
            priceRwf: 6500,
          },
        },
        {
          intakeDishClientId: "new",
          decision: "ADD_NEW" as const,
          reviewedDish: {
            clientId: "new",
            name: "Isombe",
            category: "Rwandan",
            priceRwf: 3500,
            imageAttachmentIds: [attachment.id],
          },
        },
        {
          intakeDishClientId: "skip",
          decision: "SKIP" as const,
          reviewedDish: {
            clientId: "skip",
            name: "Ignored",
            category: "Other",
            priceRwf: 1000,
          },
        },
      ],
    };

    await store.updateMenuIntakeReview({
      intakeId: created.intake.id,
      status: "READY_TO_IMPORT",
      destinationVendorSlug: "inka-steakhouse",
      operator: "ops@example.com",
      at: new Date(),
    });

    const first = await store.importMenuIntake(request);
    const second = await store.importMenuIntake(request);
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      status: "COMPLETED",
      vendorSlug: "inka-steakhouse",
    });
    expect(first.items.map((item) => item.outcome)).toEqual([
      "UPDATED",
      "CREATED",
      "SKIPPED",
    ]);
    const after = await store.getMenu("inka-steakhouse");
    expect(after.filter((item) => item.name === "Isombe")).toHaveLength(1);
    expect(
      after.find((item) => item.name === "Isombe")?.images?.[0]?.url,
    ).toContain("/api/local-blob/menu/");
    expect(
      after.find((item) => item.name === "Isombe")?.images?.[0]?.url,
    ).not.toContain("menu-intake");
    expect(after.find((item) => item.id === existing.id)).toMatchObject({
      name: "Brochettes Special",
      priceRwf: 6500,
      stockCount: 7,
      lowStockThreshold: 2,
      costPriceRwf: 1400,
    });
    expect((await store.getMenuIntake(created.intake.id))?.intake.status).toBe(
      "IMPORTED",
    );
    const amendment = await store.addMenuIntakeRevision({
      intakeId: created.intake.id,
      resumeTokenHash: "hash",
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "new",
            name: "Isombe amended",
            category: "Rwandan",
            priceRwf: 3900,
          },
        ],
      },
      at: new Date(),
    });
    expect(amendment?.intake.status).toBe("IN_REVIEW");
    expect(
      (await store.getMenu("inka-steakhouse")).some(
        (item) => item.name === "Isombe amended",
      ),
    ).toBe(false);
  });
});
