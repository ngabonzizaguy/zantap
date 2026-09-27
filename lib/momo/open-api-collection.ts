import "server-only";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import {
  getMomoOpenApiClient,
  type MomoOpenApiClient,
} from "@/lib/momo/open-api-client";
import { getMomoOpenApiConfig } from "@/lib/momo/open-api-config";
import { vendorPayeeFromPayout } from "@/lib/momo/vendor-payee";
import type { VendorPayout } from "@/lib/types";

export type InitiateCollectionInput = {
  orderId: string;
  amount: number;
  /** Customer MSISDN from checkout. Sandbox may replace with the magic test MSISDN. */
  customerPhone: string;
  vendorName?: string;
};

export type InitiateCollectionResult =
  | {
      ok: true;
      referenceId: string;
      paymentStatus: "PENDING" | "SUCCESS";
      message: string;
    }
  | {
      ok: false;
      code:
        | "ORDER_NOT_FOUND"
        | "PAYMENT_TERMINALLY_FAILED"
        | "MOMO_REJECTED";
      message: string;
    };

export type VendorPayoutAttemptResult =
  | { ok: true; payout: VendorPayout; started: boolean }
  | { ok: false; code: string; message: string; payout?: VendorPayout };

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Sandbox Collection succeeds with MTN's magic MSISDN.
 * Production uses the Customer's checkout phone (digits only).
 */
export function resolveCollectionPayerMsisdn(customerPhone: string): string {
  const config = getMomoOpenApiConfig();
  if (config.environment === "sandbox") {
    return config.sandboxSuccessMsisdn;
  }
  const digits = digitsOnly(customerPhone);
  if (!digits) {
    throw new Error("Customer phone is required for MoMo Collection");
  }
  return digits;
}

/** Re-export for server callers that already imported from this module. */
export { vendorPayeeFromPayout } from "@/lib/momo/vendor-payee";

/**
 * Creates a PENDING Payment (transactionRef = MoMo X-Reference-Id UUID) and
 * calls Collection requesttopay. Status stays PENDING until the webhook.
 */
export async function initiateOpenApiCollection(
  input: InitiateCollectionInput,
  client: MomoOpenApiClient = getMomoOpenApiClient(),
): Promise<InitiateCollectionResult> {
  const referenceId = randomUUID();
  const store = getStore();

  const created = await store.createPayment({
    orderId: input.orderId,
    amount: input.amount,
    transactionRef: referenceId,
  });

  if (!created.ok) {
    return {
      ok: false,
      code: created.code,
      message:
        created.code === "ORDER_NOT_FOUND"
          ? "Order not found."
          : "Payment failed. Please place a new order.",
    };
  }

  if (created.payment.status === "SUCCESS") {
    return {
      ok: true,
      referenceId: created.payment.transactionRef,
      paymentStatus: "SUCCESS",
      message: `Payment of ${created.payment.amount} already authorized.`,
    };
  }

  // Idempotent createPayment may return an existing PENDING row — use its ref.
  const ref = created.payment.transactionRef;

  try {
    const payerMsisdn = resolveCollectionPayerMsisdn(input.customerPhone);
    await client.requestToPay({
      amount: input.amount,
      externalId: input.orderId,
      referenceId: ref,
      payer: { partyIdType: "MSISDN", partyId: payerMsisdn },
      payerMessage: `ZanTap ${input.vendorName ?? "order"}`,
      payeeNote: `Order ${input.orderId}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MoMo Collection rejected";
    return { ok: false, code: "MOMO_REJECTED", message };
  }

  return {
    ok: true,
    referenceId: ref,
    paymentStatus: "PENDING",
    message: "MoMo prompt sent. Awaiting Customer authorization.",
  };
}

/**
 * When Payment is still PENDING, ask MoMo for Collection status and apply it.
 * Used in sandbox (no reliable webhook) and as a safety net if the callback is late.
 */
export async function syncCollectionPaymentFromProvider(
  orderId: string,
  client: MomoOpenApiClient = getMomoOpenApiClient(),
): Promise<"PENDING" | "SUCCESS" | "FAILED" | "NOT_FOUND"> {
  const store = getStore();
  const payment = await store.getPaymentForOrder(orderId);
  if (!payment) return "NOT_FOUND";
  if (payment.status !== "PENDING") return payment.status;

  try {
    const remote = await client.getRequestToPayStatus(payment.transactionRef);
    const normalized = remote.status?.toString().trim().toUpperCase();
    if (normalized === "SUCCESSFUL" || normalized === "SUCCESS") {
      const applied = await store.applyProviderPaymentResult(
        payment.transactionRef,
        "SUCCESS",
      );
      if (applied.ok) {
        void initiateVendorPayoutForOrder(applied.order.id, client);
        return "SUCCESS";
      }
      return "PENDING";
    }
    if (
      normalized === "FAILED" ||
      normalized === "REJECTED" ||
      normalized === "TIMEOUT"
    ) {
      await store.applyProviderPaymentResult(payment.transactionRef, "FAILED");
      return "FAILED";
    }
  } catch {
    // Transient MoMo/network errors — keep PENDING for the next poll.
  }

  return "PENDING";
}

/**
 * Best-effort Vendor payout after Collection SUCCESS (ADR-0096).
 * Persists a VendorPayout row per attempt. Failures leave Order PAID.
 * Commission snapshot not applied yet — full Collection amount is transferred.
 */
export async function initiateVendorPayoutForOrder(
  orderId: string,
  client: MomoOpenApiClient = getMomoOpenApiClient(),
): Promise<VendorPayoutAttemptResult> {
  const store = getStore();
  const payment = await store.getPaymentForOrder(orderId);
  if (!payment || payment.status !== "SUCCESS") {
    return {
      ok: false,
      code: "NO_COLLECTION",
      message: "No successful Collection payment for order",
    };
  }

  const order = await store.getOrder(orderId);
  if (!order) {
    return { ok: false, code: "ORDER_NOT_FOUND", message: "Order not found for payout" };
  }

  const existing = await store.getLatestVendorPayoutForOrder(orderId);
  if (existing?.status === "SUCCESS") {
    return { ok: true, payout: existing, started: false };
  }
  if (existing?.status === "PENDING") {
    return { ok: true, payout: existing, started: false };
  }

  const vendors = await store.listVendors();
  const entry = vendors.find((v) => v.id === order.vendorId);
  if (!entry) {
    return { ok: false, code: "VENDOR_NOT_FOUND", message: "Vendor not found for payout" };
  }

  const vendor = await store.getVendorBySlug(entry.slug);
  if (!vendor) {
    return {
      ok: false,
      code: "VENDOR_DETAIL_NOT_FOUND",
      message: "Vendor detail not found for payout",
    };
  }

  const payee = vendorPayeeFromPayout({
    payoutMethod: vendor.payoutMethod,
    momoCode: vendor.momoCode,
  });
  if (!payee) {
    return {
      ok: false,
      code: "INVALID_PAYEE",
      message: "Vendor payout destination is invalid",
    };
  }

  const referenceId = randomUUID();
  const amount = payment.amount;

  const created = await store.createVendorPayout({
    orderId,
    vendorId: order.vendorId,
    amount,
    referenceId,
    payeeType: payee.partyIdType,
    payeeId: payee.partyId,
    initialStatus: "PENDING",
  });

  if (!created.ok) {
    return {
      ok: false,
      code: created.code,
      message:
        created.code === "PAYOUT_IN_FLIGHT"
          ? "Transfer already in flight"
          : created.code === "ALREADY_PAID_OUT"
            ? "Vendor already paid for this order"
            : `Could not create Vendor payout: ${created.code}`,
      payout: created.payout,
    };
  }

  try {
    await client.transfer({
      amount,
      externalId: orderId,
      referenceId,
      payee,
      payerMessage: "ZanTap vendor payout",
      payeeNote: `Order ${orderId}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MoMo Transfer rejected";
    const failed = await store.applyVendorPayoutResult(
      referenceId,
      "FAILED",
      message,
    );
    return {
      ok: false,
      code: "MOMO_REJECTED",
      message,
      payout: failed.payout ?? created.payout,
    };
  }

  return { ok: true, payout: created.payout, started: true };
}

/**
 * Poll MoMo Transfer status for the latest PENDING VendorPayout on an order.
 */
export async function syncVendorPayoutFromProvider(
  orderId: string,
  client: MomoOpenApiClient = getMomoOpenApiClient(),
): Promise<VendorPayoutAttemptResult> {
  const store = getStore();
  const latest = await store.getLatestVendorPayoutForOrder(orderId);
  if (!latest) {
    return {
      ok: false,
      code: "NO_PAYOUT",
      message: "No Vendor payout attempt for this order",
    };
  }
  if (latest.status !== "PENDING") {
    return { ok: true, payout: latest, started: false };
  }

  try {
    const remote = await client.getTransferStatus(latest.referenceId);
    const normalized = remote.status?.toString().trim().toUpperCase();
    if (normalized === "SUCCESSFUL" || normalized === "SUCCESS") {
      const applied = await store.applyVendorPayoutResult(
        latest.referenceId,
        "SUCCESS",
      );
      if (!applied.ok || !applied.payout) {
        return {
          ok: false,
          code: applied.ok ? "APPLY_FAILED" : applied.code,
          message: "Failed to apply Transfer SUCCESS",
          payout: applied.payout,
        };
      }
      return { ok: true, payout: applied.payout, started: false };
    }
    if (
      normalized === "FAILED" ||
      normalized === "REJECTED" ||
      normalized === "TIMEOUT"
    ) {
      const reason =
        typeof remote.reason === "string" ? remote.reason : normalized;
      const applied = await store.applyVendorPayoutResult(
        latest.referenceId,
        "FAILED",
        reason,
      );
      if (!applied.ok || !applied.payout) {
        return {
          ok: false,
          code: applied.ok ? "APPLY_FAILED" : applied.code,
          message: "Failed to apply Transfer FAILED",
          payout: applied.payout,
        };
      }
      return {
        ok: false,
        code: "TRANSFER_FAILED",
        message: reason ?? "Transfer failed",
        payout: applied.payout,
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MoMo Transfer status failed";
    return {
      ok: false,
      code: "STATUS_ERROR",
      message,
      payout: latest,
    };
  }

  return { ok: true, payout: latest, started: false };
}

/**
 * Ops retry: sync PENDING first; if FAILED/missing, start a new Transfer attempt.
 * Never starts a second Transfer while one is PENDING or SUCCESS.
 */
export async function retryVendorPayoutForOrder(
  orderId: string,
  client: MomoOpenApiClient = getMomoOpenApiClient(),
): Promise<VendorPayoutAttemptResult> {
  const store = getStore();
  const latest = await store.getLatestVendorPayoutForOrder(orderId);

  if (latest?.status === "PENDING") {
    const synced = await syncVendorPayoutFromProvider(orderId, client);
    if (synced.ok && synced.payout.status === "PENDING") {
      return {
        ok: false,
        code: "PAYOUT_IN_FLIGHT",
        message: "Transfer still pending at MoMo — wait or sync again",
        payout: synced.payout,
      };
    }
    if (synced.ok && synced.payout.status === "SUCCESS") {
      return synced;
    }
    // FAILED after sync → fall through to new attempt
  }

  if (latest?.status === "SUCCESS") {
    return { ok: true, payout: latest, started: false };
  }

  return initiateVendorPayoutForOrder(orderId, client);
}
