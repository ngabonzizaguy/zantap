# ADR-0070: First-create photo staging and forgiving size-price drafts

Status: Accepted
Date: 2026-08-25

## Context

The menu-item create flow accepted only one photo even though the edit gallery
already supports six. Vendors therefore had to save, reopen the item, and add
the rest of the gallery. The size editor also allowed a price draft to become
empty and then surfaced a form-level positive-price error, which felt like a
failure for an easily recoverable input state.

Local photo serving exposed two supporting mismatches: Next can evaluate the
upload Server Action and serving route in different module graphs, and its
default Server Action body limit was smaller than the existing 5 MB image
validation limit.

## Decision

- Create mode stages, validates, previews, orders, and removes up to the
  existing six-photo domain limit before the menu item is saved.
- The item is created first because photo records require its ID. Staged files
  are then uploaded sequentially in visible order, making the first successful
  upload the primary image and avoiding concurrent gallery-count races.
- Invalid types and oversized files are rejected during selection with local
  feedback. The existing edit gallery and onboarding single-photo flow remain
  unchanged.
- Empty or zero size-price drafts normalize to the minimum valid amount,
  `1 RWF`, on blur and again while producing the submit payload. Server-side
  validation continues to require a positive whole-number persisted price.
- The development-only local blob registry lives on `globalThis` so the Server
  Action and route module graphs share uploaded bytes within the same process.
- Next Server Actions accept 6 MB bodies, leaving multipart overhead above the
  product's existing 5 MB per-image limit.
- Add-ons remain an approval-only UI proposal. This decision does not add an
  add-ons domain model or persistence behavior.

## Alternatives considered

- Upload one photo and require edit mode for the rest: rejected because it
  creates needless rework during first-time menu setup.
- Upload all files concurrently: rejected because independently evaluated
  gallery-limit checks can race and primary-image order becomes less clear.
- Permit empty prices in persisted data: rejected because checkout needs a
  concrete positive RWF amount. Recovering the client draft to `1` preserves
  that invariant without a discouraging global error.
- Lower the documented image limit to Next's default body size: rejected
  because the product already promises and validates images up to 5 MB.

## Consequences

- A create can succeed before a later photo upload fails; successfully uploaded
  photos and the item remain saved, while the existing guarded-action feedback
  reports the failure.
- Six uploads are intentionally sequential and may take a few seconds on a
  slow connection, but their order and primary-photo behavior are deterministic.
- The local blob registry is process-local and resets with the development
  server, matching the in-memory Store's development-only lifecycle.
- Any future add-ons implementation requires its own approved domain and order
  snapshot decision through the Store seam.
