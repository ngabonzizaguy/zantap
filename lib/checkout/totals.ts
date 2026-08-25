import type { MenuItem } from "@/lib/types";
import {
  buildCartLineKey,
  getMenuItemPrice,
  parseCartLineKey,
} from "@/lib/menu/sizes";
import type { CartNotes, CartQuantities, CheckoutLine } from "./types";

export function computeCount(cart: CartQuantities): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function computeTotal(cart: CartQuantities, menu: MenuItem[]): number {
  const menuById = new Map(menu.map((item) => [item.id, item]));
  return Object.entries(cart).reduce((sum, [lineKey, quantity]) => {
    const { menuItemId, sizeOptionId } = parseCartLineKey(lineKey);
    const item = menuById.get(menuItemId);
    if (!item || quantity <= 0) return sum;
    try {
      return sum + quantity * getMenuItemPrice(item, sizeOptionId);
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
  return menu.flatMap((item) => {
    const options: Array<{
      lineKey: string;
      priceRwf: number;
      sizeOptionId?: string;
      sizeLabel?: string;
    }> = item.sizeOptions?.length
      ? item.sizeOptions.filter((option) => option.isAvailable).map((option) => ({
          lineKey: buildCartLineKey(item.id, option.id),
          sizeOptionId: option.id,
          sizeLabel: option.label,
          priceRwf: option.priceRwf,
        }))
      : [{ lineKey: item.id, priceRwf: item.priceRwf }];

    return options.flatMap((option) => {
      const qty = cart[option.lineKey] ?? 0;
      if (qty <= 0) return [];
      const notes = itemNotes[option.lineKey];
      return [
        {
          lineKey: option.lineKey,
          menuItemId: item.id,
          name: item.name,
          ...(option.sizeOptionId
            ? {
                sizeOptionId: option.sizeOptionId,
                sizeLabel: option.sizeLabel,
              }
            : {}),
          qty,
          lineTotal: qty * option.priceRwf,
          ...(notes ? { notes } : {}),
        },
      ];
    });
  });
}
