# PRD — Onboarding redesign (candidate #16)

Status: 📋 Grilled + PRD written 2026-07-01 · implementation not started.
Branch: `feat/onboarding-redesign`. Decisions: `./grill-decisions.md`. ADR: `docs/adr/0022`.
Supersedes the UI of candidate #15 (`.scratch/vendor-onboarding/`); reuses its Store/provisioning seam.

## Goal

Replace the current 3-step light `/onboard` wizard with the redesigned **dark, `.kds-dark`,
mobile-first, self-serve** onboarding from `design-assets/UI-screens/*` — "live in under a minute,"
gate-free, ending at a QR/share celebration and the Kitchen Dashboard.

## Non-goals (this epic)

- Real auth / login (candidate #12).
- Real MoMo payout routing (payout method is preference-only).
- Business hours, delivery zones, prep time, social links fields (follow-up epic).
- The "cap off for launch" feature set — parked until owner directs (see grill-decisions).
- The ZanTap operator/admin panel (candidate #17) — this epic only emits the recovery-event
  seam it will later consume; no admin UI or async WhatsApp/KDS-modal verification is built here.

## Flow (7 surfaces)

0. **Splash** — value prop + role wheel + Get Started.
1. **Business essentials** — name, storefront URL (live slug availability), phone (country picker),
   **business category** (dropdown).
2. **Payments** — radio: MoMo Merchant Code | Receive to Phone Number, with inline validation.
   Persists `payoutMethod`.
3. **Quick Menu** — first dish (name, price RWF, category, optional photo, live preview).
4. **Review & Confirm** — editable summary cards → **Go Live** (calls `provisionVendor`).
5. **You're Live** — confetti, storefront URL, **QR code**, Share/Copy, Open Kitchen Dashboard.
   If a first-dish photo was chosen, upload it here (post-provision, keyed to the new menu item).
6. **Optional checklist** — post-launch "0 of N"; wires into the existing KDS Setup drawer.

## Data model changes (Prisma migration)

Add to `Vendor`: `businessCategory String?`, `payoutMethod String @default("MERCHANT_CODE")`
(enum `MERCHANT_CODE` | `PHONE`), `logoUrl String?`, `coverImageUrl String?`, `description String?`,
`ownerTokenHash String?`. Add a lightweight **recovery-event** log (e.g. `VendorRecoveryEvent`:
id, vendorId, at, context) as the seam the future admin panel consumes. Mirror in `lib/types.ts`
(`Vendor`, `CreateVendorInput`, `UpdateVendorInput`) and BOTH Store adapters + contract tests.
**No backfill** — no production vendors exist; the migration resets/re-seeds the personal test
vendor with a fresh owner token.

## Server surface

- `provisionVendor` — drop required secret (optional kill-switch + rate limit); accept
  `businessCategory` + `payoutMethod`; **mint + return owner token** (plaintext once).
- `recoverOwnerToken(slug, phoneNumber)` — matches slug + signup phone, **immediately re-issues**
  the owner token (non-halting), and **records a recovery event**. Rate-limited. No OTP.
- `isSlugAvailable` — already exists on Store; wire to a debounced live check in step 1.
- Replace `assertWriteSecret` with owner-token validation bound to the vendor slug; update all
  guarded actions (`vendor-menu`, media upload, `updateVendorProfile`, export). Client hook
  `useWriteSecret` → `useOwnerToken` (cache by slug, no prompt).
- First-dish photo upload reuses the existing Blob upload path, called post-provision with the
  new owner token.

## Suggested issue slices (to be sliced next via /to-issues)

1. **Schema + Store + owner token** — migration (Vendor fields + recovery-event log), adapters,
   contract tests, mint/validate helpers, reset test vendor (no backfill).
2. **Server actions** — gate-free `provisionVendor` (+ category/payout/token + rate limit),
   `recoverOwnerToken` (non-halting, logs recovery event), owner-token guard swap across guarded
   actions, `isSlugAvailable` wiring.
3. **Wizard UI (dark)** — the 7-surface `.kds-dark` flow replacing `components/onboard/*`; live slug
   check, payout radio, quick-menu live preview, review/edit, QR + share celebration.
4. **Post-launch checklist** — checklist UI wired to the existing KDS Setup drawer; add core fields
   (logo, cover, description) to the profile editor.

## Acceptance (prod smoke, later)

Self-serve `/onboard` (no gate) → slug availability → payout choice → first dish (+ optional photo) →
Go Live → QR/storefront `200` → Open Kitchen Dashboard → owner token auto-cached, menu edit works
without typing a secret; a different browser (no token) is blocked from editing that vendor; then
**Recover access** (slug + signup phone) re-issues the token and editing resumes with no lockout, and
a recovery event is logged. MoMo sim PIN `12345` → PAID on KDS. `npm run build` + tests green before deploy.
