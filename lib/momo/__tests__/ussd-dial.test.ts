import { describe, expect, it } from "vitest";
import {
  buildMomoUssdDial,
  manualPaymentRef,
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
  it("normalizes international Rwanda mobile to local form", () => {
    expect(toLocalMomoPhone("250788123456")).toBe("0788123456");
  });
});

describe("manualPaymentRef", () => {
  it("prefixes order id", () => {
    expect(manualPaymentRef("abc123")).toBe("manual-abc123");
  });
});
