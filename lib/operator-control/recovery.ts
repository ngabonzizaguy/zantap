import { getStore } from "@/lib/store";
import type { RecoveryEventFilters, VendorRecoveryEvent } from "@/lib/types";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export async function listOperatorRecoveryEvents(
  filters?: RecoveryEventFilters
): Promise<VendorRecoveryEvent[]> {
  return getStore().listAllRecoveryEvents(filters);
}

export async function reviewOperatorRecoveryEvent(
  eventId: string,
  reviewNote?: string
): Promise<VendorRecoveryEvent | null> {
  const updated = await getStore().reviewRecoveryEvent(eventId, reviewNote);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: updated.vendorId,
    action: "RECOVERY_REVIEW",
    detail: { eventId, reviewNote: reviewNote ?? null },
  });
  return updated;
}
