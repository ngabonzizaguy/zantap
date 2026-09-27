import type { PayoutMethod } from "@/lib/types";

/** MoMo Transfer payee shape (MSISDN or PARTY_CODE). Client-safe. */
export type MomoPayee = {
  partyIdType: "MSISDN" | "PARTY_CODE";
  partyId: string;
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Map Vendor payoutMethod + momoCode to a MoMo Transfer payee.
 * Returns null when the destination is missing or invalid (block checkout).
 */
export function vendorPayeeFromPayout(opts: {
  payoutMethod: PayoutMethod;
  momoCode: string;
}): MomoPayee | null {
  const raw = opts.momoCode.trim();
  if (!raw) return null;

  if (opts.payoutMethod === "PHONE") {
    const msisdn = digitsOnly(raw);
    if (msisdn.length < 9) return null;
    return { partyIdType: "MSISDN", partyId: msisdn };
  }

  const code = raw.replace(/\s+/g, "");
  if (!/^[0-9A-Za-z]+$/.test(code)) return null;
  return { partyIdType: "PARTY_CODE", partyId: code };
}
