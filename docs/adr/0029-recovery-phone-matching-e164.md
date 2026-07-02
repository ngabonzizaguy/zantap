# ADR-0029: Access recovery phone matching (E.164 canonicalization)

Date: 2026-07-02
Status: Accepted (candidate #19, Issue 01 — D4)

## Context

`recoverOwnerToken(slug, phone)` matches the storefront slug plus the vendor's
**signup/business phone** (`Vendor.phoneNumber`) before re-issuing an owner token
(ADR-0022). The comparison used `normalizePhone`, which only strips non-digits.

Vendors who signed up with an international number (e.g. `+250 784 928 786`) are
stored as `250784928786`. On recovery they often type the local form
(`0784928786`). The raw digit strings differ → false "couldn't match" even though
it is the same person.

The payout/MoMo destination (`momoCode`) must **not** widen the match surface —
recovery is tied to the business phone only.

## Decision

1. Add `canonicalizePhone(raw, defaultDialCode?)` and `phonesMatchForRecovery(stored,
   entered)` in `lib/format.ts`. Both sides are canonicalized to **E.164 digits**
   (no `+`) before comparison.

2. **Dial-code inference:** use known codes from `COUNTRY_OPTIONS` (longest prefix
   first). If either stored or entered digits already carry a recognized country
   prefix, use that code for both sides. Otherwise default to Rwanda `250` (launch
   market).

3. **Local trunk:** numbers starting with `0` and at least 9 digits are treated as
   local and prefixed with the resolved dial code (e.g. `0788123456` →
   `250788123456`).

4. **Scope:** apply only in `recoverOwnerToken`. Do **not** change `normalizePhone`
   callers (checkout, provision persistence, validation) in this pass.

5. **Unchanged:** generic `{ ok: false }` on miss (no enumeration), rate limit
   (5/60s per slug), recovery event logging, non-halting re-issue policy.

## Consequences

- Recovery succeeds across local (`07…`), national (`2507…`), and intl (`+2507…`)
  formats regardless of which form was persisted at signup.
- `normalizePhone` behaviour elsewhere is unchanged; future work (D2 payout phone
  full country code) remains separate.
- Multi-country onboarding is supported via the shared `COUNTRY_OPTIONS` dial list;
  numbers without a detectable prefix assume Rwanda `250`.
