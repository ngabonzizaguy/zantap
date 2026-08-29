import { describe, expect, it } from "vitest";
import { createInMemoryStore } from "@/lib/store/in-memory";

describe("menu intake access", () => {
  it("exchanges a one-time token once and revokes browser access immediately", async () => {
    const store = createInMemoryStore();
    const now = new Date("2026-08-29T12:00:00Z");
    const intake = await store.createMenuIntake({
      reference: "MI-ACCESS",
      businessName: "Aline Foods",
      contactName: "Aline",
      phone: "250781234567",
      locale: "en",
      alreadyOnZantap: false,
      content: {
        path: "SELF_BUILD",
        dishes: [
          {
            clientId: "dish",
            name: "Isombe",
            category: "Lunch",
            priceRwf: 3000,
          },
        ],
      },
      resumeTokenHash: "original-browser",
      resumeExpiresAt: new Date(now.getTime() + 60_000),
    });
    await store.createMenuIntakeAccess({
      intakeId: intake.intake.id,
      tokenHash: "one-time",
      kind: "ONE_TIME",
      expiresAt: new Date(now.getTime() + 60_000),
      at: now,
    });
    expect(
      await store.exchangeMenuIntakeAccess(
        intake.intake.id,
        "one-time",
        "new-browser",
        now,
      ),
    ).not.toBeNull();
    expect(
      await store.exchangeMenuIntakeAccess(
        intake.intake.id,
        "one-time",
        "another-browser",
        now,
      ),
    ).toBeNull();
    expect(
      await store.authorizeMenuIntake(intake.intake.id, "new-browser", now),
    ).not.toBeNull();
    expect(
      await store.revokeMenuIntakeAccess(intake.intake.id, now),
    ).toBeGreaterThan(0);
    expect(
      await store.authorizeMenuIntake(intake.intake.id, "new-browser", now),
    ).toBeNull();
  });
});
