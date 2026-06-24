# ADR-0016: Migrate delivery slip page to DESIGN.md tokens

Date: 2026-06-24
Status: Accepted

## Context

ADR-0015 migrated the KDS Orders tab and shell off the legacy `zk-*` palette.
`app/slip/[orderId]/page.tsx` remained the last vendor-adjacent surface using
`zk-*` (charcoal canvas, orange-adjacent mono slip on `#100b07`).

The standalone slip page is linked from dispatch workflows and must match the
editorial system used in `DispatchModal`'s slip preview (ADR-0015).

## Decision

Migrate `app/slip/[orderId]/page.tsx` to `DESIGN.md` tokens:

- Light `bg-canvas` page shell with `font-body text-ink`.
- Header: caption-uppercase label (`text-muted`), `font-display` order id,
  body-sm meta line for total and status.
- Slip body: monospace `<pre>` on `bg-canvas-soft`, `border-hairline`,
  `rounded-brand-lg`, `text-body-sm text-ink` — same classes as
  `DispatchModal` slip preview.
- Footer helper copy on `text-muted` body-sm.
- No new `zk-*` / `zt-*` classes on this route.

## Consequences

- All vendor-adjacent UI is on the ElevenLabs editorial system; `zk-*` has zero
  references in the codebase and can be removed from `tailwind.config.ts` in a
  follow-up cleanup slice.
- Customer storefront (`zt-*`) remains deferred until new designs arrive.
