import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SavedRestaurantList } from "@/components/customer/RestaurantHub";

describe("saved restaurant list accessibility", () => {
  it("links available Vendors, labels unavailable Vendors, and exposes named remove controls", () => {
    const markup = renderToStaticMarkup(
      createElement(SavedRestaurantList, {
        restaurants: [
          {
            vendorId: "active",
            slug: "active-restaurant",
            name: "Active Restaurant",
            isAvailable: true,
            lastInteractedAt: "2026-08-21T10:00:00.000Z",
          },
          {
            vendorId: "paused",
            slug: "paused-restaurant",
            name: "Paused Restaurant",
            isAvailable: false,
            lastInteractedAt: "2026-08-20T10:00:00.000Z",
          },
        ],
        onRemove: vi.fn(),
      })
    );

    expect(markup).toContain('aria-label="Saved restaurants"');
    expect(markup).toContain('href="/active-restaurant"');
    expect(markup).not.toContain('href="/paused-restaurant"');
    expect(markup).toContain("Open menu");
    expect(markup).toContain("Temporarily unavailable");
    expect(markup).toContain(">Saved</span>");
    expect(markup).toContain(
      'aria-label="Remove Paused Restaurant from saved restaurants"'
    );
  });
});
