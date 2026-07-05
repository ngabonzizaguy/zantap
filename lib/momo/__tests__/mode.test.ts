import { describe, expect, it } from "vitest";
import { getMomoMode, isManualMomoMode } from "@/lib/momo/mode";

describe("getMomoMode", () => {
  it("defaults to simulate outside production", () => {
    expect(getMomoMode()).toBe("simulate");
    expect(isManualMomoMode("simulate")).toBe(false);
  });
});
