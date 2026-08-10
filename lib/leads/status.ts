import type { LeadStatus } from "@/lib/leads/types";

const LEAD_STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  NEW: ["CONTACTED", "CLOSED"],
  CONTACTED: ["ONBOARDED", "CLOSED"],
  ONBOARDED: [],
  CLOSED: [],
};

export function nextLeadStatuses(status: LeadStatus): LeadStatus[] {
  return [...LEAD_STATUS_TRANSITIONS[status]];
}

export function canTransitionLeadStatus(
  from: LeadStatus,
  to: LeadStatus
): boolean {
  return LEAD_STATUS_TRANSITIONS[from].includes(to);
}
