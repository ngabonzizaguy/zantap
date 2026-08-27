import { describe, expect, it } from "vitest";

import {
  createBriefingAccessGrant,
  unlockBriefingAccess,
} from "@/lib/briefing/access-service";
import { createInMemoryBriefingStore } from "@/lib/briefing/store/in-memory";

describe("Briefing Access", () => {
  it("shows a new grant secret once and unlocks its pinned version", async () => {
    const store = createInMemoryBriefingStore();
    const workspace = await store.ensure({ hero: { title: "Published claim" } });
    const created = await createBriefingAccessGrant(store, {
      recipientLabel: "Aline",
      recipientEmail: "aline@example.com",
      expiresAt: new Date("2026-09-01T10:00:00Z"),
      versionId: workspace.publishedVersions[0].id,
    });

    expect(created.secret).toMatch(/^[a-z-]+-\d{4}$/);
    expect((await store.listGrants())[0]).not.toHaveProperty("secretHash");

    const unlocked = await unlockBriefingAccess(
      store,
      created.secret.toUpperCase().replaceAll("-", " "),
      { now: new Date("2026-08-27T12:00:00Z") }
    );
    expect(unlocked.ok).toBe(true);
    if (unlocked.ok) {
      expect(unlocked.version.content).toEqual({ hero: { title: "Published claim" } });
    }
  });

  it("denies a third active Viewing session", async () => {
    const store = createInMemoryBriefingStore();
    const workspace = await store.ensure({ hero: {} });
    const created = await createBriefingAccessGrant(store, {
      recipientLabel: "Partner",
      expiresAt: new Date("2026-09-01T10:00:00Z"),
      versionId: workspace.publishedVersions[0].id,
    });
    const at = new Date("2026-08-27T12:00:00Z");
    expect((await unlockBriefingAccess(store, created.secret, { now: at })).ok).toBe(true);
    expect((await unlockBriefingAccess(store, created.secret, { now: at })).ok).toBe(true);
    expect(await unlockBriefingAccess(store, created.secret, { now: at })).toMatchObject({
      ok: false,
      code: "SESSION_LIMIT",
    });
  });
});
