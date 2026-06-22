import type { ConfirmPinRequest, StkPushRequest, StkPushResponse } from "@/lib/types";
import { getStore } from "@/lib/store";

export { MOMO_SIM_PIN_HINT } from "@/lib/momo/constants";

const STK_DELAY_MS = 2000;

function generateToken(): string {
  return `stk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function initiateStkPush(
  request: StkPushRequest
): Promise<StkPushResponse> {
  await new Promise((resolve) => setTimeout(resolve, STK_DELAY_MS));

  const token = generateToken();
  const result = await getStore().createPayment({
    orderId: request.orderId,
    amount: request.amount,
    transactionRef: token,
  });

  if (!result.ok) {
    if (result.code === "ORDER_NOT_FOUND") {
      return {
        token,
        status: "FAILED",
        message: "Order not found.",
      };
    }
    return {
      token,
      status: "FAILED",
      message: "Payment failed. Please place a new order.",
    };
  }

  const { payment } = result;
  if (payment.status === "SUCCESS") {
    return {
      token: payment.transactionRef,
      status: "SUCCESS",
      message: `Payment of ${payment.amount} RWF authorized successfully.`,
    };
  }

  return {
    token: payment.transactionRef,
    status: "PENDING",
    message: `STK push sent to ${request.phone}. Awaiting PIN authorization.`,
  };
}

export async function confirmStkPin(
  request: ConfirmPinRequest
): Promise<StkPushResponse> {
  const result = await getStore().confirmPayment(request.token, request.pin);

  if (!result.ok) {
    if (result.code === "NOT_FOUND") {
      return {
        token: request.token,
        status: "FAILED",
        message: "Payment not found",
      };
    }
    if (result.code === "INVALID_PIN") {
      return {
        token: request.token,
        status: "FAILED",
        message: "Invalid PIN. Please try again.",
      };
    }
    return {
      token: request.token,
      status: "FAILED",
      message: "Payment failed. Please place a new order.",
    };
  }

  const { payment } = result;
  return {
    token: request.token,
    status: "SUCCESS",
    message: `Payment of ${payment.amount} RWF authorized successfully.`,
  };
}
