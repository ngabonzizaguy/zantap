import { canonicalizePhone } from "@/lib/format";
import type {
  LeadRoutingSettings,
  UpdateLeadRoutingSettingsInput,
} from "@/lib/leads/types";

/** Validate operator input once before either Store adapter persists it. */
export function normalizeLeadRoutingSettings(
  input: UpdateLeadRoutingSettingsInput
): Omit<LeadRoutingSettings, "updatedAt"> {
  const rawPhone = input.whatsappPhone?.trim() ?? "";
  const whatsappPhone = rawPhone ? canonicalizePhone(rawPhone) : "";

  if (whatsappPhone && !/^\d{8,15}$/.test(whatsappPhone)) {
    throw new Error("Enter a valid WhatsApp number with country code");
  }
  if (input.whatsappEnabled && !whatsappPhone) {
    throw new Error("A WhatsApp number is required when lead routing is enabled");
  }

  return {
    whatsappEnabled: input.whatsappEnabled,
    whatsappPhone: whatsappPhone || undefined,
  };
}
