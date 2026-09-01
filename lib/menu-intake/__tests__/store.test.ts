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

  it("moves an Ops-deleted submission into 30-day trash and can restore it", async () => {
    const store = createInMemoryStore();
    const created = await store.createMenuIntake({
      reference: "MI-260901-TRASH",
      businessName: "Trash Test Resto",
      contactName: "Aline",
      phone: "250781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: { path: "ASSISTED", dishes: [], assistedNotes: "Source menu" },
      resumeTokenHash: "trash-token",
      resumeExpiresAt: new Date("2026-10-01T12:00:00.000Z"),
    });
    const deletedAt = new Date("2026-09-01T12:00:00.000Z");

    expect(await store.deleteMenuIntake(created.intake.id, deletedAt)).toMatchObject({
      deletedAt,
    });
    expect((await store.listMenuIntakes()).map((row) => row.id)).not.toContain(
      created.intake.id,
    );
    expect(await store.listDeletedMenuIntakes()).toEqual([
      expect.objectContaining({ id: created.intake.id, deletedAt }),
    ]);
    expect(
      await store.authorizeMenuIntake(
        created.intake.id,
        "trash-token",
        new Date("2026-09-01T12:01:00.000Z"),
      ),
    ).toBeNull();

    expect(
      await store.restoreMenuIntake(
        created.intake.id,
        new Date("2026-09-02T12:00:00.000Z"),
      ),
    ).toMatchObject({ deletedAt: undefined });
    expect((await store.listMenuIntakes()).map((row) => row.id)).toContain(
      created.intake.id,
    );
  });

  it("allows permanent purge only after 30 days and returns private files for cleanup", async () => {
    const store = createInMemoryStore();
    const created = await store.createMenuIntake({
      reference: "MI-260901-PURGE",
      businessName: "Purge Test Resto",
      contactName: "Aline",
      phone: "250781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: { path: "ASSISTED", dishes: [] },
      resumeTokenHash: "purge-token",
      resumeExpiresAt: new Date("2026-10-01T12:00:00.000Z"),
    });
    await store.addMenuIntakeAttachment({
      intakeId: created.intake.id,
      resumeTokenHash: "purge-token",
      kind: "SOURCE",
      fileName: "menu.pdf",
      mime: "application/pdf",
      byteLength: 1200,
      blobPath: "private/menu.pdf",
      at: new Date("2026-09-01T11:00:00.000Z"),
    });
    await store.deleteMenuIntake(
      created.intake.id,
      new Date("2026-09-01T12:00:00.000Z"),
    );

    expect(
      await store.purgeMenuIntake(
        created.intake.id,
        new Date("2026-10-01T11:59:59.000Z"),
      ),
    ).toBeNull();
    expect(
      await store.purgeMenuIntake(
        created.intake.id,
        new Date("2026-10-01T12:00:00.000Z"),
      ),
    ).toEqual([expect.objectContaining({ blobPath: "private/menu.pdf" })]);
    expect(await store.getMenuIntake(created.intake.id)).toBeNull();
  });
});
