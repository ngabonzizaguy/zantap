import type { MenuItem } from "@/lib/types";
import { getMenuItemPrice } from "@/lib/menu/sizes";

/**
 * Presentation-shaped customization model for the storefront customize modal.
 *
 * SERVER-SAFE on purpose: no `"use client"`, no React/DOM imports. `icon` is an
 * Icon-name string (resolved to a component by the client), never a component.
 *
 * This retains ADR-0019's legacy included-ingredient/fallback shapes. Real
 * persisted add-ons live in lib/menu/add-ons.ts (ADR-0071).
 */

export interface IngredientOption {
  id: string;
  name: string;
  description?: string;
  /** Icon-name string (e.g. "plate"); resolved to a component on the client. */
  icon?: string;
  defaultIncluded: boolean;
}

export interface AddOnOption {
  id: string;
  name: string;
  /** Integer RWF; never a formatted display string. */
  priceRwf: number;
  description?: string;
  /** Icon-name string (e.g. "plus"); resolved to a component on the client. */
  icon?: string;
}

export interface ItemCustomization {
  included: IngredientOption[];
  addOns: AddOnOption[];
}

/**
 * The single structured payload the modal emits to the line-item cart.
 */
export interface CustomizationSelection {
  menuItemId: string;
  sizeOptionId?: string;
  qty: number;
  removedIncludedIds: string[];
  /** Legacy presentation-only shape retained for old in-memory fixtures. */
  addOns: { id: string; qty: number }[];
  /** Current item-specific choice ids; prices are resolved again by the Store. */
  addOnChoiceIds?: string[];
  notes: string;
}

/** Max characters for the special-instructions note. */
export const CUSTOMIZATION_NOTES_MAX = 200;

/** Trim and cap notes for cart / order persistence; empty → undefined. */
export function sanitizeItemNotes(notes: string): string | undefined {
  const trimmed = notes.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, CUSTOMIZATION_NOTES_MAX);
}

/**
 * Legacy included-ingredient UI stays disabled. Real add-ons do not use this flag.
 */
export const INGREDIENTS_UI_ENABLED = false;

/**
 * Legacy item-agnostic fallback retained for ADR-0019 tests/compatibility.
 */
const GENERIC_FALLBACK: ItemCustomization = {
  included: [
    {
      id: "inc-main",
      name: "Main portion",
      description: "Freshly prepared to order",
      icon: "plate",
      defaultIncluded: true,
    },
    {
      id: "inc-house-sauce",
      name: "House sauce",
      description: "Chef's signature blend",
      icon: "plate",
      defaultIncluded: true,
    },
    {
      id: "inc-garnish",
      name: "Fresh garnish",
      description: "Seasonal greens",
      icon: "plate",
      defaultIncluded: true,
    },
  ],
  addOns: [
    {
      id: "add-extra-portion",
      name: "Extra portion",
      priceRwf: 1000,
      description: "Make it a bigger serving",
      icon: "plus",
    },
    {
      id: "add-spicy-sauce",
      name: "Spicy sauce",
      priceRwf: 300,
      description: "House chili blend",
      icon: "plus",
    },
    {
      id: "add-soft-drink",
      name: "Soft drink",
      priceRwf: 800,
      description: "Chilled bottle",
      icon: "plus",
    },
  ],
};

/** Item's own customization when present, else the generic fallback. */
export function resolveCustomization(item: MenuItem): ItemCustomization {
  return item.customization ?? GENERIC_FALLBACK;
}

/** A fresh draft: qty 1, nothing removed, no add-ons, empty notes. */
export function emptySelection(item: MenuItem): CustomizationSelection {
  return {
    menuItemId: item.id,
    qty: 1,
    removedIncludedIds: [],
    addOns: [],
    notes: "",
  };
}

/**
 * Pure Customer-view total. The Store independently resolves the same stable
 * choice IDs through resolveAddOnSelection at the trust seam.
 */
export function computeCustomizeTotal(
  selection: CustomizationSelection,
  item: MenuItem
): number {
  const addOnTotal = item.addOnGroups?.length
    ? item.addOnGroups.flatMap((group) => group.choices)
        .filter((choice) => (selection.addOnChoiceIds ?? []).includes(choice.id))
        .reduce((sum, choice) => sum + choice.priceRwf, 0)
    : selection.addOns.reduce((sum, picked) => {
        const option = resolveCustomization(item).addOns.find((addOn) => addOn.id === picked.id);
        return sum + (option?.priceRwf ?? 0) * picked.qty;
      }, 0);

  return (getMenuItemPrice(item, selection.sizeOptionId) + addOnTotal) * selection.qty;
}
