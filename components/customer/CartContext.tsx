"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CheckoutStage, MenuItem } from "@/lib/types";

export type CartMap = Record<string, number>;

interface CartContextValue {
  cart: CartMap;
  stage: CheckoutStage;
  phone: string;
  sector: string;
  landmark: string;
  sectorOpen: boolean;
  pin: string;
  orderId: string;
  stkToken: string;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  setStage: (stage: CheckoutStage) => void;
  setPhone: (phone: string) => void;
  setSector: (sector: string) => void;
  setLandmark: (landmark: string) => void;
  setSectorOpen: (open: boolean) => void;
  setPin: (pin: string) => void;
  setOrderId: (id: string) => void;
  setStkToken: (token: string) => void;
  reset: () => void;
  getCount: () => number;
  getTotal: (menu: MenuItem[]) => number;
  getLines: (menu: MenuItem[]) => Array<{
    menuItemId: string;
    name: string;
    qty: number;
    lineTotal: number;
  }>;
}

const CartContext = createContext<CartContextValue | null>(null);

const initialState = {
  cart: {} as CartMap,
  stage: "menu" as CheckoutStage,
  phone: "",
  sector: "",
  landmark: "",
  sectorOpen: false,
  pin: "",
  orderId: "",
  stkToken: "",
};

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartMap>(initialState.cart);
  const [stage, setStage] = useState<CheckoutStage>(initialState.stage);
  const [phone, setPhone] = useState(initialState.phone);
  const [sector, setSector] = useState(initialState.sector);
  const [landmark, setLandmark] = useState(initialState.landmark);
  const [sectorOpen, setSectorOpen] = useState(initialState.sectorOpen);
  const [pin, setPin] = useState(initialState.pin);
  const [orderId, setOrderId] = useState(initialState.orderId);
  const [stkToken, setStkToken] = useState(initialState.stkToken);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      stage,
      phone,
      sector,
      landmark,
      sectorOpen,
      pin,
      orderId,
      stkToken,
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
      setStage,
      setPhone,
      setSector,
      setLandmark,
      setSectorOpen,
      setPin,
      setOrderId,
      setStkToken,
      reset: () => {
        setCart(initialState.cart);
        setStage(initialState.stage);
        setPhone(initialState.phone);
        setSector(initialState.sector);
        setLandmark(initialState.landmark);
        setSectorOpen(initialState.sectorOpen);
        setPin(initialState.pin);
        setOrderId(initialState.orderId);
        setStkToken(initialState.stkToken);
      },
      getCount: () => Object.values(cart).reduce((a, b) => a + b, 0),
      getTotal: (menu) =>
        menu.reduce((sum, item) => sum + (cart[item.id] ?? 0) * item.priceRwf, 0),
      getLines: (menu) =>
        menu
          .filter((item) => (cart[item.id] ?? 0) > 0)
          .map((item) => ({
            menuItemId: item.id,
            name: item.name,
            qty: cart[item.id] ?? 0,
            lineTotal: (cart[item.id] ?? 0) * item.priceRwf,
          })),
    }),
    [cart, stage, phone, sector, landmark, sectorOpen, pin, orderId, stkToken]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
