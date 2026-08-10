import { describe, expect, it } from "vitest";

import { canTransitionLeadStatus } from "@/lib/leads/status";

describe("Lead status progression", () => {
  it("allows the follow-up path and rejects skipped or backward transitions", () => {
    expect(canTransitionLeadStatus("NEW", "CONTACTED")).toBe(true);
    expect(canTransitionLeadStatus("NEW", "CLOSED")).toBe(true);
    expect(canTransitionLeadStatus("CONTACTED", "ONBOARDED")).toBe(true);
    expect(canTransitionLeadStatus("CONTACTED", "CLOSED")).toBe(true);

    expect(canTransitionLeadStatus("NEW", "ONBOARDED")).toBe(false);
    expect(canTransitionLeadStatus("CONTACTED", "NEW")).toBe(false);
    expect(canTransitionLeadStatus("ONBOARDED", "CONTACTED")).toBe(false);
    expect(canTransitionLeadStatus("CLOSED", "CONTACTED")).toBe(false);
  });
});
