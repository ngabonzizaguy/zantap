import { canonicalizePhone } from "@/lib/format";
import type {
  CreateLeadRoutingRecipientInput,
  LeadRoutingRecipient,
} from "@/lib/leads/types";

export function normalizeLeadRoutingRecipient(
  input: CreateLeadRoutingRecipientInput
): Pick<LeadRoutingRecipient, "name" | "phone" | "enabled"> {
  const name = input.name.trim();
  const phone = canonicalizePhone(input.phone.trim());

  if (!name || name.length > 80) {
    throw new Error("Enter a recipient name");
  }
  if (!/^\d{8,15}$/.test(phone)) {
    throw new Error("Enter a valid WhatsApp number with country code");
  }

  return { name, phone, enabled: input.enabled };
}
