import { getStore } from "@/lib/store";
import {
  retryVendorPayoutForOrder,
  syncVendorPayoutFromProvider,
  type VendorPayoutAttemptResult,
} from "@/lib/momo/open-api-collection";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export type OperatorPayoutAction = "retry" | "sync";

export async function operatorVendorPayoutAction(
  orderId: string,
  action: OperatorPayoutAction,
): Promise<VendorPayoutAttemptResult | null> {
  const store = getStore();
  const order = await store.getOrder(orderId);
  if (!order) return null;

  const result =
    action === "sync"
      ? await syncVendorPayoutFromProvider(orderId)
      : await retryVendorPayoutForOrder(orderId);

  await auditOperatorAction({
    vendorId: order.vendorId,
    action: action === "sync" ? "VENDOR_PAYOUT_SYNC" : "VENDOR_PAYOUT_RETRY",
    detail: {
      orderId,
      ok: result.ok,
      code: result.ok ? undefined : result.code,
      referenceId: result.payout?.referenceId ?? null,
      status: result.payout?.status ?? null,
    },
  });

  return result;
}
