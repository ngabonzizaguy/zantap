import { COUNTRY_OPTIONS, DEFAULT_COUNTRY } from "@/lib/vendor/onboard-options";
import { ORDER_HISTORY_TIMEZONE } from "@/lib/orders/history-filters";

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-US")} RWF`;
}

/** Kigali-local order timestamp, e.g. `23 Jun 2026, 14:30` (History, exports, receipts). */
export function formatKigaliDateTime(
  date: Date,
  month: "short" | "long" = "short"
): string {
  return date.toLocaleString("en-GB", {
    timeZone: ORDER_HISTORY_TIMEZONE,
    day: "numeric",
    month,
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Dial codes (digits only), longest first — avoids +1 matching before +44, etc. */
const DIAL_CODES_DESC = [...COUNTRY_OPTIONS]
  .map((country) => normalizePhone(country.dialCode))
  .sort((a, b) => b.length - a.length);

const DEFAULT_DIAL_CODE = normalizePhone(DEFAULT_COUNTRY.dialCode);

function inferDialCodeDigits(digits: string): string | undefined {
  for (const code of DIAL_CODES_DESC) {
    if (!digits.startsWith(code)) continue;
    const national = digits.slice(code.length);
    if (national.length >= 7 && national.length <= 12) {
      return code;
    }
  }
  return undefined;
}

/** Split a stored phone into dial code (`+250`) and local digits for edit forms. */
export function splitPhoneForDisplay(
  stored: string,
  defaultDialCode: string = DEFAULT_COUNTRY.dialCode
): { dialCode: string; local: string } {
  const digits = normalizePhone(stored);
  const fallbackDial = defaultDialCode.startsWith("+")
    ? defaultDialCode
    : `+${normalizePhone(defaultDialCode)}`;

  if (!digits) {
    return { dialCode: fallbackDial, local: "" };
  }

  const dialDigits = inferDialCodeDigits(digits);
  if (dialDigits) {
    const national = digits.slice(dialDigits.length);
    const dialCode = `+${dialDigits}`;
    if (dialDigits === DEFAULT_DIAL_CODE && national.length === 9) {
      return { dialCode, local: `0${national}` };
    }
    return { dialCode, local: national };
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return { dialCode: fallbackDial, local: digits };
  }

  return { dialCode: fallbackDial, local: digits };
}

/**
 * Canonicalize a phone to E.164 digits (no leading +) for comparison. Handles
 * local (`07…`), national (`2507…`), and intl (`+2507…`) forms. Scoped to
 * recovery matching (ADR-0029) — does not replace `normalizePhone` elsewhere.
 */
export function canonicalizePhone(
  raw: string,
  defaultDialCode: string = DEFAULT_DIAL_CODE
): string {
  const digits = normalizePhone(raw);
  if (!digits) return "";

  const fallbackCode = normalizePhone(defaultDialCode) || DEFAULT_DIAL_CODE;

  const inferred = inferDialCodeDigits(digits);
  if (inferred) {
    const national = digits.slice(inferred.length);
    if (national.startsWith("0") && national.length > 1) {
      return inferred + national.slice(1);
    }
    return digits;
  }

  if (digits.startsWith("0") && digits.length >= 9) {
    return fallbackCode + digits.slice(1);
  }

  return digits;
}

/** Compare signup/business phones for owner-token recovery (ADR-0029). */
export function phonesMatchForRecovery(stored: string, entered: string): boolean {
  const storedDigits = normalizePhone(stored);
  const enteredDigits = normalizePhone(entered);
  if (!storedDigits || !enteredDigits) return false;

  const dialCode =
    inferDialCodeDigits(storedDigits) ??
    inferDialCodeDigits(enteredDigits) ??
    DEFAULT_DIAL_CODE;

  return (
    canonicalizePhone(stored, dialCode) === canonicalizePhone(entered, dialCode)
  );
}

export function orderDisplayId(id: string): string {
  const short = id.replace(/\D/g, "").slice(-4) || id.slice(-4);
  return `#${short.padStart(4, "0")}`;
}

export function minutesAgo(date: Date): number {
  return Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
}

export type PaidAgeUrgency = "normal" | "warning" | "critical";

/** Human-readable relative label anchored on `paidAt` (KDS queue aging). */
export function formatRelativeTime(
  paidAt: Date | undefined | null,
  now: Date = new Date()
): string {
  if (!paidAt) return "Just now";

  const diffMs = now.getTime() - paidAt.getTime();
  if (diffMs < 60_000) return "Just now";

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfPaidDay = new Date(paidAt);
  startOfPaidDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfPaidDay.getTime()) / 86_400_000
  );

  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Urgency tier from minutes since payment (<10 normal, 10–20 warning, 20+ critical). */
export function getPaidAgeUrgency(
  paidAt: Date | undefined | null,
  now: Date = new Date()
): PaidAgeUrgency {
  if (!paidAt) return "normal";
  const minutes = Math.floor((now.getTime() - paidAt.getTime()) / 60_000);
  if (minutes < 10) return "normal";
  if (minutes < 20) return "warning";
  return "critical";
}

export function formatKitchenStageLabel(
  stage: string | undefined | null
): string {
  if (!stage) return "NEW";
  return stage.replace(/_/g, " ");
}
