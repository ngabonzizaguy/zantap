"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type CartMap = Record<string, number>;

interface CartContextValue {
  cart: CartMap;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  resetCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const emptyCart: CartMap = {};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartMap>(emptyCart);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      addItem: (id) =>
        setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 })),
      removeItem: (id) =>
        setCart((prev) => {
          const next = { ...prev };
          const qty = (next[id] ?? 0) - 1;
          if (qty <= 0) delete next[id];
          else next[id] = qty;
          return next;
        }),
      resetCart: () => setCart(emptyCart),
    }),
    [cart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
