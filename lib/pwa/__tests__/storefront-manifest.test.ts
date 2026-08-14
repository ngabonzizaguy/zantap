import { describe, expect, it } from "vitest";
import {
  buildStorefrontManifest,
  buildStorefrontShortName,
} from "@/lib/pwa/storefront-manifest";

describe("storefront PWA manifest", () => {
  it("installs as the vendor, launching into its storefront", () => {
    const value = buildStorefrontManifest({
      name: "Inka Steakhouse",
      slug: "inka-steakhouse",
      description: "Grilled meats in Kigali.",
    });

    expect(value.id).toBe("/inka-steakhouse");
    expect(value.start_url).toBe("/inka-steakhouse");
    expect(value.name).toBe("Inka Steakhouse");
    expect(value.description).toBe("Grilled meats in Kigali.");
    expect(value.display).toBe("standalone");
    expect(value.theme_color).toBe("#f5f5f5");
  });

  it("falls back to generic copy when the vendor has no description", () => {
    const value = buildStorefrontManifest({
      name: "Lilys",
      slug: "lilys",
      description: "  ",
    });

    expect(value.description).toBe("Order from Lilys — powered by ZanTap.");
  });

  it("URL-encodes slugs in id and start_url", () => {
    const value = buildStorefrontManifest({
      name: "Café Kigali",
      slug: "café-kigali",
    });

    expect(value.start_url).toBe(`/${encodeURIComponent("café-kigali")}`);
    expect(value.id).toBe(value.start_url);
  });

  it("ships the same branded icon set as the root and KDS manifests", () => {
    const value = buildStorefrontManifest({ name: "Lilys", slug: "lilys" });

    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "192x192", purpose: "maskable" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ])
    );
  });

  describe("short name", () => {
    it("keeps short names whole", () => {
      expect(buildStorefrontShortName("Lilys")).toBe("Lilys");
    });

    it("cuts long names at a word boundary within 12 chars", () => {
      expect(buildStorefrontShortName("Inka Steakhouse")).toBe("Inka");
      expect(buildStorefrontShortName("Kigali Grill House")).toBe(
        "Kigali Grill"
      );
    });

    it("hard-cuts single long words", () => {
      expect(buildStorefrontShortName("Supercalifragilistic")).toBe(
        "Supercalifra"
      );
    });
  });
});
