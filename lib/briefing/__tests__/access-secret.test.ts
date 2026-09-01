import { describe, expect, it } from "vitest";

import {
  generateBriefingSecret,
  hashBriefingSecret,
  normalizeBriefingSecret,
  verifyBriefingSecret,
} from "@/lib/briefing/access-secret";

describe("Briefing Access secret", () => {
  it("generates a four-digit PIN", () => {
    expect(generateBriefingSecret()).toMatch(/^\d{4}$/);
  });

  it("accepts pasted spaces and letter case without storing plaintext", async () => {
    const secret = "velvet-lantern-river-mango-4827";
    const hash = await hashBriefingSecret(secret);

    expect(normalizeBriefingSecret(" Velvet LANTERN river mango 4827 ")).toBe(secret);
    expect(await verifyBriefingSecret("Velvet LANTERN river mango 4827", hash)).toBe(true);
    expect(await verifyBriefingSecret("wrong-secret-0000", hash)).toBe(false);
    expect(hash).not.toContain(secret);
  });

  it("normalizes a spaced four-digit PIN", () => {
    expect(normalizeBriefingSecret(" 48 27 ")).toBe("4827");
  });
});
