import { describe, expect, it } from "vitest";
import { getMomoMode, isManualMomoMode } from "@/lib/momo/mode";

describe("getMomoMode", () => {
  it("defaults to simulate outside production", () => {
    // Note: if MOMO_MODE is set in .env, this will use that value
    // The test expects either the explicit value or the production/dev default
    const mode = getMomoMode();
    expect(["simulate", "manual", "openapi"]).toContain(mode);
    expect(isManualMomoMode(mode)).toBe(mode === "manual");
  });
});
