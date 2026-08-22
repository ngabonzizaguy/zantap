# ADR-0066 — Customer hub as a restaurant passport

Date: 2026-08-21
Status: Amended · original deployed 2026-08-22 · reference composition complete locally

## Context

Candidate #26 Issue 01 passed its functional local walkthrough, but the first
`/restaurants` presentation read as a generic settings list: explanatory hero,
always-visible search and plain white database-style cards. It did not feel
like the front door of an installed customer app or make returning to a saved
restaurant feel primary.

The hub is a private return surface, not discovery or a marketplace. Its design
must therefore foreground already-chosen restaurants without inventing browse,
ranking, recommendation or account affordances.

## Decision

Present the hub as a personal restaurant passport:

- an editorial `Good food, remembered.` thesis and saved count establish the
  page as a return surface;
- the most important content is a high-contrast restaurant destination card,
  with identity, place, recency and a direct `Open menu` action;
- removal remains available but visually secondary;
- search appears only when more than one restaurant makes it useful;
- empty and unavailable states explain the next valid action in plain language;
- desktop uses an asymmetric split while mobile stacks the same hierarchy;
- safe-area padding, 44px minimum controls, visible focus, reduced motion and
  no horizontal overflow remain non-negotiable PWA constraints.

The visual system stays within DESIGN.md: canvas, ink, white card, Instrument
Serif/Inter, pill actions and atmospheric mint/peach gradients. The single
deliberate visual risk is the dark, softly lit restaurant card; surrounding
surfaces remain restrained.

## Consequences

- The hub feels like an installed customer destination rather than an admin
  collection screen.
- No public discovery entry or bottom navigation is added; those would imply
  product capabilities excluded by the Candidate #26 PRD.
- Saved state, resolver behavior, manifest identity, install timing and device-
  local privacy semantics do not change.
- The resilient device repository stops waiting after a bounded IndexedDB
  non-response and uses its existing in-memory fallback, preventing a permanent
  loading skeleton in restricted browser contexts.
- Issue 01 remains functionally closed. The owner visually approved the
  redesign on 2026-08-21, clearing Issue 02 to proceed.
- This decision authorizes no migration, deployment, push or production smoke.

## Amendment — clearer update counts and KDS palette (2026-08-22)

The owner approved the functional production flow but asked the hub to use
fewer words, the recognizable ZanTap palette, and a small badge that states how
many changes occurred. The hub therefore reuses the established KDS operational
theme: charcoal grain canvas, deep cards, warm-white type and MoMo orange for
active signals and primary actions. Update volume appears as a compact numeric badge in
the section heading and on each affected Vendor ring; it counts unseen entries,
while saved-restaurant count remains separate. Labels are shortened without
changing device-local privacy, feed ordering, viewed state or analytics.

The amendment is locally verified but does not authorize push or deployment.

### Reference composition clarification (2026-08-22)

The owner selected a denser phone-first composition as the visual target: a
compact header, short editorial intro, single-row updates summary, and one
tightly grouped restaurant card whose date and primary action share the final
row. The implementation replaces the large saved-count medallion with a quiet
eyebrow count, presents each Vendor update as an informative row, and reduces
the destination card to a compact pass while keeping 44px interaction targets.
The reference hamburger is omitted because the hub has no navigation drawer;
the design must not imply an action that does not exist.

This remains a visual refinement only; saved-state, update-feed, analytics,
offline and Store boundaries do not change. Local 390px and 1440px production-
mode renders have no overflow or unexpected console errors. A new exact commit
and a separate owner release approval are required before push or deployment.
