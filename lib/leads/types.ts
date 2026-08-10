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

export interface LeadRoutingSettings {
  whatsappEnabled: boolean;
  /** Canonical E.164 digits without a leading plus. */
  whatsappPhone?: string;
  updatedAt?: Date;
}

export interface UpdateLeadRoutingSettingsInput {
  whatsappEnabled: boolean;
  /** Raw operator input; the Store canonicalizes and validates it. */
  whatsappPhone?: string;
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
