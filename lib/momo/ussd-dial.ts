import { canonicalizePhone, normalizePhone, phonesMatchForRecovery } from "@/lib/format";
import type { PayoutMethod, Vendor } from "@/lib/types";

const RWANDA_DIAL = "250";
const LOCAL_MOBILE_PATTERN = /^07[2389]\d{7}$/;
const MERCHANT_CODE_PATTERN = /^\d{6}$/;

export function manualPaymentRef(orderId: string): string {
  return `manual-${orderId}`;
}

export function orderPhoneMatches(stored: string, entered: string): boolean {
  return phonesMatchForRecovery(stored, entered);
}

/** Rwanda E.164 digits (`250…`) → local `07[2389]…` (handles double-zero national). */
function rwandaE164DigitsToLocal(e164Digits: string): string | null {
  if (!e164Digits.startsWith(RWANDA_DIAL)) return null;

  let national = e164Digits.slice(RWANDA_DIAL.length);
  if (national.startsWith("0")) {
    national = national.slice(1);
  }
  if (national.length !== 9) return null;

  const local = `0${national}`;
  return LOCAL_MOBILE_PATTERN.test(local) ? local : null;
}

/** Strip vendor payout phone to local `078…` form for USSD dial strings. */
export function toLocalMomoPhone(raw: string): string | null {
  const digits = normalizePhone(raw);
  if (!digits) return null;

  if (LOCAL_MOBILE_PATTERN.test(digits)) {
    return digits;
  }

  const fromE164 = rwandaE164DigitsToLocal(digits);
  if (fromE164) return fromE164;

  const canonical = canonicalizePhone(raw, RWANDA_DIAL);
  if (canonical.startsWith(RWANDA_DIAL)) {
    return rwandaE164DigitsToLocal(canonical);
  }

  return null;
}

/** Persist `momoCode` as local `07[2389]…` when payout is to a phone (ADR-0034). */
export function normalizeMomoPayoutPhoneForStorage(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return toLocalMomoPhone(trimmed);
}

export function normalizeMerchantCode(raw: string): string | null {
  const code = raw.trim();
  return MERCHANT_CODE_PATTERN.test(code) ? code : null;
}

export type VendorPayoutFailureReason =
  | "MISSING_MOMO_CODE"
  | "INVALID_PHONE"
  | "INVALID_MERCHANT_CODE";

export type VendorPayoutValidation =
  | { ok: true; payoutMethod: PayoutMethod; dialTarget: string }
  | { ok: false; reason: VendorPayoutFailureReason };

export function validateVendorPayout(
  vendor: Pick<Vendor, "payoutMethod" | "momoCode">
): VendorPayoutValidation {
  const momoCode = vendor.momoCode?.trim() ?? "";
  if (!momoCode) {
    return { ok: false, reason: "MISSING_MOMO_CODE" };
  }

  if (vendor.payoutMethod === "PHONE") {
    const localPhone = toLocalMomoPhone(momoCode);
    if (!localPhone) {
      return { ok: false, reason: "INVALID_PHONE" };
    }
    return { ok: true, payoutMethod: "PHONE", dialTarget: localPhone };
  }

  const merchantCode = normalizeMerchantCode(momoCode);
  if (!merchantCode) {
    return { ok: false, reason: "INVALID_MERCHANT_CODE" };
  }
  return { ok: true, payoutMethod: "MERCHANT_CODE", dialTarget: merchantCode };
}

export type UssdDialBuildResult =
  | { ok: true; ussd: string }
  | { ok: false; reason: VendorPayoutFailureReason };

export function buildMomoUssdDial(
  vendor: Pick<Vendor, "payoutMethod" | "momoCode">,
  amountRwf: number
): UssdDialBuildResult {
  const payout = validateVendorPayout(vendor);
  if (!payout.ok) {
    return { ok: false, reason: payout.reason };
  }

  const amount = Math.trunc(amountRwf);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, reason: "MISSING_MOMO_CODE" };
  }

  const ussd =
    payout.payoutMethod === "PHONE"
      ? `*182*1*1*${payout.dialTarget}*${amount}#`
      : `*182*8*1*${payout.dialTarget}*${amount}#`;

  return { ok: true, ussd };
}

/** `tel:` href for USSD strings (`#` → `%23`). */
export function ussdTelHref(ussd: string): string {
  return `tel:${encodeURIComponent(ussd)}`;
}

export function vendorPayoutBlockedMessage(vendorName: string): string {
  return `${vendorName} can't accept MoMo payments right now. Try again later or contact the restaurant.`;
}
