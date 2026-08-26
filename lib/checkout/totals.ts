import type { MenuItem } from "@/lib/types";
import { getMenuItemPrice, parseCartLineKey } from "@/lib/menu/sizes";
import type { CartNotes, CartQuantities, CheckoutLine } from "./types";
import { parseAddOnCartLineKey, resolveAddOnSelection } from "@/lib/menu/add-ons";

export function computeCount(cart: CartQuantities): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function computeTotal(cart: CartQuantities, menu: MenuItem[]): number {
  const menuById = new Map(menu.map((item) => [item.id, item]));
  return Object.entries(cart).reduce((sum, [lineKey, quantity]) => {
    const { baseLineKey, choiceIds } = parseAddOnCartLineKey(lineKey);
    const { menuItemId, sizeOptionId } = parseCartLineKey(baseLineKey);
    const item = menuById.get(menuItemId);
    if (!item || quantity <= 0) return sum;
    try {
      const addOns = resolveAddOnSelection(item.addOnGroups, choiceIds);
      return sum + quantity * (getMenuItemPrice(item, sizeOptionId) + addOns.surchargeRwf);
    } catch {
      return sum;
    }
  }, 0);
}

export function computeLines(
  cart: CartQuantities,
  menu: MenuItem[],
  itemNotes: CartNotes = {}
): CheckoutLine[] {
  const menuById = new Map(menu.map((item) => [item.id, item]));
  return Object.entries(cart).flatMap(([lineKey, qty]) => {
    if (qty <= 0) return [];
    const { baseLineKey, choiceIds } = parseAddOnCartLineKey(lineKey);
    const { menuItemId, sizeOptionId } = parseCartLineKey(baseLineKey);
    const item = menuById.get(menuItemId);
    if (!item) return [];
    try {
      const addOns = resolveAddOnSelection(item.addOnGroups, choiceIds);
      const sizeLabel = sizeOptionId
        ? item.sizeOptions?.find((option) => option.id === sizeOptionId)?.label
        : undefined;
      return [{
        lineKey,
        menuItemId,
        name: item.name,
        ...(sizeOptionId ? { sizeOptionId, sizeLabel } : {}),
        ...(choiceIds.length ? {
          addOnChoiceIds: choiceIds,
          addOnLabels: addOns.groups.flatMap((group) => group.choices.map((choice) => choice.label)),
        } : {}),
        qty,
        lineTotal: qty * (getMenuItemPrice(item, sizeOptionId) + addOns.surchargeRwf),
        ...(itemNotes[lineKey] ? { notes: itemNotes[lineKey] } : {}),
      }];
    } catch {
      return [];
    }
  });
}
