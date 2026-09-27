import "server-only";
import { getStore } from "@/lib/store";
import {
  initiateVendorPayoutForOrder,
} from "@/lib/momo/open-api-collection";
import type { ProviderPaymentResult } from "@/lib/types";

/**
 * MoMo async callback body (Collection requesttopay / Disbursement transfer).
 * Shape mirrors GET …/requesttopay/{referenceId} — referenceId is often absent
 * from the body, so we also accept externalId and optional headers.
 */
export type MomoWebhookPayload = {
  financialTransactionId?: string;
  externalId?: string;
  amount?: string;
  currency?: string;
  status?: string;
  reason?: string;
  referenceId?: string;
  payer?: { partyIdType?: string; partyId?: string };
  payee?: { partyIdType?: string; partyId?: string };
};

export type HandleMomoWebhookResult = {
  handled: boolean;
  outcome:
    | "ignored"
    | "pending"
    | "collection_success"
    | "collection_failed"
    | "transfer_success"
    | "transfer_failed"
    | "not_found"
    | "error";
  message: string;
  payout?: { ok: boolean; detail: string };
};

function mapProviderResult(
  status: string | undefined,
): ProviderPaymentResult | "PENDING" | null {
  if (!status) return null;
  const normalized = status.trim().toUpperCase();
  if (normalized === "SUCCESSFUL" || normalized === "SUCCESS") {
    return "SUCCESS";
  }
  if (
    normalized === "FAILED" ||
    normalized === "REJECTED" ||
    normalized === "TIMEOUT"
  ) {
    return "FAILED";
  }
  if (normalized === "PENDING") {
    return "PENDING";
  }
  return null;
}

async function resolveCollectionRef(
  payload: MomoWebhookPayload,
  headerReferenceId?: string | null,
): Promise<string | null> {
  const store = getStore();
  const candidates = [
    headerReferenceId?.trim(),
    payload.referenceId?.trim(),
  ].filter(Boolean) as string[];

  for (const ref of candidates) {
    const payment = await store.getPaymentByRef(ref);
    if (payment) return payment.transactionRef;
  }

  return null;
}

async function resolveTransferRef(
  payload: MomoWebhookPayload,
  headerReferenceId?: string | null,
): Promise<string | null> {
  const store = getStore();
  const candidates = [
    headerReferenceId?.trim(),
    payload.referenceId?.trim(),
  ].filter(Boolean) as string[];

  for (const ref of candidates) {
    const payout = await store.getVendorPayoutByRef(ref);
    if (payout) return payout.referenceId;
  }

  const externalId = payload.externalId?.trim();
  if (externalId) {
    const latest = await store.getLatestVendorPayoutForOrder(externalId);
    if (latest?.status === "PENDING") return latest.referenceId;
  }

  return null;
}

/**
 * Apply a MoMo Collection or Transfer callback.
 * Collection SUCCESS starts best-effort Vendor Transfer (Order stays PAID on payout fail).
 */
export async function handleMomoWebhook(
  payload: MomoWebhookPayload,
  options?: { referenceIdHeader?: string | null },
): Promise<HandleMomoWebhookResult> {
  const mapped = mapProviderResult(payload.status);
  if (mapped === null) {
    return {
      handled: false,
      outcome: "ignored",
      message: `Unrecognized MoMo status: ${payload.status ?? "(missing)"}`,
    };
  }
  if (mapped === "PENDING") {
    return {
      handled: true,
      outcome: "pending",
      message: "MoMo status still PENDING — no Store change",
    };
  }

  const collectionRef = await resolveCollectionRef(
    payload,
    options?.referenceIdHeader,
  );
  if (collectionRef) {
    const applied = await getStore().applyProviderPaymentResult(
      collectionRef,
      mapped,
    );
    if (!applied.ok) {
      return {
        handled: true,
        outcome: "error",
        message: `applyProviderPaymentResult failed: ${applied.code}`,
      };
    }

    if (mapped === "FAILED") {
      return {
        handled: true,
        outcome: "collection_failed",
        message: `Collection FAILED for order ${applied.order.id}`,
      };
    }

    const payout = await initiateVendorPayoutForOrder(applied.order.id);
    return {
      handled: true,
      outcome: "collection_success",
      message: `Collection SUCCESS for order ${applied.order.id}`,
      payout: {
        ok: payout.ok,
        detail: payout.ok
          ? `Transfer ${payout.started ? "started" : "existing"} ref=${payout.payout.referenceId}`
          : payout.message,
      },
    };
  }

  const transferRef = await resolveTransferRef(
    payload,
    options?.referenceIdHeader,
  );
  if (transferRef) {
    const reason =
      typeof payload.reason === "string" ? payload.reason : undefined;
    const applied = await getStore().applyVendorPayoutResult(
      transferRef,
      mapped,
      mapped === "FAILED" ? reason : undefined,
    );
    if (!applied.ok) {
      return {
        handled: true,
        outcome: "error",
        message: `applyVendorPayoutResult failed: ${applied.code}`,
      };
    }
    return {
      handled: true,
      outcome: mapped === "SUCCESS" ? "transfer_success" : "transfer_failed",
      message: `Transfer ${mapped} for payout ${transferRef}`,
      payout: {
        ok: mapped === "SUCCESS",
        detail: `ref=${transferRef} status=${applied.payout.status}`,
      },
    };
  }

  // Fallback: Collection by externalId (orderId) when header/body ref missing.
  const externalId = payload.externalId?.trim();
  if (externalId) {
    const payment = await getStore().getPaymentForOrder(externalId);
    if (payment) {
      const applied = await getStore().applyProviderPaymentResult(
        payment.transactionRef,
        mapped,
      );
      if (!applied.ok) {
        return {
          handled: true,
          outcome: "error",
          message: `applyProviderPaymentResult failed: ${applied.code}`,
        };
      }
      if (mapped === "FAILED") {
        return {
          handled: true,
          outcome: "collection_failed",
          message: `Collection FAILED for order ${applied.order.id}`,
        };
      }
      const payout = await initiateVendorPayoutForOrder(applied.order.id);
      return {
        handled: true,
        outcome: "collection_success",
        message: `Collection SUCCESS for order ${applied.order.id}`,
        payout: {
          ok: payout.ok,
          detail: payout.ok
            ? `Transfer ${payout.started ? "started" : "existing"} ref=${payout.payout.referenceId}`
            : payout.message,
        },
      };
    }
  }

  return {
    handled: false,
    outcome: "not_found",
    message:
      "No Collection Payment or VendorPayout matched referenceId/externalId",
  };
}
