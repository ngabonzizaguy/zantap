import { describe, expect, it } from "vitest";

import { createInMemoryBriefingStore } from "@/lib/briefing/store/in-memory";

describe("Briefing Store", () => {
  it("pins a new Access grant to the current published version", async () => {
    const store = createInMemoryBriefingStore();
    const initial = await store.ensure({ hero: { title: "Version one" } });
    await store.saveDraft({ hero: { title: "Version two" } });
    const versionTwo = await store.publishDraft();

    const grant = await store.createGrant({
      recipientLabel: "Imanzi Foundation",
      recipientEmail: "partner@example.com",
      shortCode: "A1B2C3",
      secretLookup: "lookup",
      secretHash: "hash",
      expiresAt: new Date("2026-09-01T10:00:00Z"),
      versionId: versionTwo.id,
    });

    expect(initial.publishedVersions).toHaveLength(1);
    expect(grant.versionNumber).toBe(2);
    expect((await store.getVersion(grant.versionId))?.content).toEqual({
      hero: { title: "Version two" },
    });
  });

  it("limits active-session queries to unexpired and unrevoked sessions", async () => {
    const store = createInMemoryBriefingStore();
    const workspace = await store.ensure({ hero: {} });
    const grant = await store.createGrant({
      recipientLabel: "Aline",
      shortCode: "SHORT1",
      secretLookup: "lookup",
      secretHash: "hash",
      expiresAt: new Date("2026-09-01T10:00:00Z"),
      versionId: workspace.publishedVersions[0].id,
    });
    await store.createSession({
      grantId: grant.id,
      tokenHash: "active",
      generation: 0,
      expiresAt: grant.expiresAt,
    });
    await store.createSession({
      grantId: grant.id,
      tokenHash: "expired",
      generation: 0,
      expiresAt: new Date("2026-08-01T00:00:00Z"),
    });

    expect(
      await store.listActiveSessions(grant.id, new Date("2026-08-27T00:00:00Z"))
    ).toHaveLength(1);
  });
});
