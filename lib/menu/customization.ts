import type { MenuItem } from "@/lib/types";
import { getMenuItemPrice } from "@/lib/menu/sizes";

/**
 * Presentation-shaped customization model for the storefront customize modal.
 *
 * SERVER-SAFE on purpose: no `"use client"`, no React/DOM imports. `icon` is an
 * Icon-name string (resolved to a component by the client), never a component.
 *
 * Types are persistence-shaped so the future "real modifiers" epic is an
 * extension, not a rewrite: every option carries a stable string `id` (the
 * future Order join key) and integer RWF prices (never display strings).
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
 * The single structured payload the modal emits. The future line-item cart and
 * `CreateOrderInput.items` grow into exactly this shape (additively).
 */
export interface CustomizationSelection {
  menuItemId: string;
  sizeOptionId?: string;
  qty: number;
  removedIncludedIds: string[];
  addOns: { id: string; qty: number }[];
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
 * When false, the customize modal shows images + notes only (candidate #21).
 * Types, fallback catalog, and pricing helpers stay for a future modifiers epic.
 */
export const INGREDIENTS_UI_ENABLED = false;

/**
 * Generic, item-agnostic fallback so every item's modal looks complete even
 * though no item carries a real `customization` field yet. This is the seam a
 * future real (Store-backed) catalog grows into.
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
 * Pure display total: `(base + Σ addOn.priceRwf × addOn.qty) × qty`.
 * Removals are price-neutral this slice (no credit).
 *
 * Server-safe and reused verbatim by future server-side re-pricing at the trust
 * boundary so the client and server totals can never drift in logic.
 */
export function computeCustomizeTotal(
  selection: CustomizationSelection,
  item: MenuItem
): number {
  const { addOns } = resolveCustomization(item);

  const addOnTotal = selection.addOns.reduce((sum, picked) => {
    const option = addOns.find((addOn) => addOn.id === picked.id);
    if (!option) return sum;
    return sum + option.priceRwf * picked.qty;
  }, 0);

  return (getMenuItemPrice(item, selection.sizeOptionId) + addOnTotal) * selection.qty;
}
