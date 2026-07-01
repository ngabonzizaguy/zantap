# Issue 2 — Server actions + owner-token guard swap

Status: done (2026-07-01)

## Parent

PRD: `.scratch/onboarding-redesign/PRD.md` · ADR: `docs/adr/0022`

## Scope (one session)

The server surface on top of Issue 1's data layer. **No wizard UI yet** (Issue 3).

## What to build

- [x] **`provisionVendor`** (`lib/actions/vendor-provision.ts`): dropped the required
  `PROVISION_SECRET` argument → gate-free. Kill-switch is a dedicated env
  `PROVISION_KILL_SWITCH` (off by default) — **not** an overload of
  `PROVISION_SECRET` (see ADR-0024 decision 2). Basic rate-limiting (10/60s).
  Accepts `businessCategory` + `payoutMethod`. **Mints the owner token**
  (`mintOwnerToken`), persists the hash via `createVendor`, **returns the
  plaintext token once** (`{ vendor, menuItem, ownerToken }`).
- [x] **`recoverOwnerToken(slug, phoneNumber)`** (new action): matches slug + signup
  phone; on match **immediately re-issues** the token (`setVendorOwnerToken`) and
  **records a recovery event** (`recordRecoveryEvent`). Non-halting, no OTP,
  rate-limited (5/60s per slug), generic `{ ok: false }` miss (no enumeration).
- [x] **Owner-token guard swap**: `lib/vendor/owner-token-guard.ts`
  (`assertOwnerToken(slug, token)` + `OwnerTokenError`) replaces `assertWriteSecret`
  across `vendor-menu`, media upload, `updateVendorProfile`, and the export route
  (header `x-vendor-owner-token`). `lib/vendor/write-secret.ts` deleted.
- [x] Client hook `useWriteSecret` → `useOwnerToken` (cache by slug in localStorage,
  never prompts) + plain `cacheOwnerToken(slug, token)` for the provision path.
  `WriteSecretPrompt` deleted; KDS points to Setup when a token is absent.
- [x] `checkSlugAvailable` unchanged; left for Issue 3 wiring.

## Files touched

`lib/actions/vendor-provision.ts`, `lib/actions/vendor-profile.ts`,
`lib/actions/vendor-menu.ts`, media-upload action, export action,
`lib/vendor/write-secret.ts` (delete), owner-token guard helper (new),
`lib/vendor/provision-validation.ts`, client `useOwnerToken` hook, rate-limit helper.

**Remember:** `"use server"` files export ONLY async functions (AGENTS.md known-issue 0002).

## Blocked by

Issue 1.

## Unblocks

Issue 3.

## Comments

Shipped 2026-07-01. `npm run build` clean; `npm test` **174 passed / 64 skipped**
(the 2 skipped files are the opt-in remote `#prisma` suite — parity proven via the
shared in-memory contract, per AGENTS.md). Decisions this session (ADR-0024):

- **Kill-switch = dedicated `PROVISION_KILL_SWITCH`**, not `PROVISION_SECRET`.
  `PROVISION_SECRET` still gates the *not-yet-migrated* `/onboard` page
  (`isProvisionEnabled`), so overloading it would invert that meaning and risk
  closing prod signup. Same intent as ADR-0022 (env-toggled, off-by-default brake),
  cleaner wiring. Deviation documented in ADR-0024.
- **Wizard UI left to Issue 3** — only two compile-necessary edits to `OnboardWizard`:
  the new gate-free `provisionVendor` signature + `cacheOwnerToken(slug, token)` on
  success (so a new vendor can edit immediately, never typing the token). The `/onboard`
  page gate + splash/step redesign stay for Issue 3. One stale `SuccessStep` copy line
  ("enter your write secret") corrected to reflect auto-unlock.
- **Interim gap:** an already-live vendor on a fresh device can't obtain a token
  in-app until Issue 3's recovery UI; the Setup drawer keeps a non-modal owner-token
  paste field as the bridge. `useOwnerToken` itself never prompts.
- Files: new `lib/vendor/{owner-token-guard,rate-limit,provision-gate,useOwnerToken}.ts`;
  rewrote `lib/actions/{vendor-provision,vendor-menu,vendor-profile}.ts` + export route;
  updated `MenuSection`/`MenuItemModal`/`MenuImageGallery`/`SetupDrawer`/`HistoryPanel`/
  `OnboardWizard`; deleted `write-secret.ts`(+test), `provision-secret.ts`(+test),
  `useWriteSecret.ts`, `WriteSecretPrompt.tsx`; rewrote the provision test; updated
  `.env.example` + the gated `scripts/prod-onboard-acceptance.test.ts`.
