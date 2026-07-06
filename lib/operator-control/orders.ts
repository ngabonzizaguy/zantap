import { getStore } from "@/lib/store";
import type { OperatorOrderPatch, Order } from "@/lib/types";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export async function patchOperatorOrder(
  orderId: string,
  patch: OperatorOrderPatch
): Promise<Order | null> {
  const store = getStore();
  const existing = await store.getOrder(orderId);
  if (!existing) return null;

  const updated = await store.operatorUpdateOrder(orderId, patch);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: existing.vendorId,
    action: "ORDER_OVERRIDE",
    detail: { orderId, patch },
  });
  return updated;
}
