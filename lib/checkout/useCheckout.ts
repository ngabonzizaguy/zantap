"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  abandonManualPayment as defaultAbandonManualPayment,
  confirmManualPayment as defaultConfirmManualPayment,
  findResumableManualOrder as defaultFindResumableManualOrder,
  initManualPayment as defaultInitManualPayment,
  placeOrder as defaultPlaceOrder,
} from "@/lib/actions/customer";
import { useCart } from "@/components/customer/CartContext";
import { normalizePhone } from "@/lib/format";
import { vendorPayoutBlockedMessage } from "@/lib/momo/ussd-dial";
import { paymentWindowRemainingMs } from "@/lib/momo/payment-window";
import type { CheckoutStage, MenuItem, MomoMode, Vendor } from "@/lib/types";
import { defaultMomoClient, type MomoClient } from "./momo-client";
import {
  executeAbandonManual,
  executeConfirmManual,
  executeConfirmPin,
  executePay,
  type AbandonManualPaymentFn,
  type ConfirmManualPaymentFn,
  type InitManualPaymentFn,
  type PlaceOrderFn,
} from "./orchestration";
import {
  buildPendingCheckoutState,
  clearPendingCheckout,
  loadPendingCheckout,
  savePendingCheckout,
} from "./pending-order-storage";
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
  ussdDial: "",
  orderCreatedAt: null as Date | null,
  expiresAt: 0,
};

export interface CheckoutDeps {
  placeOrder: PlaceOrderFn;
  momoClient: MomoClient;
  initManualPayment: InitManualPaymentFn;
  confirmManualPayment: ConfirmManualPaymentFn;
  abandonManualPayment: AbandonManualPaymentFn;
  findResumableManualOrder: (
    vendorSlug: string,
    customerPhone: string
  ) => Promise<{
    order: { id: string; createdAt: Date | string };
    ussdDial: string;
  } | null>;
}

export interface UseCheckoutOptions {
  momoMode?: MomoMode;
  deps?: Partial<CheckoutDeps>;
}

export function useCheckout(
  vendor: Vendor,
  menu: MenuItem[],
  options?: UseCheckoutOptions
) {
  const momoMode = options?.momoMode ?? "simulate";
  const { cart, itemNotes } = useCart();
  const placeOrderFn = options?.deps?.placeOrder ?? defaultPlaceOrder;
  const momoClient = options?.deps?.momoClient ?? defaultMomoClient;
  const initManualPaymentFn =
    options?.deps?.initManualPayment ?? defaultInitManualPayment;
  const confirmManualPaymentFn =
    options?.deps?.confirmManualPayment ?? defaultConfirmManualPayment;
  const abandonManualPaymentFn =
    options?.deps?.abandonManualPayment ?? defaultAbandonManualPayment;
  const findResumableManualOrderFn =
    options?.deps?.findResumableManualOrder ?? defaultFindResumableManualOrder;

  const [stage, setStage] = useState<CheckoutStage>(initialCheckoutFields.stage);
  const [phone, setPhone] = useState(initialCheckoutFields.phone);
  const [sector, setSector] = useState(initialCheckoutFields.sector);
  const [landmark, setLandmark] = useState(initialCheckoutFields.landmark);
  const [pin, setPin] = useState(initialCheckoutFields.pin);
  const [orderId, setOrderId] = useState(initialCheckoutFields.orderId);
  const [stkToken, setStkToken] = useState(initialCheckoutFields.stkToken);
  const [ussdDial, setUssdDial] = useState(initialCheckoutFields.ussdDial);
  const [orderCreatedAt, setOrderCreatedAt] = useState<Date | null>(
    initialCheckoutFields.orderCreatedAt
  );
  const [expiresAt, setExpiresAt] = useState(initialCheckoutFields.expiresAt);
  const [payError, setPayError] = useState<string | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualBusy, setManualBusy] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const resumePromptDismissed = useRef(false);

  const count = useMemo(() => computeCount(cart), [cart]);
  const total = useMemo(() => computeTotal(cart, menu), [cart, menu]);
  const lines = useMemo(
    () => computeLines(cart, menu, itemNotes),
    [cart, menu, itemNotes]
  );
  const canPay = canProceedToPay(count, phone, sector, landmark);
  const isManualFlow = momoMode === "manual";

  const applyStage = useCallback((event: Parameters<typeof transition>[1]) => {
    setStage((current) => transition(current, event) ?? current);
  }, []);

  const restoreManualSession = useCallback(
    (input: {
      orderId: string;
      ussdDial: string;
      customerPhone: string;
      orderCreatedAt: Date;
      expiresAt: number;
      stage?: CheckoutStage;
    }) => {
      setOrderId(input.orderId);
      setUssdDial(input.ussdDial);
      setPhone(input.customerPhone);
      setOrderCreatedAt(input.orderCreatedAt);
      setExpiresAt(input.expiresAt);
      setStage(input.stage ?? "awaiting_confirmation");
      savePendingCheckout(
        buildPendingCheckoutState({
          orderId: input.orderId,
          vendor,
          customerPhone: normalizePhone(input.customerPhone),
          ussdDial: input.ussdDial,
          orderCreatedAt: input.orderCreatedAt,
          expiresAt: input.expiresAt,
        })
      );
    },
    [vendor]
  );

  useEffect(() => {
    if (!isManualFlow) return;

    const stored = loadPendingCheckout(vendor.slug);
    if (!stored) return;

    const createdAt = new Date(stored.orderCreatedAt);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage is client-only external state; restore must run post-hydration
    restoreManualSession({
      orderId: stored.orderId,
      ussdDial: stored.ussdDial,
      customerPhone: stored.customerPhone,
      orderCreatedAt: createdAt,
      expiresAt: stored.expiresAt,
      stage: "awaiting_confirmation",
    });
  }, [isManualFlow, restoreManualSession, vendor.slug]);

  useEffect(() => {
    if (!isManualFlow || !canProceedToPay(count, phone, sector, landmark)) {
      return;
    }
    if (stage !== "cart" && stage !== "menu") return;
    if (resumePromptDismissed.current) return;

    const normalized = normalizePhone(phone);
    if (normalized.length < 10) return;

    let cancelled = false;
    void findResumableManualOrderFn(vendor.slug, normalized).then((resumable) => {
      if (cancelled || !resumable) return;
      const createdAt =
        resumable.order.createdAt instanceof Date
          ? resumable.order.createdAt
          : new Date(resumable.order.createdAt);
      const remaining = paymentWindowRemainingMs(createdAt);
      if (remaining <= 0) return;

      restoreManualSession({
        orderId: resumable.order.id,
        ussdDial: resumable.ussdDial,
        customerPhone: normalized,
        orderCreatedAt: createdAt,
        expiresAt: Date.now() + remaining,
        stage: "awaiting_confirmation",
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    count,
    findResumableManualOrderFn,
    isManualFlow,
    landmark,
    phone,
    restoreManualSession,
    sector,
    stage,
    vendor.slug,
  ]);

  useEffect(() => {
    if (
      !isManualFlow ||
      (stage !== "awaiting_confirmation" && stage !== "momo_dial") ||
      !orderCreatedAt
    ) {
      return;
    }

    const tick = () => {
      const remaining = paymentWindowRemainingMs(orderCreatedAt);
      setRemainingMs(remaining);
      if (remaining <= 0 && orderId) {
        void executeAbandonManual(orderId, phone, abandonManualPaymentFn).then(
          () => {
            clearPendingCheckout(vendor.slug);
            setManualError("Payment timed out. Start again.");
            applyStage("manual_expired");
          }
        );
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    abandonManualPaymentFn,
    applyStage,
    isManualFlow,
    orderCreatedAt,
    orderId,
    phone,
    stage,
    vendor.slug,
  ]);

  const pay = useCallback(async () => {
    if (!canPay) return;

    setPayError(null);
    setManualError(null);
    setStage("loading");

    const result = await executePay(
      {
        vendorSlug: vendor.slug,
        vendorName: vendor.name,
        vendor,
        momoMode,
        lines,
        phone,
        sector,
        landmark,
        count,
      },
      {
        placeOrder: placeOrderFn,
        momoClient,
        initManualPayment: async (id, amount) => {
          const created = await initManualPaymentFn(id, amount);
          return { ok: created.ok };
        },
      }
    );

    if (result.kind === "manual_success") {
      setOrderId(result.orderId);
      setUssdDial(result.ussdDial);
      setOrderCreatedAt(result.orderCreatedAt);
      setExpiresAt(result.expiresAt);
      setRemainingMs(paymentWindowRemainingMs(result.orderCreatedAt));
      savePendingCheckout(
        buildPendingCheckoutState({
          orderId: result.orderId,
          vendor,
          customerPhone: normalizePhone(phone),
          ussdDial: result.ussdDial,
          orderCreatedAt: result.orderCreatedAt,
          expiresAt: result.expiresAt,
        })
      );
      setStage("momo_dial");
      return;
    }

    if (result.kind === "success") {
      setOrderId(result.orderId);
      setStkToken(result.stkToken);
      setStage("ussd");
      return;
    }

    if (result.kind === "payout_invalid") {
      setPayError(vendorPayoutBlockedMessage(vendor.name));
      setStage("cart");
      return;
    }

    if (result.kind === "failed") {
      setStage("cart");
    }
  }, [
    canPay,
    vendor,
    momoMode,
    lines,
    phone,
    sector,
    landmark,
    count,
    placeOrderFn,
    momoClient,
    initManualPaymentFn,
  ]);

  const openMomoDialer = useCallback(() => {
    applyStage("momo_dial_opened");
  }, [applyStage]);

  const confirmPin = useCallback(async () => {
    const result = await executeConfirmPin(pin, stkToken, momoClient);

    if (result.kind === "success") {
      applyStage("pin_success");
    }
  }, [pin, stkToken, momoClient, applyStage]);

  const confirmManualPaid = useCallback(async () => {
    if (!orderId) return;
    setManualBusy(true);
    setManualError(null);

    const result = await executeConfirmManual(
      orderId,
      phone,
      confirmManualPaymentFn
    );

    setManualBusy(false);

    if (result.kind === "success") {
      clearPendingCheckout(vendor.slug);
      applyStage("manual_confirm_success");
      return;
    }

    if (result.kind === "expired") {
      await executeAbandonManual(orderId, phone, abandonManualPaymentFn);
      clearPendingCheckout(vendor.slug);
      setManualError("Payment timed out. Start again.");
      applyStage("manual_expired");
      return;
    }

    setManualError("Could not confirm payment. Try again.");
  }, [
    abandonManualPaymentFn,
    applyStage,
    confirmManualPaymentFn,
    orderId,
    phone,
    vendor.slug,
  ]);

  const abandonManual = useCallback(async () => {
    if (!orderId) {
      applyStage("manual_abandon");
      return;
    }

    setManualBusy(true);
    await executeAbandonManual(orderId, phone, abandonManualPaymentFn);
    clearPendingCheckout(vendor.slug);
    setManualBusy(false);
    setManualError(null);
    resumePromptDismissed.current = true;
    applyStage("manual_abandon");
  }, [abandonManualPaymentFn, applyStage, orderId, phone, vendor.slug]);

  const reset = useCallback(() => {
    clearPendingCheckout(vendor.slug);
    setStage(initialCheckoutFields.stage);
    setPhone(initialCheckoutFields.phone);
    setSector(initialCheckoutFields.sector);
    setLandmark(initialCheckoutFields.landmark);
    setPin(initialCheckoutFields.pin);
    setOrderId(initialCheckoutFields.orderId);
    setStkToken(initialCheckoutFields.stkToken);
    setUssdDial(initialCheckoutFields.ussdDial);
    setOrderCreatedAt(initialCheckoutFields.orderCreatedAt);
    setExpiresAt(initialCheckoutFields.expiresAt);
    setPayError(null);
    setManualError(null);
    setManualBusy(false);
    setRemainingMs(0);
    resumePromptDismissed.current = false;
  }, [vendor.slug]);

  const countdownLabel = useMemo(() => {
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")} left to confirm`;
  }, [remainingMs]);

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
    ussdDial,
    orderCreatedAt,
    expiresAt,
    count,
    total,
    lines,
    canPay,
    payError,
    manualError,
    manualBusy,
    countdownLabel,
    isManualFlow,
    pay,
    confirmPin,
    confirmManualPaid,
    abandonManual,
    openMomoDialer,
    reset,
    applyStage,
  };
}
