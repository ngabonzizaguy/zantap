import { describe, expect, it } from "vitest";

import {
  getVisualGuide,
  getVisualGuideStatus,
  isVisualGuideComplete,
  markVisualGuideDismissed,
  markVisualGuideComplete,
} from "@/lib/kds/visual-guides";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("KDS Visual guides", () => {
  it("defines the complete four-frame kitchen order walkthrough", () => {
    const guide = getVisualGuide("orders-flow");

    expect(guide.title).toBe("Move an order through the kitchen");
    expect(guide.frames).toHaveLength(4);
    expect(guide.frames.map((frame) => frame.stage)).toEqual([
      "ACCEPTED",
      "PREPARING",
      "DISPATCH",
      "COMPLETED",
    ]);
    expect(guide.showMe.tab).toBe("orders");
  });

  it("remembers completion per Vendor without hiding the replayable guide", () => {
    const storage = memoryStorage();

    markVisualGuideComplete(storage, "inka-steakhouse", "orders-flow");

    expect(
      isVisualGuideComplete(storage, "inka-steakhouse", "orders-flow")
    ).toBe(true);
    expect(isVisualGuideComplete(storage, "another-vendor", "orders-flow")).toBe(
      false
    );
    expect(getVisualGuide("orders-flow").title).toBe(
      "Move an order through the kitchen"
    );
  });

  it("distinguishes a closed guide from a completed walkthrough", () => {
    const storage = memoryStorage();

    markVisualGuideDismissed(storage, "inka-steakhouse", "orders-flow");
    expect(getVisualGuideStatus(storage, "inka-steakhouse", "orders-flow")).toBe(
      "dismissed"
    );
    expect(isVisualGuideComplete(storage, "inka-steakhouse", "orders-flow")).toBe(
      false
    );

    markVisualGuideComplete(storage, "inka-steakhouse", "orders-flow");
    expect(getVisualGuideStatus(storage, "inka-steakhouse", "orders-flow")).toBe(
      "complete"
    );
  });
});
