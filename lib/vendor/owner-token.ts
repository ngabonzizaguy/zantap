import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Per-vendor owner token (ADR-0022). Minted at provision, cached in the vendor's
 * browser, never typed. Only the sha256 hash is persisted on the Vendor; the
 * plaintext is returned exactly once. This is a bearer capability token bound to
 * one vendor — strictly better isolation than the retired shared write-secret,
 * but NOT real auth (candidate #12). Node crypto only; server-side use.
 */

const TOKEN_BYTES = 24;

/** Hash a plaintext owner token for storage/comparison (hex sha256). */
export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Mint a fresh random owner token and its storage hash. */
export function mintOwnerToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, hash: hashOwnerToken(token) };
}

/**
 * Timing-safe check that `token` hashes to `hash`. Returns false for any missing
 * value or length mismatch rather than throwing.
 */
export function verifyOwnerToken(
  token: string | null | undefined,
  hash: string | null | undefined
): boolean {
  if (!token || !hash) return false;

  const candidate = Buffer.from(hashOwnerToken(token), "utf8");
  const expected = Buffer.from(hash, "utf8");
  if (candidate.length !== expected.length) return false;

  return timingSafeEqual(candidate, expected);
}
