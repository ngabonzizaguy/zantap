# ADR-0022: Self-serve onboarding and per-vendor owner token

Date: 2026-07-01
Status: Accepted (supersedes ADR-0009 for the write-guard; extends ADR-0020)

## Context

Candidate #15 shipped a 3-step `/onboard` wizard gated by a shared `PROVISION_SECRET`
(an operator hands it to a vendor), and guarded live-vendor writes with a shared
`VENDOR_WRITE_SECRET` (ADR-0009). Both are single, deployment-wide secrets — they gate
"is this the public vs. staff," but give **no per-vendor isolation**: any holder of the
secret can mutate any vendor's menu/media.

The redesigned onboarding (design-assets mockups) is explicitly a "live in under one
minute" self-serve flow with no gate screen. The owner wants zero signup friction and
zero manual secret entry for vendors setting up their own store, while real auth
(candidate #12) remains deferred.

Two things are in tension: friction-free self-serve, and not leaving live vendors'
data open to anonymous mutation.

## Decision

1. **Onboarding is gate-free.** Remove the visible provision-secret gate step;
   `/onboard` opens on the splash. `PROVISION_SECRET` is retained only as an *optional
   server-side kill-switch* (env-toggled, off by default) plus basic rate-limiting on
   `provisionVendor`, to blunt abuse until real auth lands.
2. **Retire the shared `VENDOR_WRITE_SECRET`; introduce a per-vendor owner token.**
   At provision, the server mints a random capability token bound to the new vendor
   (store a hash on `Vendor`; return the plaintext once). The browser caches it
   (localStorage, keyed by slug); it is **never typed** by the vendor. Guarded write
   actions accept the token, and the server validates it *against that specific vendor*.
3. This is strictly better isolation than the shared secret (vendor B cannot edit
   vendor A) at equal-or-lower friction (auto-issued, no prompt). It is **not** real
   auth — it is a capability token with no identity or revocation UX yet.
   Real auth (#12) subsumes it later.
4. **Non-halting phone-based recovery (never locked out).** If a vendor loses their
   local token (cleared storage / new device), a "Recover access" form takes the
   storefront URL (slug) + signup phone number; on match the server **immediately
   re-issues** the owner token. No OTP. Recovery never blocks the vendor. Each recovery
   emits a server-side **recovery event** so the future ZanTap admin panel (candidate #17)
   can run async verification (WhatsApp or a triggered KDS modal) without halting access.

## Consequences

- Vendors are never permanently locked out: the phone-based recovery re-issues the token
  from info they always know. Weak (phone is semi-secret / guessable) — explicitly a
  pre-launch stopgap, hardened by the admin panel + real auth.
- The token is a bearer capability — anyone it is copied to gains write access to that
  one vendor. Bounded blast radius (one vendor), unlike the shared secret's global reach.
- `provisionVendor` no longer requires a secret to succeed (unless the kill-switch is on),
  so it MUST be rate-limited to avoid vendor-spam. Recovery is likewise rate-limited.
- Migration: add `ownerTokenHash` to `Vendor`. **No production vendors exist** (only a
  personal test vendor), so there is no backfill and no client migration — the migration
  simply resets/re-seeds the test vendor with a fresh token.
- Recovery events are persisted (a lightweight log/seam) purely so the future admin panel
  has a hook; no admin UI is built in this epic.
- `"use server"` modules still export only async functions (known-issue 0002 lesson).
- Update `CONTEXT.md`: retire the **Write-secret** term, add **Owner token** and
  **Recovery event**.

## Alternatives considered

- **Drop all write guards entirely** — simplest, literal "no friction," but any slug
  becomes publicly mutable. Rejected: needless data-integrity risk for live vendors.
- **Keep the shared write-secret** — minimal change, but keeps typed friction and gives
  no per-vendor isolation; contradicts the self-serve goal.
- **Do real auth now** — correct end state but large scope; deferred to #12 by AGENTS.md.
