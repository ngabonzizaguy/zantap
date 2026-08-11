import { getStore } from "@/lib/store";
import type {
  CreateLeadRoutingRecipientInput,
  Lead,
  LeadRoutingRecipient,
  LeadStatus,
  UpdateLeadRoutingRecipientInput,
} from "@/lib/leads/types";
import { auditOperatorAction } from "@/lib/operator-control/audit";
import { canTransitionLeadStatus } from "@/lib/leads/status";

export interface OperatorLeadFilters {
  search?: string;
  status?: LeadStatus;
}

export async function listOperatorLeads(
  filters?: OperatorLeadFilters
): Promise<Lead[]> {
  let leads = await getStore().listLeads();
  if (filters?.status) {
    leads = leads.filter((lead) => lead.status === filters.status);
  }
  if (filters?.search) {
    const query = filters.search.trim().toLowerCase();
    leads = leads.filter((lead) =>
      [
        lead.businessName,
        lead.businessType,
        lead.contactName,
        lead.phone,
        lead.area,
      ].some((value) => value.toLowerCase().includes(query))
    );
  }
  return leads;
}

export async function updateOperatorLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<Lead | null> {
  const store = getStore();
  const current = (await store.listLeads()).find((lead) => lead.id === leadId);
  if (!current) return null;
  if (!canTransitionLeadStatus(current.status, status)) {
    throw new Error(
      `Lead cannot move from ${current.status} to ${status}`
    );
  }

  const lead = await store.updateLeadStatus(leadId, status);
  if (!lead) return null;

  await auditOperatorAction({
    action: "LEAD_STATUS_UPDATE",
    detail: { leadId, status },
  });
  return lead;
}

export async function listOperatorLeadRoutingRecipients(): Promise<
  LeadRoutingRecipient[]
> {
  return getStore().listLeadRoutingRecipients();
}

export async function createOperatorLeadRoutingRecipient(
  input: CreateLeadRoutingRecipientInput
): Promise<LeadRoutingRecipient> {
  const recipient = await getStore().createLeadRoutingRecipient(input);
  await auditOperatorAction({
    action: "LEAD_ROUTING_RECIPIENT_CREATE",
    detail: {
      recipientId: recipient.id,
      enabled: recipient.enabled,
      phoneSuffix: recipient.phone.slice(-4),
    },
  });
  return recipient;
}

export async function updateOperatorLeadRoutingRecipient(
  recipientId: string,
  input: UpdateLeadRoutingRecipientInput
): Promise<LeadRoutingRecipient | null> {
  const recipient = await getStore().updateLeadRoutingRecipient(
    recipientId,
    input
  );
  if (!recipient) return null;
  await auditOperatorAction({
    action: "LEAD_ROUTING_RECIPIENT_UPDATE",
    detail: {
      recipientId: recipient.id,
      enabled: recipient.enabled,
      phoneSuffix: recipient.phone.slice(-4),
    },
  });
  return recipient;
}

export async function removeOperatorLeadRoutingRecipient(
  recipientId: string
): Promise<boolean> {
  const current = (await getStore().listLeadRoutingRecipients()).find(
    (recipient) => recipient.id === recipientId
  );
  if (!current) return false;
  const removed = await getStore().removeLeadRoutingRecipient(recipientId);
  if (!removed) return false;
  await auditOperatorAction({
    action: "LEAD_ROUTING_RECIPIENT_REMOVE",
    detail: {
      recipientId,
      phoneSuffix: current.phone.slice(-4),
    },
  });
  return true;
}
