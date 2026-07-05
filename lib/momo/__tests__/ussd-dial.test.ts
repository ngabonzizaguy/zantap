import { describe, expect, it } from "vitest";
import {
  buildMomoUssdDial,
  manualPaymentRef,
  normalizeMomoPayoutPhoneForStorage,
  toLocalMomoPhone,
  validateVendorPayout,
} from "@/lib/momo/ussd-dial";

describe("buildMomoUssdDial", () => {
  it("builds merchant-code dial string with plain integer amount", () => {
    const result = buildMomoUssdDial(
      { payoutMethod: "MERCHANT_CODE", momoCode: "123456" },
      5000
    );
    expect(result).toEqual({ ok: true, ussd: "*182*8*1*123456*5000#" });
  });

  it("builds phone payout dial string with local 078 number", () => {
    const result = buildMomoUssdDial(
      { payoutMethod: "PHONE", momoCode: "+250788123456" },
      12000
    );
    expect(result).toEqual({ ok: true, ussd: "*182*1*1*0788123456*12000#" });
  });

  it("rejects invalid merchant code length", () => {
    const result = validateVendorPayout({
      payoutMethod: "MERCHANT_CODE",
      momoCode: "12345",
    });
    expect(result.ok).toBe(false);
  });
});

describe("toLocalMomoPhone", () => {
  it.each([
    ["0788123456", "0788123456"],
    ["+250788123456", "0788123456"],
    ["250788123456", "0788123456"],
    ["+250 788 123 456", "0788123456"],
    ["250 788 123 456", "0788123456"],
    ["+2500788123456", "0788123456"],
    ["2500788123456", "0788123456"],
    ["+250 078 812 3456", "0788123456"],
  ])("normalizes %s to local %s", (input, expected) => {
    expect(toLocalMomoPhone(input)).toBe(expected);
  });

  it("rejects invalid merchant-style input", () => {
    expect(toLocalMomoPhone("123456")).toBeNull();
  });
});

describe("normalizeMomoPayoutPhoneForStorage", () => {
  it("stores local form from international onboarding input", () => {
    expect(normalizeMomoPayoutPhoneForStorage("+250 788 123 456")).toBe(
      "0788123456"
    );
  });

  it("returns null for blank or invalid input", () => {
    expect(normalizeMomoPayoutPhoneForStorage("")).toBeNull();
    expect(normalizeMomoPayoutPhoneForStorage("880001")).toBeNull();
  });
});

describe("manualPaymentRef", () => {
  it("prefixes order id", () => {
    expect(manualPaymentRef("abc123")).toBe("manual-abc123");
  });
});
