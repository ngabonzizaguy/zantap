import { afterEach, describe, expect, it } from "vitest";
import {
  createBriefingPreviewSessionToken,
  getBriefingPreviewConfig,
  isBriefingPreviewExpired,
  verifyBriefingPreviewSecret,
} from "../preview-access";

const original = {
  secret: process.env.BRIEFING_PREVIEW_SECRET,
  recipient: process.env.BRIEFING_PREVIEW_RECIPIENT,
  expiry: process.env.BRIEFING_PREVIEW_EXPIRES_AT,
};

afterEach(() => {
  process.env.BRIEFING_PREVIEW_SECRET = original.secret;
  process.env.BRIEFING_PREVIEW_RECIPIENT = original.recipient;
  process.env.BRIEFING_PREVIEW_EXPIRES_AT = original.expiry;
});

describe("briefing preview access", () => {
  it("stays unavailable until both secret and valid expiry are configured", () => {
    delete process.env.BRIEFING_PREVIEW_SECRET;
    delete process.env.BRIEFING_PREVIEW_EXPIRES_AT;
    expect(getBriefingPreviewConfig()).toBeNull();

    process.env.BRIEFING_PREVIEW_SECRET = "example-secret";
    process.env.BRIEFING_PREVIEW_EXPIRES_AT = "not-a-date";
    expect(getBriefingPreviewConfig()).toBeNull();
  });

  it("normalizes the configured recipient and verifies the exact secret", () => {
    process.env.BRIEFING_PREVIEW_SECRET = "  four-word-preview-4827  ";
    process.env.BRIEFING_PREVIEW_RECIPIENT = "  Aline Partner  ";
    process.env.BRIEFING_PREVIEW_EXPIRES_AT = "2026-09-01T12:00:00+02:00";

    expect(getBriefingPreviewConfig()).toMatchObject({
      recipient: "Aline Partner",
      expiresAt: new Date("2026-09-01T10:00:00.000Z"),
    });
    expect(verifyBriefingPreviewSecret("four-word-preview-4827")).toBe(true);
    expect(verifyBriefingPreviewSecret("wrong-secret")).toBe(false);
  });

  it("derives a stable non-plaintext session token", () => {
    process.env.BRIEFING_PREVIEW_SECRET = "example-secret";
    const first = createBriefingPreviewSessionToken();
    const second = createBriefingPreviewSessionToken();
    expect(first).toBe(second);
    expect(first).not.toContain("example-secret");
    expect(first).toHaveLength(64);
  });

  it("treats the configured deadline as authoritative", () => {
    const config = {
      recipient: "Viewer",
      expiresAt: new Date("2026-09-01T10:00:00.000Z"),
    };
    expect(isBriefingPreviewExpired(config, new Date("2026-09-01T09:59:59Z"))).toBe(false);
    expect(isBriefingPreviewExpired(config, new Date("2026-09-01T10:00:00Z"))).toBe(true);
  });
});
