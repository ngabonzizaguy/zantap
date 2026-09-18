import { describe, expect, it } from "vitest";
import type { CountryCode } from "libphonenumber-js";

import {
  formatStoredLeadPhone,
  getLeadPhoneCountries,
  parseLeadPhone,
} from "@/lib/leads/phone";

describe("Lead phone numbers", () => {
  it("keeps Rwanda first while exposing a searchable all-country catalogue", () => {
    const countries = getLeadPhoneCountries();

    expect(countries[0]).toMatchObject({
      code: "RW",
      dialCode: "+250",
      name: "Rwanda",
    });
    expect(countries.length).toBeGreaterThan(200);
    expect(countries).toContainEqual(
      expect.objectContaining({ code: "BR", dialCode: "+55", name: "Brazil" })
    );
  });

  it("parses a national number under the selected country", () => {
    expect(parseLeadPhone("07123 456789", "GB")).toEqual({
      country: "GB",
      e164: "+447123456789",
      digits: "447123456789",
      display: "+44 7123 456789",
    });
  });

  it("lets a complete international paste override the selected country", () => {
    expect(parseLeadPhone("+1 415 555 2671", "RW")).toEqual({
      country: "US",
      e164: "+14155552671",
      digits: "14155552671",
      display: "+1 415 555 2671",
    });
  });

  it("formats canonical stored numbers for readable Ops display", () => {
    expect(formatStoredLeadPhone("447123456789")).toBe("+44 7123 456789");
    expect(formatStoredLeadPhone("250788123456")).toBe("+250 788 123 456");
  });

  it("rejects impossible, extended, and premium-rate numbers", () => {
    expect(parseLeadPhone("12345", "RW")).toBeNull();
    expect(parseLeadPhone("+44 7123 456789 ext 4", "RW")).toBeNull();
    expect(parseLeadPhone("+44 900 123 4567", "RW")).toBeNull();
    expect(parseLeadPhone("07123 456789", "ZZ" as CountryCode)).toBeNull();
  });
});
