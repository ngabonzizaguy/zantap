import { describe, expect, it } from "vitest";
import { isReservedVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";

describe("normalizeVendorSlug", () => {
  it("lowercases, trims, and converts spaces to hyphens", () => {
    expect(normalizeVendorSlug("  Inka Steakhouse  ")).toBe("inka-steakhouse");
  });

  it("strips invalid characters and collapses hyphens", () => {
    expect(normalizeVendorSlug("Café & Grill!!")).toBe("caf-grill");
    expect(normalizeVendorSlug("foo---bar")).toBe("foo-bar");
  });

  it("removes leading and trailing hyphens", () => {
    expect(normalizeVendorSlug("-my-shop-")).toBe("my-shop");
  });
});

describe("isReservedVendorSlug", () => {
  it("reserves app routes and marketing paths (case/space-insensitive)", () => {
    expect(isReservedVendorSlug("ops")).toBe(true);
    expect(isReservedVendorSlug("vendor")).toBe(true);
    expect(isReservedVendorSlug("onboard")).toBe(true);
    expect(isReservedVendorSlug("api")).toBe(true);
    expect(isReservedVendorSlug("slip")).toBe(true);
    expect(isReservedVendorSlug("restaurants")).toBe(true);
    expect(isReservedVendorSlug("  Pricing ")).toBe(true);
  });

  it("allows normal vendor slugs", () => {
    expect(isReservedVendorSlug("inka-steakhouse")).toBe(false);
    expect(isReservedVendorSlug("mama-alines-kitchen")).toBe(false);
  });
});
