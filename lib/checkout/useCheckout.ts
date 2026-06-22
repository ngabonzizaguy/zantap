"use client";

import { useCallback, useMemo, useState } from "react";
import { placeOrder as defaultPlaceOrder } from "@/lib/actions/customer";
import { useCart } from "@/components/customer/CartContext";
import type { CheckoutStage, MenuItem, Vendor } from "@/lib/types";
import { defaultMomoClient, type MomoClient } from "./momo-client";
import {
  executeConfirmPin,
  executePay,
  type PlaceOrderFn,
} from "./orchestration";
import { transition } from "./stages";
import { computeCount, computeLines, computeTotal } from "./totals";
import { canProceedToPay } from "./validation";

const initialCheckoutFields = {
  stage: "menu" as CheckoutStage,
  phone: "",
  sector: "",
  landmark: "",
  pin: "",
  orderId: "",
  stkToken: "",
};

export interface CheckoutDeps {
  placeOrder: PlaceOrderFn;
  momoClient: MomoClient;
}

export interface UseCheckoutOptions {
  deps?: Partial<CheckoutDeps>;
}

export function useCheckout(
  vendor: Vendor,
  menu: MenuItem[],
  options?: UseCheckoutOptions
) {
  const { cart } = useCart();
  const placeOrderFn = options?.deps?.placeOrder ?? defaultPlaceOrder;
  const momoClient = options?.deps?.momoClient ?? defaultMomoClient;

  const [stage, setStage] = useState<CheckoutStage>(initialCheckoutFields.stage);
  const [phone, setPhone] = useState(initialCheckoutFields.phone);
  const [sector, setSector] = useState(initialCheckoutFields.sector);
  const [landmark, setLandmark] = useState(initialCheckoutFields.landmark);
  const [pin, setPin] = useState(initialCheckoutFields.pin);
  const [orderId, setOrderId] = useState(initialCheckoutFields.orderId);
  const [stkToken, setStkToken] = useState(initialCheckoutFields.stkToken);

  const count = useMemo(() => computeCount(cart), [cart]);
  const total = useMemo(() => computeTotal(cart, menu), [cart, menu]);
  const lines = useMemo(() => computeLines(cart, menu), [cart, menu]);
  const canPay = canProceedToPay(count, phone, sector, landmark);

  const applyStage = useCallback((event: Parameters<typeof transition>[1]) => {
    setStage((current) => transition(current, event) ?? current);
  }, []);

  const pay = useCallback(async () => {
    if (!canPay) return;

    setStage("loading");

    const result = await executePay(
      {
        vendorSlug: vendor.slug,
        vendorName: vendor.name,
        lines,
        phone,
        sector,
        landmark,
        count,
      },
      { placeOrder: placeOrderFn, momoClient }
    );

    if (result.kind === "success") {
      setOrderId(result.orderId);
      setStkToken(result.stkToken);
      setStage("ussd");
      return;
    }

    if (result.kind === "failed") {
      setStage("cart");
    }
  }, [
    canPay,
    vendor.slug,
    vendor.name,
    lines,
    phone,
    sector,
    landmark,
    count,
    placeOrderFn,
    momoClient,
  ]);

  const confirmPin = useCallback(async () => {
    const result = await executeConfirmPin(pin, stkToken, momoClient);

    if (result.kind === "success") {
      applyStage("pin_success");
    }
  }, [pin, stkToken, momoClient, applyStage]);

  const reset = useCallback(() => {
    setStage(initialCheckoutFields.stage);
    setPhone(initialCheckoutFields.phone);
    setSector(initialCheckoutFields.sector);
    setLandmark(initialCheckoutFields.landmark);
    setPin(initialCheckoutFields.pin);
    setOrderId(initialCheckoutFields.orderId);
    setStkToken(initialCheckoutFields.stkToken);
  }, []);

  return {
    stage,
    setStage,
    phone,
    setPhone,
    sector,
    setSector,
    landmark,
    setLandmark,
    pin,
    setPin,
    orderId,
    stkToken,
    count,
    total,
    lines,
    canPay,
    pay,
    confirmPin,
    reset,
    applyStage,
  };
}
