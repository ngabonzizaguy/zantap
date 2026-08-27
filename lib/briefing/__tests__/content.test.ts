import { describe, expect, it } from "vitest";

import { DEFAULT_BRIEFING_DOCUMENT } from "@/lib/briefing/content";

describe("default Briefing media", () => {
  it("uses the owner-approved storefront and KDS captures", () => {
    expect(DEFAULT_BRIEFING_DOCUMENT.media.storefront).toContain("storefront-3.png");
    expect(DEFAULT_BRIEFING_DOCUMENT.media.dashboard).toContain("kds-dashboard-2.png");
  });
});
