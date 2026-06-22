import type { ConfirmPinRequest, StkPushRequest, StkPushResponse } from "@/lib/types";
import { getStore } from "@/lib/store";

export { MOMO_SIM_PIN_HINT } from "@/lib/momo/constants";

interface PendingTransaction {
  orderId: string;
  phone: string;
  amount: number;
  vendorName: string;
  createdAt: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
}

const pendingTransactions = new Map<string, PendingTransaction>();

const STK_DELAY_MS = 2000;
const VALID_PIN = "12345";

function generateToken(): string {
  return `stk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function initiateStkPush(
  request: StkPushRequest
): Promise<StkPushResponse> {
  await new Promise((resolve) => setTimeout(resolve, STK_DELAY_MS));

  const token = generateToken();
  pendingTransactions.set(token, {
    orderId: request.orderId,
    phone: request.phone,
    amount: request.amount,
    vendorName: request.vendorName,
    createdAt: Date.now(),
    status: "PENDING",
  });

  return {
    token,
    status: "PENDING",
    message: `STK push sent to ${request.phone}. Awaiting PIN authorization.`,
  };
}

export async function confirmStkPin(
  request: ConfirmPinRequest
): Promise<StkPushResponse> {
  const tx = pendingTransactions.get(request.token);

  if (!tx) {
    return {
      token: request.token,
      status: "FAILED",
      message: "Transaction not found or expired.",
    };
  }

  if (request.pin !== VALID_PIN) {
    tx.status = "FAILED";
    return {
      token: request.token,
      status: "FAILED",
      message: "Invalid PIN. Please try again.",
    };
  }

  tx.status = "SUCCESS";
  await getStore().updateOrderStatus(tx.orderId, "PAID");

  return {
    token: request.token,
    status: "SUCCESS",
    message: `Payment of ${tx.amount} RWF authorized successfully.`,
  };
}

export function getTransaction(token: string): PendingTransaction | undefined {
  return pendingTransactions.get(token);
}
