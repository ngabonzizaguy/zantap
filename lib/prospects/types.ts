/**
 * Outbound Prospect tracker (ADR-0054) — separate from inbound Leads.
 */

export type ProspectStatus =
  | "FOUND"
  | "CONTACTED"
  | "IN_TALKS"
  | "CONVERTED"
  | "DECLINED"
  | "UNREACHABLE";

export type ProspectChannel =
  | "WHATSAPP"
  | "PHONE"
  | "INSTAGRAM"
  | "GOOGLE_MAPS"
  | "EMAIL"
  | "IN_PERSON"
  | "OTHER";

export interface ProspectInteraction {
  id: string;
  prospectId: string;
  at: Date;
  channel: ProspectChannel;
  note?: string;
}

export interface Prospect {
  id: string;
  businessName: string;
  contactName?: string;
  phone?: string;
  area?: string;
  source?: string;
  mapsUrl?: string;
  instagramHandle?: string;
  notes?: string;
  status: ProspectStatus;
  nextFollowUpAt?: Date;
  convertedVendorId?: string;
  convertedLeadId?: string;
  createdAt: Date;
  updatedAt: Date;
  interactions?: ProspectInteraction[];
}

export interface CreateProspectInput {
  businessName: string;
  contactName?: string;
  phone?: string;
  area?: string;
  source?: string;
  mapsUrl?: string;
  instagramHandle?: string;
  notes?: string;
  nextFollowUpAt?: Date;
}

export interface UpdateProspectInput {
  businessName?: string;
  contactName?: string | null;
  phone?: string | null;
  area?: string | null;
  source?: string | null;
  mapsUrl?: string | null;
  instagramHandle?: string | null;
  notes?: string | null;
  status?: ProspectStatus;
  nextFollowUpAt?: Date | null;
  convertedVendorId?: string | null;
  convertedLeadId?: string | null;
}

export interface CreateProspectInteractionInput {
  channel: ProspectChannel;
  note?: string;
  at?: Date;
}

export interface BulkCreateProspectsInput {
  rows: CreateProspectInput[];
}
