import type { MenuItem } from "@/lib/types";
import type { CartNotes, CartQuantities, CheckoutLine } from "./types";

export function computeCount(cart: CartQuantities): number {
  return Object.values(cart).reduce((a, b) => a + b, 0);
}

export function computeTotal(cart: CartQuantities, menu: MenuItem[]): number {
  return menu.reduce(
    (sum, item) => sum + (cart[item.id] ?? 0) * item.priceRwf,
    0
  );
}

export function computeLines(
  cart: CartQuantities,
  menu: MenuItem[],
  itemNotes: CartNotes = {}
): CheckoutLine[] {
  return menu
    .filter((item) => (cart[item.id] ?? 0) > 0)
    .map((item) => {
      const notes = itemNotes[item.id];
      return {
        menuItemId: item.id,
        name: item.name,
        qty: cart[item.id] ?? 0,
        lineTotal: (cart[item.id] ?? 0) * item.priceRwf,
        ...(notes ? { notes } : {}),
      };
    });
}
