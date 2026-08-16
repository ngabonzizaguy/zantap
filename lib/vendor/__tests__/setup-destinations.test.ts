import { describe, expect, it } from "vitest";
import {
  getOnboardingDestination,
  getOptionalDestination,
} from "@/lib/vendor/setup-destinations";

describe("Setup Guide destinations", () => {
  it("routes every getting-started card to an actionable destination", () => {
    expect(getOnboardingDestination("hasMenuItem")).toEqual({ kind: "tab", tab: "menu" });
    expect(getOnboardingDestination("hasPhoto")).toEqual({ kind: "tab", tab: "menu" });
    expect(getOnboardingDestination("kitchenOpen")).toEqual({ kind: "open-kitchen" });
    expect(getOnboardingDestination("hasFirstOrder")).toEqual({ kind: "tab", tab: "orders" });
    expect(getOnboardingDestination("hasDispatch")).toEqual({ kind: "tab", tab: "orders" });
  });

  it("routes every currently actionable optional card", () => {
    expect(getOptionalDestination("logo")).toEqual({ kind: "anchor", anchorId: "setup-logo-editor" });
    expect(getOptionalDestination("cover")).toEqual({ kind: "anchor", anchorId: "setup-cover-editor" });
    expect(getOptionalDestination("description")).toEqual({ kind: "anchor", anchorId: "vendor-description" });
    expect(getOptionalDestination("menuPhotos")).toEqual({ kind: "tab", tab: "menu" });
  });

  it("keeps coming-soon cards inert", () => {
    for (const id of ["businessHours", "ingredients", "deliveryZones", "prepTime", "socialLinks"] as const) {
      expect(getOptionalDestination(id)).toBeNull();
    }
  });
});
