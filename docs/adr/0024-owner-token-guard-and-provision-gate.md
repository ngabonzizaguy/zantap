# ADR-0024: Owner-token guard swap, provisioning kill-switch, and rate limiting

Date: 2026-07-01
Status: Accepted (implements ADR-0022 for the server surface — candidate #16, Issue 2)

## Context

ADR-0022 decided the *policy*: gate-free self-serve provisioning, a per-vendor
owner token replacing the shared `VENDOR_WRITE_SECRET`, and non-halting
phone-based recovery. Issue 1 built the data layer (owner-token helper, Store
verbs, recovery-event log). Issue 2 builds the Server Action surface on top and
must lock down a few implementation choices ADR-0022 left open.

## Decision

1. **Owner-token guard is slug-bound and lives outside `"use server"`.**
   `lib/vendor/owner-token-guard.ts` exports `assertOwnerToken(vendorSlug, token)`
   + `OwnerTokenError`. It reads the server-only hash via
   `Store.getVendorOwnerTokenHash(slug)` and compares with the timing-safe
   `verifyOwnerToken`. Every guarded action (`vendor-menu` CRUD + media,
   `updateVendorProfile`, the export route) calls it, so write access is scoped
   to *that* vendor — the per-vendor isolation the shared secret never had. The
   guard is a plain module (not `"use server"`), so it can export a class
   without tripping known-issue 0002. `lib/vendor/write-secret.ts` and
   `components/vendor/WriteSecretPrompt.tsx` are deleted.

2. **The provisioning kill-switch is a dedicated env, not `PROVISION_SECRET`.**
   `provisionVendor` drops its required secret argument (gate-free). The optional
   kill-switch is `PROVISION_KILL_SWITCH` (`lib/vendor/provision-gate.ts`,
   truthy = closed, off by default), **not** an overload of `PROVISION_SECRET`.
   Reason: `PROVISION_SECRET` still carries its candidate-#15 meaning ("show the
   `/onboard` wizard") for the not-yet-migrated onboard page (Issue 3), and it is
   already set in prod. Reusing it as an off-switch would invert that meaning and
   could silently close signup. A distinct var keeps both semantics unambiguous
   and lets `/onboard` keep working through the migration. (Documented deviation
   from ADR-0022's "keep PROVISION_SECRET as the kill-switch" wording; same
   intent — an env-toggled, off-by-default brake on `provisionVendor`.)

3. **Rate limiting is best-effort and in-process.** `lib/vendor/rate-limit.ts`
   is a fixed-window counter (`enforceRateLimit(key, limit, windowMs)` +
   `RateLimitError`). `provisionVendor` caps 10/60s (global key); `recoverOwnerToken`
   caps 5/60s per slug. State lives in module memory, so it is per-instance and a
   serverless fleet does not share buckets — intentionally lightweight; durable
   distributed limiting is deferred with real auth (#12).

4. **Recovery returns a generic miss.** `recoverOwnerToken(slug, phone)` returns
   `{ ok: false }` for both an unknown slug and a wrong phone (no enumeration),
   and on a match re-issues the token (`setVendorOwnerToken`), records a recovery
   event, and returns the plaintext once. No OTP; never halting.

5. **Client hook renamed and never prompts.** `useWriteSecret` → `useOwnerToken(slug)`
   (`lib/vendor/useOwnerToken.ts`) — localStorage keyed by slug, plus a plain
   `cacheOwnerToken(slug, token)` used by the provision success path. The old
   auto-popping secret modal is gone; when a token is absent the KDS points the
   vendor at the Setup guide (recovery UI proper lands in Issue 3).

## Consequences

- Guarded writes now cost one extra Store read (`getVendorOwnerTokenHash`) per
  call — negligible, and it goes through the same seam (no new data path).
- An unknown vendor slug on the export route now returns `403` (token invalid)
  rather than `404`; acceptable and avoids leaking vendor existence.
- **Prod cutover (Issue 3/4):** to keep signup open, leave `PROVISION_KILL_SWITCH`
  unset; the `/onboard` page gate on `PROVISION_SECRET` is removed when the wizard
  is migrated. `VENDOR_WRITE_SECRET` can be removed from Vercel once no code reads
  it (already true after this issue).
- Interim: an already-live vendor on a fresh device has no in-app way to obtain a
  token until the Issue 3 recovery UI ships; the Setup drawer keeps a manual
  paste field as a bridge (non-modal, so consistent with "never prompt").
- `"use server"` modules (`vendor-provision`, `vendor-menu`, `vendor-profile`)
  still export only async functions (known-issue 0002 respected).

## Alternatives considered

- **Overload `PROVISION_SECRET` as the kill-switch** (ADR-0022 wording) — rejected
  for the semantic-inversion / prod-safety reasons in decision 2.
- **Durable rate limiting (Redis/Upstash)** — correct end state but out of scope;
  deferred with auth (#12).
- **Keep the write-secret prompt modal for token entry** — contradicts the
  "never typed / never prompt" decision; replaced by cache + Setup bridge.
