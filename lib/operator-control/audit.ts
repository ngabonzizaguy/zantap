import { getStore } from "@/lib/store";

export async function auditOperatorAction(input: {
  vendorId?: string;
  action: string;
  detail?: Record<string, unknown>;
  operatorId?: string;
}): Promise<void> {
  await getStore().recordOperatorAction({
    vendorId: input.vendorId,
    action: input.action,
    detail: input.detail ? JSON.stringify(input.detail) : undefined,
    operatorId: input.operatorId,
  });
}
