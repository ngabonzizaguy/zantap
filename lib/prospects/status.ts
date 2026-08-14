import type { ProspectStatus } from "@/lib/prospects/types";

const PROSPECT_STATUS_TRANSITIONS: Record<ProspectStatus, ProspectStatus[]> = {
  FOUND: ["CONTACTED", "DECLINED", "UNREACHABLE"],
  CONTACTED: ["IN_TALKS", "DECLINED", "UNREACHABLE"],
  IN_TALKS: ["CONVERTED", "DECLINED", "UNREACHABLE"],
  CONVERTED: [],
  DECLINED: [],
  UNREACHABLE: ["FOUND", "CONTACTED"],
};

export function nextProspectStatuses(status: ProspectStatus): ProspectStatus[] {
  return [...PROSPECT_STATUS_TRANSITIONS[status]];
}

export function canTransitionProspectStatus(
  from: ProspectStatus,
  to: ProspectStatus
): boolean {
  if (from === to) return true;
  return PROSPECT_STATUS_TRANSITIONS[from].includes(to);
}

export const PROSPECT_STATUS_LABELS: Record<ProspectStatus, string> = {
  FOUND: "Found",
  CONTACTED: "Contacted",
  IN_TALKS: "In talks",
  CONVERTED: "Converted",
  DECLINED: "Declined",
  UNREACHABLE: "Unreachable",
};

export const PROSPECT_CHANNEL_LABELS: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  PHONE: "Phone",
  INSTAGRAM: "Instagram",
  GOOGLE_MAPS: "Google Maps",
  EMAIL: "Email",
  IN_PERSON: "In person",
  OTHER: "Other",
};
