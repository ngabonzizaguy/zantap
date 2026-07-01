import { describe, expect, it } from "vitest";
import type { MenuItem } from "@/lib/types";
import {
  countOptionalCompleted,
  deriveOptionalChecklist,
  OPTIONAL_CHECKLIST_ITEMS,
} from "@/lib/vendor/optional-checklist";

const baseItem: MenuItem = {
  id: "item-1",
  vendorId: "v1",
  name: "Brochettes",
  priceRwf: 3500,
  category: "Grill",
  isAvailable: true,
};

const itemWithPhoto: MenuItem = {
  ...baseItem,
  images: [
    {
      id: "img-1",
      menuItemId: "item-1",
      url: "https://example.com/photo.jpg",
      sortOrder: 0,
      isPrimary: true,
      createdAt: new Date(),
    },
  ],
};

describe("deriveOptionalChecklist", () => {
  it("returns all false for a bare vendor with no menu", () => {
    const state = deriveOptionalChecklist({}, []);
    for (const item of OPTIONAL_CHECKLIST_ITEMS) {
      expect(state[item.id]).toBe(false);
    }
  });

  it("marks logo, cover, and description from persisted fields", () => {
    const state = deriveOptionalChecklist(
      {
        logoUrl: "https://cdn.example.com/logo.png",
        coverImageUrl: "https://cdn.example.com/cover.png",
        description: "Best grills in Kigali",
      },
      []
    );
    expect(state.logo).toBe(true);
    expect(state.cover).toBe(true);
    expect(state.description).toBe(true);
  });

  it("treats whitespace-only fields as incomplete", () => {
    const state = deriveOptionalChecklist(
      { logoUrl: "   ", coverImageUrl: "", description: "  " },
      []
    );
    expect(state.logo).toBe(false);
    expect(state.cover).toBe(false);
    expect(state.description).toBe(false);
  });

  it("marks menuPhotos when any menu item has an image", () => {
    expect(deriveOptionalChecklist({}, [baseItem]).menuPhotos).toBe(false);
    expect(deriveOptionalChecklist({}, [itemWithPhoto]).menuPhotos).toBe(true);
  });

  it("keeps coming-soon rows false", () => {
    const state = deriveOptionalChecklist(
      {
        logoUrl: "https://x/l.png",
        coverImageUrl: "https://x/c.png",
        description: "story",
      },
      [itemWithPhoto]
    );
    expect(state.businessHours).toBe(false);
    expect(state.ingredients).toBe(false);
    expect(state.deliveryZones).toBe(false);
    expect(state.prepTime).toBe(false);
    expect(state.socialLinks).toBe(false);
  });
});

describe("countOptionalCompleted", () => {
  it("counts only actionable (non-coming-soon) items", () => {
    const actionable = OPTIONAL_CHECKLIST_ITEMS.filter(
      (item) => !item.comingSoon
    ).length;

    const empty = countOptionalCompleted(deriveOptionalChecklist({}, []));
    expect(empty).toEqual({ completed: 0, total: actionable });

    const full = countOptionalCompleted(
      deriveOptionalChecklist(
        {
          logoUrl: "https://x/l.png",
          coverImageUrl: "https://x/c.png",
          description: "story",
        },
        [itemWithPhoto]
      )
    );
    expect(full).toEqual({ completed: actionable, total: actionable });
  });
});
