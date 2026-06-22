import { describe, expect, it } from "vitest";
import { canProceedToPay } from "@/lib/checkout/validation";

describe("canProceedToPay", () => {
  const valid = {
    count: 2,
    phone: "0788123456",
    sector: "Kicukiro",
    landmark: "Near Simba",
  };

  it("returns true when all fields are valid", () => {
    expect(
      canProceedToPay(valid.count, valid.phone, valid.sector, valid.landmark)
    ).toBe(true);
  });

  it("accepts formatted phone numbers with at least 10 digits", () => {
    expect(
      canProceedToPay(valid.count, "+250 788 123 456", valid.sector, valid.landmark)
    ).toBe(true);
  });

  it("returns false when count is zero", () => {
    expect(
      canProceedToPay(0, valid.phone, valid.sector, valid.landmark)
    ).toBe(false);
  });

  it("returns false when phone has fewer than 10 digits", () => {
    expect(
      canProceedToPay(valid.count, "0788123", valid.sector, valid.landmark)
    ).toBe(false);
  });

  it("returns false when sector is empty", () => {
    expect(
      canProceedToPay(valid.count, valid.phone, "", valid.landmark)
    ).toBe(false);
  });

  it("returns false when landmark is empty or whitespace only", () => {
    expect(
      canProceedToPay(valid.count, valid.phone, valid.sector, "")
    ).toBe(false);
    expect(
      canProceedToPay(valid.count, valid.phone, valid.sector, "   ")
    ).toBe(false);
  });
});
