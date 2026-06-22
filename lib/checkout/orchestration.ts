import { normalizePhone } from "@/lib/format";
import type { CreateOrderInput, Order } from "@/lib/types";
import type { MomoClient } from "./momo-client";
import type { CheckoutLine } from "./types";
import { canProceedToPay } from "./validation";

export interface PayInput {
  vendorSlug: string;
  vendorName: string;
  lines: CheckoutLine[];
  phone: string;
  sector: string;
  landmark: string;
  count: number;
}

export type PlaceOrderFn = (input: CreateOrderInput) => Promise<Order>;

export type PayResult =
  | { kind: "skipped" }
  | { kind: "success"; orderId: string; stkToken: string }
  | { kind: "failed" };

export async function executePay(
  input: PayInput,
  deps: { placeOrder: PlaceOrderFn; momoClient: MomoClient }
): Promise<PayResult> {
  const { count, phone, sector, landmark, lines, vendorSlug, vendorName } = input;

  if (!canProceedToPay(count, phone, sector, landmark)) {
    return { kind: "skipped" };
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
      })),
    });

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
