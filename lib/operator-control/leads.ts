import { getStore } from "@/lib/store";
import type {
  Lead,
  LeadRoutingSettings,
  LeadStatus,
  UpdateLeadRoutingSettingsInput,
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

export async function getOperatorLeadRoutingSettings(): Promise<LeadRoutingSettings> {
  return getStore().getLeadRoutingSettings();
}

export async function updateOperatorLeadRoutingSettings(
  input: UpdateLeadRoutingSettingsInput
): Promise<LeadRoutingSettings> {
  const settings = await getStore().updateLeadRoutingSettings(input);
  await auditOperatorAction({
    action: "LEAD_ROUTING_UPDATE",
    detail: {
      whatsappEnabled: settings.whatsappEnabled,
      phoneSuffix: settings.whatsappPhone?.slice(-4) ?? null,
    },
  });
  return settings;
}
