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
  /** Attribution, e.g. "marketing-root". */
  source?: string;
}

export type SubmitLeadResult = { ok: true } | { ok: false; error: string };
