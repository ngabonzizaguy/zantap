import { getStore } from "@/lib/store";
import type {
  BulkCreateProspectsInput,
  CreateProspectInput,
  CreateProspectInteractionInput,
  Prospect,
  ProspectInteraction,
  ProspectStatus,
  UpdateProspectInput,
} from "@/lib/prospects/types";
import { canTransitionProspectStatus } from "@/lib/prospects/status";
import { auditOperatorAction } from "@/lib/operator-control/audit";

export interface OperatorProspectFilters {
  search?: string;
  status?: ProspectStatus;
}

export async function listOperatorProspects(
  filters?: OperatorProspectFilters
): Promise<Prospect[]> {
  let prospects = await getStore().listProspects(filters?.status);
  if (filters?.search) {
    const query = filters.search.trim().toLowerCase();
    prospects = prospects.filter((p: Prospect) =>
      [p.businessName, p.contactName, p.phone, p.area, p.source].some(
        (value) => value?.toLowerCase().includes(query)
      )
    );
  }
  return prospects;
}

export async function createOperatorProspect(
  input: CreateProspectInput
): Promise<Prospect> {
  const prospect = await getStore().createProspect(input);
  await auditOperatorAction({
    action: "PROSPECT_CREATE",
    detail: { prospectId: prospect.id, businessName: prospect.businessName },
  });
  return prospect;
}

export async function bulkCreateOperatorProspects(
  input: BulkCreateProspectsInput
): Promise<Prospect[]> {
  const prospects = await getStore().bulkCreateProspects(input);
  await auditOperatorAction({
    action: "PROSPECT_BULK_CREATE",
    detail: { count: prospects.length },
  });
  return prospects;
}

export async function updateOperatorProspect(
  prospectId: string,
  input: UpdateProspectInput
): Promise<Prospect | null> {
  if (input.status) {
    const current = await getStore().getProspect(prospectId);
    if (!current) return null;
    if (!canTransitionProspectStatus(current.status, input.status)) {
      throw new Error(
        `Prospect cannot move from ${current.status} to ${input.status}`
      );
    }
  }
  const prospect = await getStore().updateProspect(prospectId, input);
  if (!prospect) return null;
  await auditOperatorAction({
    action: "PROSPECT_UPDATE",
    detail: { prospectId, fields: Object.keys(input) },
  });
  return prospect;
}

export async function addOperatorProspectInteraction(
  prospectId: string,
  input: CreateProspectInteractionInput
): Promise<ProspectInteraction | null> {
  const interaction = await getStore().addProspectInteraction(
    prospectId,
    input
  );
  if (!interaction) return null;
  await auditOperatorAction({
    action: "PROSPECT_INTERACTION",
    detail: { prospectId, channel: input.channel },
  });
  return interaction;
}

export async function convertOperatorProspect(
  prospectId: string,
  vendorId: string,
  leadId?: string
): Promise<Prospect | null> {
  const prospect = await getStore().convertProspect(
    prospectId,
    vendorId,
    leadId
  );
  if (!prospect) return null;
  await auditOperatorAction({
    action: "PROSPECT_CONVERT",
    detail: { prospectId, vendorId, leadId },
  });
  return prospect;
}
