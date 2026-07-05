# ADR-0037: KDS Setup — business, payments, slug edit

Date: 2026-07-05
Status: Accepted
Builds on: ADR-0022 (owner token), ADR-0034 (MoMo phone normalization), ADR-0036 (candidate #21)

## Context

Candidate #21 locked editable vendor slug (with collision check) and MoMo payout
normalization on write (21-01). The onboarding wizard already collects business
essentials and payment preference, but post-launch vendors had no KDS surface to
change name, slug, phone, category, or payout target without re-running `/onboard`.

## Decision

1. **Store** — `UpdateVendorInput` gains optional `slug`. `updateVendor` renames
   when the new normalized slug differs from the current row and passes
   `isSlugAvailable`; otherwise throws `Slug already taken` (Prisma unique
   constraint is a backstop).

2. **Action** — `updateVendorProfile` (owner-token guarded) accepts business
   fields (`name`, `slug`, `phoneNumber`, `businessCategory`) and payment fields
   (`payoutMethod`, `momoCode`) with the same validation as provision:
   slug format + collision, phone digit length, MoMo PHONE → local `07…` storage
   (ADR-0034), MERCHANT_CODE → six digits.

3. **Setup drawer UI** — Two new sections above storefront profile:
   - **Business settings** — name, debounced slug availability (current slug =
     available without a round-trip), dial-code phone, category picker, Save business.
   - **Payment settings** — MERCHANT_CODE vs PHONE cards (mirrors onboarding),
     optional “same as business” for PHONE payout, Save payments.

4. **Slug rename side effects** — On successful rename:
   - `transferOwnerTokenCache(oldSlug, newSlug)` before navigation.
   - `router.replace(`/vendor/${newSlug}?tab=setup`)` so SSE/actions use the new slug.
   - Preview link + QR use draft slug while editing.

5. **Out of scope** — Batch slug redirects for old storefront URLs, admin audit
   log for slug changes, recovery-phone change UX (recovery still matches stored
   `phoneNumber` after edit).

## Consequences

- Vendors can fix typos in storefront URL or switch payout method without support.
- Old `/[old-slug]` and `/vendor/[old-slug]` links 404 after rename (expected until
  a redirect table exists).
- KDS Orders tab reflects saved business name/phone without full page reload when
  only those fields change.
