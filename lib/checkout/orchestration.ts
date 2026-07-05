import { normalizePhone } from "@/lib/format";
import { paymentWindowExpiresAt } from "@/lib/momo/payment-window";
import { buildMomoUssdDial, validateVendorPayout } from "@/lib/momo/ussd-dial";
import type { CreateOrderInput, MomoMode, Order, Vendor } from "@/lib/types";
import type { MomoClient } from "./momo-client";
import type { CheckoutLine } from "./types";
import { canProceedToPay } from "./validation";

export interface PayInput {
  vendorSlug: string;
  vendorName: string;
  vendor: Pick<Vendor, "payoutMethod" | "momoCode">;
  momoMode: MomoMode;
  lines: CheckoutLine[];
  phone: string;
  sector: string;
  landmark: string;
  count: number;
}

export type PlaceOrderFn = (input: CreateOrderInput) => Promise<Order>;

export type InitManualPaymentFn = (
  orderId: string,
  amount: number
) => Promise<{ ok: boolean }>;

export type PayResult =
  | { kind: "skipped" }
  | { kind: "success"; orderId: string; stkToken: string }
  | {
      kind: "manual_success";
      orderId: string;
      ussdDial: string;
      orderCreatedAt: Date;
      expiresAt: number;
    }
  | { kind: "payout_invalid" }
  | { kind: "failed" };

export async function executePay(
  input: PayInput,
  deps: {
    placeOrder: PlaceOrderFn;
    momoClient: MomoClient;
    initManualPayment?: InitManualPaymentFn;
  }
): Promise<PayResult> {
  const {
    count,
    phone,
    sector,
    landmark,
    lines,
    vendorSlug,
    vendorName,
    vendor,
    momoMode,
  } = input;

  if (!canProceedToPay(count, phone, sector, landmark)) {
    return { kind: "skipped" };
  }

  if (momoMode === "manual") {
    if (!validateVendorPayout(vendor).ok) {
      return { kind: "payout_invalid" };
    }
  }

  try {
    const order = await deps.placeOrder({
      vendorSlug,
      customerPhone: normalizePhone(phone),
      deliverySector: sector,
      landmark,
      items: lines.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.qty,
        ...(line.notes ? { notes: line.notes } : {}),
      })),
    });

    if (momoMode === "manual") {
      const dial = buildMomoUssdDial(vendor, order.totalAmount);
      if (!dial.ok) {
        return { kind: "payout_invalid" };
      }

      const init = deps.initManualPayment
        ? await deps.initManualPayment(order.id, order.totalAmount)
        : { ok: true };
      if (!init.ok) {
        return { kind: "failed" };
      }

      const orderCreatedAt =
        order.createdAt instanceof Date
          ? order.createdAt
          : new Date(order.createdAt);

      return {
        kind: "manual_success",
        orderId: order.id,
        ussdDial: dial.ussd,
        orderCreatedAt,
        expiresAt: paymentWindowExpiresAt(orderCreatedAt).getTime(),
      };
    }

    const data = await deps.momoClient.initiateStkPush({
      orderId: order.id,
      phone: normalizePhone(phone),
      amount: order.totalAmount,
      vendorName,
    });

    if (data.status === "FAILED") {
      return { kind: "failed" };
    }

    return { kind: "success", orderId: order.id, stkToken: data.token };
  } catch {
    return { kind: "failed" };
  }
}

export type ConfirmPinResult =
  | { kind: "skipped" }
  | { kind: "success" }
  | { kind: "retry" };

export async function executeConfirmPin(
  pin: string,
  stkToken: string,
  momoClient: MomoClient
): Promise<ConfirmPinResult> {
  if (pin.length < 5) {
    return { kind: "skipped" };
  }

  const data = await momoClient.confirmStkPin({ token: stkToken, pin });

  if (data.status === "SUCCESS") {
    return { kind: "success" };
  }

  return { kind: "retry" };
}

export type ConfirmManualResult =
  | { kind: "success" }
  | { kind: "expired" }
  | { kind: "failed" };

export type ConfirmManualPaymentFn = (
  orderId: string,
  customerPhone: string
) => Promise<{ ok: boolean; code?: string }>;

export async function executeConfirmManual(
  orderId: string,
  customerPhone: string,
  confirmFn: ConfirmManualPaymentFn
): Promise<ConfirmManualResult> {
  const result = await confirmFn(orderId, normalizePhone(customerPhone));
  if (result.ok) return { kind: "success" };
  if (result.code === "WINDOW_EXPIRED") return { kind: "expired" };
  return { kind: "failed" };
}

export type AbandonManualPaymentFn = (
  orderId: string,
  customerPhone: string
) => Promise<{ ok: boolean }>;

export async function executeAbandonManual(
  orderId: string,
  customerPhone: string,
  abandonFn: AbandonManualPaymentFn
): Promise<boolean> {
  const result = await abandonFn(orderId, normalizePhone(customerPhone));
  return result.ok;
}
