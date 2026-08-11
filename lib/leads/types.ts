/**
 * Lead-capture interface shared by the marketing form (Issue 03) and the
 * durable Store-backed `submitLead` server action (Issue 04). The form is
 * built against this shape; Issue 04 swaps the interim WhatsApp transport
 * for the server action without touching the UI.
 */

export interface SubmitLeadInput {
  businessName: string;
  businessType: string;
  contactName: string;
  /** Raw phone as typed; canonicalized server-side (E.164, Rwanda-first). */
  phone: string;
  area: string;
  message?: string;
  /** Attribution, e.g. "marketing-root". */
  source?: string;
  /** Visually hidden bot trap. Real users leave this empty. */
  website?: string;
}

export type SubmitLeadErrorCode =
  | "INVALID_INPUT"
  | "INVALID_PHONE"
  | "RATE_LIMITED"
  | "SUBMISSION_FAILED";

export type SubmitLeadResult =
  | { ok: true; whatsappUrl?: string }
  | { ok: false; error: SubmitLeadErrorCode };

export type LeadStatus = "NEW" | "CONTACTED" | "ONBOARDED" | "CLOSED";

export interface LeadRoutingRecipient {
  id: string;
  name: string;
  /** Canonical E.164 digits without a leading plus. */
  phone: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadRoutingAssignment {
  id: string;
  leadId: string;
  recipientId: string;
  recipientName: string;
  /** Snapshot of the canonical number used when the Lead was assigned. */
  recipientPhone: string;
  assignedAt: Date;
}

export interface CreateLeadRoutingRecipientInput {
  name: string;
  /** Raw operator input; the Store canonicalizes and validates it. */
  phone: string;
  enabled: boolean;
}

export interface UpdateLeadRoutingRecipientInput {
  name?: string;
  /** Raw operator input; the Store canonicalizes and validates it. */
  phone?: string;
  enabled?: boolean;
}

export interface Lead {
  id: string;
  businessName: string;
  businessType: string;
  contactName: string;
  /** Canonical E.164 digits without a leading plus. */
  phone: string;
  area: string;
  message?: string;
  status: LeadStatus;
  source?: string;
  consentAt: Date;
  createdAt: Date;
  routingAssignment?: LeadRoutingAssignment;
}

export interface CreateLeadInput {
  businessName: string;
  businessType: string;
  contactName: string;
  phone: string;
  area: string;
  message?: string;
  source?: string;
  consentAt: Date;
}
