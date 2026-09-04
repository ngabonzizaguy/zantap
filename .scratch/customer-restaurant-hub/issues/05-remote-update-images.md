# Issue 05 — Resilient remote customer-update images

Status: done · implemented, verified and owner-tested green 2026-09-04 · not released

## Parent

`.scratch/customer-restaurant-hub/PRD.md`

## Scope

Fix the `/restaurants` runtime crash when an active public Vendor update contains
an absolute HTTPS branding or dish-image URL whose hostname is not configured in
Next's image optimizer. Keep this separate from Candidate #29 Stage 2 and every
deployment or production-data action.

## Acceptance criteria

- [x] Reproduce the exact `next/image` unconfigured-host crash with a saved
      Vendor and an active update containing an absolute Vercel Blob URL.
- [x] Render same-origin paths and arbitrary approved public HTTPS image URLs
      without coupling the customer update feed to a hostname allow-list.
- [x] Reject unsupported image URL schemes and preserve a useful fallback.
- [x] Replace failed logo and update media with stable, accessible fallbacks.
- [x] Add regression coverage for URL policy, render safety, and failure state.
- [x] Verify the original browser repro, focused/full tests, TypeScript, scoped
      ESLint, production build, and mobile/desktop rendering.
- [x] Do not deploy, migrate, push, begin Stage 2 or Question 11, perform an Ops
      import, or change the Marketing Lead Form.

## Completion note

The pre-fix headed browser flow saved Inka Steakhouse with an active profile
update containing an unconfigured absolute Vercel Blob URL, saved the Vendor on
the storefront, then reproduced the exact `/restaurants` error boundary and
`next-image-unconfigured-host` exception. A red focused regression also proved
that the old render rewrote the source through `/_next/image`.

`PublicCustomerImage` now accepts same-origin paths and arbitrary credential-free
public HTTPS URLs without the optimizer. Unsupported sources and load failures
fall back to Vendor initials or an accessible fixed-ratio unavailable panel.
The update ring, viewer and saved card share the behavior. Re-running the same
browser fixture rendered the tray and viewer without a loader exception; the
deliberately absent object emitted only its expected 404 and all three fallbacks
were visible. Mobile 390×844 and desktop 1440×1000 had no horizontal overflow.
Evidence is in `output/playwright/customer-update-remote-images/`.

Verification: focused 12/12; full 480 passed / 117 skipped; TypeScript; scoped
ESLint; production build; `git diff --check`. No deploy, migration, push, Stage
2, Question 11, Ops import or Marketing Lead Form work occurred.

Owner test feedback was green on 2026-09-04. The fix remains local and the
release boundary is unchanged.
