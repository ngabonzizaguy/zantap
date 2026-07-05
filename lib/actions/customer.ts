"use server";

import { getStore } from "@/lib/store";
import { manualPaymentRef } from "@/lib/momo/ussd-dial";
import type {
  AbandonManualPaymentResult,
  ConfirmManualPaymentResult,
  CreateOrderInput,
  CreatePaymentResult,
  Order,
  ResumableManualOrder,
} from "@/lib/types";

/**
 * Customer checkout writes the Order through the server-side Store, so it lands
 * in the one source of truth the KDS and the MoMo confirm path both read.
 */
export async function placeOrder(input: CreateOrderInput): Promise<Order> {
  return getStore().createOrder(input);
}

export async function initManualPayment(
  orderId: string,
  amount: number
): Promise<CreatePaymentResult> {
  return getStore().createPayment({
    orderId,
    amount,
    transactionRef: manualPaymentRef(orderId),
  });
}

export async function confirmManualPayment(
  orderId: string,
  customerPhone: string
): Promise<ConfirmManualPaymentResult> {
  return getStore().confirmManualPayment(orderId, customerPhone);
}

export async function abandonManualPayment(
  orderId: string,
  customerPhone: string
): Promise<AbandonManualPaymentResult> {
  return getStore().abandonManualPayment(orderId, customerPhone);
}

export async function findResumableManualOrder(
  vendorSlug: string,
  customerPhone: string
): Promise<ResumableManualOrder | null> {
  return getStore().findResumableManualOrder(vendorSlug, customerPhone);
}
