import { describe, expect, it } from "vitest";
import { normalizeVendorSlug } from "@/lib/vendor/slug";

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
