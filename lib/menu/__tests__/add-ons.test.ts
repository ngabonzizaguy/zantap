import { describe, expect, it } from "vitest";
import {
  resolveAddOnSelection,
  validateMenuItemAddOnGroups,
} from "@/lib/menu/add-ons";
import type { MenuItemAddOnGroup } from "@/lib/types";

const groups: MenuItemAddOnGroup[] = [
  {
    id: "sauce",
    name: "Choose a sauce",
    required: true,
    selection: "SINGLE",
    choices: [
      { id: "mayo", label: "Mayo", priceRwf: 0, isAvailable: true },
      { id: "chilli", label: "Chilli", priceRwf: 300, isAvailable: true },
    ],
  },
  {
    id: "extras",
    name: "Choose extras",
    required: false,
    selection: "MULTIPLE",
    maxSelections: 2,
    choices: [
      { id: "avocado", label: "Avocado", priceRwf: 1_000, isAvailable: true },
      { id: "cheese", label: "Cheese", priceRwf: 500, isAvailable: false },
    ],
  },
];

describe("menu add-ons", () => {
  it("validates the approved group model and limits", () => {
    expect(validateMenuItemAddOnGroups(groups)).toBeNull();
    expect(validateMenuItemAddOnGroups([...groups, ...groups, ...groups, groups[0]])).toMatch(/6 groups/);
  });

  it("resolves current available choices into a server-priced snapshot", () => {
    expect(resolveAddOnSelection(groups, ["chilli", "avocado"])).toEqual({
      surchargeRwf: 1_300,
      groups: [
        {
          groupId: "sauce",
          groupName: "Choose a sauce",
          choices: [{ choiceId: "chilli", label: "Chilli", priceRwf: 300 }],
        },
        {
          groupId: "extras",
          groupName: "Choose extras",
          choices: [{ choiceId: "avocado", label: "Avocado", priceRwf: 1_000 }],
        },
      ],
    });
  });

  it("rejects missing required, unavailable, duplicate, and over-limit selections", () => {
    expect(() => resolveAddOnSelection(groups, [])).toThrow("Choose one option from Choose a sauce");
    expect(() => resolveAddOnSelection(groups, ["mayo", "cheese"])).toThrow("unavailable");
    expect(() => resolveAddOnSelection(groups, ["mayo", "mayo"])).toThrow("more than once");
    expect(() => resolveAddOnSelection(groups, ["mayo", "avocado", "cheese"])).toThrow();
  });
});
