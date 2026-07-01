/**
 * Best-effort in-process rate limiting for the gate-free public actions
 * (provisioning + owner-token recovery, ADR-0022). Removing the provision
 * secret drops the only public abuse barrier before real auth, so these
 * fixed-window counters blunt rapid-fire spam.
 *
 * Caveat: state lives in module memory, so it is per-instance — a serverless
 * fleet does not share buckets. This is intentionally lightweight (no Redis /
 * durable store); real distributed limiting is deferred with auth (#12).
 */

export class RateLimitError extends Error {
  readonly code = "RATE_LIMITED";
  constructor(message = "Too many attempts. Please wait a moment and try again.") {
    super(message);
    this.name = "RateLimitError";
  }
}

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/**
 * Increment the counter for `key`; throw {@link RateLimitError} once more than
 * `limit` hits occur inside a `windowMs` window. The window resets lazily on the
 * first hit after it expires.
 */
export function enforceRateLimit(
  key: string,
  limit: number,
  windowMs: number
): void {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new RateLimitError();
  }

  current.count += 1;
}

/** Test-only: clear all counters so cases start from a clean slate. */
export function __resetRateLimits(): void {
  windows.clear();
}
