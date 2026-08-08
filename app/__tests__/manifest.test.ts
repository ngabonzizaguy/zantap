import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("is standalone and ships standard plus maskable branded icons", () => {
    const value = manifest();

    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/");
    expect(value.theme_color).toBe("#f5f5f5");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "192x192", purpose: "maskable" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ])
    );
  });
});
