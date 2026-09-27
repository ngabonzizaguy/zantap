/**
 * MTN MoMo payerMessage / payeeNote constraints:
 * - max 160 characters
 * - only `/^[ 0-9a-zA-Z\-_]+$/` (spaces, alphanumerics, hyphen, underscore)
 * - no `#`, punctuation, or other special characters
 */
const MOMO_NOTE_ALLOWED = /[^ 0-9a-zA-Z\-_]/g;
const MOMO_NOTE_MAX = 160;

export function sanitizeMomoNote(input: string, fallback = "ZanTap"): string {
  const cleaned = input.replace(MOMO_NOTE_ALLOWED, " ").replace(/\s+/g, " ").trim();
  const base = cleaned.length > 0 ? cleaned : fallback;
  return base.slice(0, MOMO_NOTE_MAX);
}

export function isValidMomoNote(input: string): boolean {
  return (
    input.length > 0 &&
    input.length <= MOMO_NOTE_MAX &&
    /^[ 0-9a-zA-Z\-_]+$/.test(input)
  );
}
