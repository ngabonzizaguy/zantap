import { describe, expect, it } from "vitest";
import { suggestMenuIntakeMatches } from "@/lib/menu-intake/matching";
import type { MenuItem } from "@/lib/types";

const existing = {
  id: "menu-1",
  vendorId: "vendor-1",
  name: "Beef Brochettes",
  category: "Grill",
  priceRwf: 5000,
  isAvailable: false,
} satisfies MenuItem;

describe("menu intake match suggestions", () => {
  it("warns on normalized names but never chooses an update automatically", () => {
    expect(
      suggestMenuIntakeMatches(
        [
          {
            clientId: "dish-1",
            name: "  BEEF-brochettes ",
            category: "Grill",
            priceRwf: 6000,
          },
        ],
        [existing],
      ),
    ).toEqual([
      expect.objectContaining({
        kind: "POSSIBLE_MATCH",
        existingMenuItemId: "menu-1",
        reason: "EXACT_NAME",
        defaultDecision: "SKIP",
      }),
    ]);
  });

  it("selects genuinely new dishes for creation", () => {
    expect(
      suggestMenuIntakeMatches(
        [
          {
            clientId: "dish-2",
            name: "Isombe",
            category: "Rwandan",
            priceRwf: 3500,
          },
        ],
        [existing],
      )[0],
    ).toMatchObject({ kind: "NEW", defaultDecision: "ADD_NEW" });
  });
});
