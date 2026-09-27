import { describe, expect, it } from "vitest";
import {
  computeCommissionSnapshot,
  normalizeCommissionPercent,
  normalizeMinimumOrderTotalRwf,
  resolveEffectiveCommissionPercent,
  roundCommissionFeeUp,
} from "@/lib/momo/commission";

describe("roundCommissionFeeUp", () => {
  it("rounds fee up to whole RWF", () => {
    expect(roundCommissionFeeUp(10_000, 5)).toBe(500);
    expect(roundCommissionFeeUp(1001, 5)).toBe(51);
    expect(roundCommissionFeeUp(19, 5)).toBe(1);
  });

  it("returns 0 when percent or total is non-positive", () => {
    expect(roundCommissionFeeUp(10_000, 0)).toBe(0);
    expect(roundCommissionFeeUp(0, 5)).toBe(0);
    expect(roundCommissionFeeUp(10_000, -1)).toBe(0);
  });
});

describe("resolveEffectiveCommissionPercent", () => {
  const settings = { globalEnabled: true, globalDefaultPercent: 5 };

  it("forces 0 when global master is off", () => {
    expect(
      resolveEffectiveCommissionPercent(
        { globalEnabled: false, globalDefaultPercent: 5 },
        { commissionEnabled: true, commissionPercent: 10 },
      ),
    ).toBe(0);
  });

  it("forces 0 when Vendor Commission is off", () => {
    expect(
      resolveEffectiveCommissionPercent(settings, {
        commissionEnabled: false,
        commissionPercent: 10,
      }),
    ).toBe(0);
  });

  it("uses Vendor custom % when set", () => {
    expect(
      resolveEffectiveCommissionPercent(settings, {
        commissionEnabled: true,
        commissionPercent: 7.5,
      }),
    ).toBe(7.5);
  });

  it("falls back to global default when Vendor % is null", () => {
    expect(
      resolveEffectiveCommissionPercent(settings, {
        commissionEnabled: true,
        commissionPercent: null,
      }),
    ).toBe(5);
  });
});

describe("computeCommissionSnapshot", () => {
  it("pays Vendor total − fee when Commission is on", () => {
    const snap = computeCommissionSnapshot(
      10_000,
      { globalEnabled: true, globalDefaultPercent: 5 },
      { commissionEnabled: true },
    );
    expect(snap).toEqual({
      percentApplied: 5,
      commissionFeeRwf: 500,
      vendorPayoutAmountRwf: 9500,
    });
  });

  it("pays full total when Commission is off", () => {
    const snap = computeCommissionSnapshot(
      10_000,
      { globalEnabled: false, globalDefaultPercent: 5 },
      { commissionEnabled: true },
    );
    expect(snap).toEqual({
      percentApplied: 0,
      commissionFeeRwf: 0,
      vendorPayoutAmountRwf: 10_000,
    });
  });
});

describe("normalize helpers", () => {
  it("clamps percent to 100 and two decimals", () => {
    expect(normalizeCommissionPercent(5.555)).toBe(5.56);
    expect(normalizeCommissionPercent(150)).toBe(100);
  });

  it("rejects negative percent", () => {
    expect(() => normalizeCommissionPercent(-1)).toThrow(/non-negative/);
  });

  it("floors minimum order to a positive integer", () => {
    expect(normalizeMinimumOrderTotalRwf(1000.9)).toBe(1000);
    expect(() => normalizeMinimumOrderTotalRwf(0)).toThrow(/at least 1/);
  });
});
