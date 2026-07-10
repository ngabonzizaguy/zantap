"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CustomizationSelection } from "@/lib/menu/customization";
import { sanitizeItemNotes } from "@/lib/menu/customization";

export type CartMap = Record<string, number>;
export type CartNotesMap = Record<string, string>;

interface CartContextValue {
  cart: CartMap;
  itemNotes: CartNotesMap;
  addItem: (id: string) => void;
  addFromCustomization: (selection: CustomizationSelection) => void;
  removeItem: (id: string) => void;
  resetCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart: CartMap = {};
const emptyNotes: CartNotesMap = {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartMap>(emptyCart);
  const [itemNotes, setItemNotes] = useState<CartNotesMap>(emptyNotes);

  // Callbacks are stable (functional setState only) so memoized consumers —
  // e.g. MenuItemCard — don't re-render every time the cart changes.
  const addItem = useCallback((id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }, []);

  const addFromCustomization = useCallback(
    (selection: CustomizationSelection) => {
      setCart((prev) => ({
        ...prev,
        [selection.menuItemId]:
          (prev[selection.menuItemId] ?? 0) + selection.qty,
      }));
      const notes = sanitizeItemNotes(selection.notes);
      setItemNotes((prev) => {
        const next = { ...prev };
        if (notes) next[selection.menuItemId] = notes;
        else delete next[selection.menuItemId];
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      const qty = (next[id] ?? 0) - 1;
      if (qty <= 0) {
        delete next[id];
        setItemNotes((notesPrev) => {
          if (!(id in notesPrev)) return notesPrev;
          const notesNext = { ...notesPrev };
          delete notesNext[id];
          return notesNext;
        });
      } else {
        next[id] = qty;
      }
      return next;
    });
  }, []);

  const resetCart = useCallback(() => {
    setCart(emptyCart);
    setItemNotes(emptyNotes);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      itemNotes,
      addItem,
      addFromCustomization,
      removeItem,
      resetCart,
    }),
    [cart, itemNotes, addItem, addFromCustomization, removeItem, resetCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
