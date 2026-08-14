import { describe, expect, it } from "vitest";
import { computeGlowScore, emptyProfitSnapshot } from "@/lib/vendor/profit";

describe("computeGlowScore", () => {
  it("returns 0 when both are zero", () => {
    expect(computeGlowScore(0, 0)).toBe(0);
  });

  it("returns 1 when average is 0 but today has sales", () => {
    expect(computeGlowScore(1000, 0)).toBe(1);
  });

  it("is positive when above average", () => {
    expect(computeGlowScore(150, 100)).toBeCloseTo(0.5);
  });

  it("is negative when below average", () => {
    expect(computeGlowScore(50, 100)).toBeCloseTo(-0.5);
  });

  it("clamps to [-1, 1]", () => {
    expect(computeGlowScore(400, 100)).toBe(1);
    expect(computeGlowScore(0, 100)).toBe(-1);
  });
});

describe("emptyProfitSnapshot", () => {
  it("seeds glow from today vs weekday average", () => {
    const snap = emptyProfitSnapshot(200, 100);
    expect(snap.todayGrossRwf).toBe(200);
    expect(snap.weekdayAverageRwf).toBe(100);
    expect(snap.glowScore).toBe(1);
    expect(snap.itemMargins).toEqual([]);
  });
});
