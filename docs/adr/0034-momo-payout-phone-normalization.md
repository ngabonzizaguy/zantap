# MoMo payout phone normalization (read + write)

Status: accepted · candidate #21 issue 21-01

## Context

Vendors who choose **Pay to my MoMo number** during onboarding store the payout
target in `Vendor.momoCode`. Onboarding sends international form (`+250 788…`);
some rows also contain a double-zero national segment (`+250078…` / `250078…`).
Manual USSD checkout (`buildMomoUssdDial`) must always dial local
`*182*1*1*07[2389]XXXXXXX*…#` — never embed `+250`, bare `250…`, or `250078…`.

## Decision

1. **Read-time fix** — harden `toLocalMomoPhone` to collapse Rwanda E.164 with an
   erroneous leading `0` on the national part (13-digit `250078…` → local `078…`).
2. **Normalize-on-write** — when `payoutMethod = PHONE`, persist `momoCode` as
   local `07[2389]XXXXXXX` only via `normalizeMomoPayoutPhoneForStorage` at
   `provisionVendor` and `updateVendorProfile`.
3. **No batch migration** — existing malformed rows are repaired at USSD read time;
   DB converges when vendors next save profile (issue 21-04 UI) or re-provision.

Merchant-code payout (`MERCHANT_CODE`) is unchanged on provision (trim only);
`updateVendorProfile` validates exactly six digits when `momoCode` is supplied.

## Consequences

- New PHONE vendors always store dial-ready local numbers.
- Prod vendors with legacy `+250078…` momoCode can pay immediately without a script.
- Recovery matching (`phoneNumber`) stays on `normalizePhone` / ADR-0029 — payout
  phone in `momoCode` is independent.
