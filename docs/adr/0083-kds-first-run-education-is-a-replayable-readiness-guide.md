# ADR-0083: KDS first-run education is a replayable readiness guide

Date: 2026-09-02

Status: Accepted for implementation

## Context

The first local Visual guides tracer taught order progression through the KDS.
Owner review found that this is not the primary question for a new Vendor. The
more important first-run outcome is understanding whether the storefront, menu,
payment destination and kitchen are ready to receive an order.

The KDS already has a Setup drawer, coachmarks and Kitchen help. Automatically
stacking those surfaces makes the first visit obstructive, while offering no
durable path back makes a dismissed guide hard to rediscover.

## Decision

Use one first-run `Become ready to receive orders` modal with the exact approved
three-screen visual hierarchy. It offers `Guide me`, `I'll do it myself`, and a
close icon, then presents a live four-row checklist in this order: Storefront
details, Available menu, Payment setup, Kitchen status.

The modal auto-shows only for an incomplete Vendor/device with no prior choice.
`Guide me` and `I'll do it myself` both end automatic appearances immediately.
The close icon uses a two-dismissal grace rule: the first Close may offer the
modal once more on the next incomplete KDS visit; the second ends automatic
appearances. A fully ready Vendor never receives the automatic modal.

Kitchen help permanently exposes manual replay. The welcome modal explicitly
mentions this path, and the live-task flow uses a compact `Return to guide` chip
that never covers core controls. This first-run modal replaces automatic Setup
drawer/coachmark opening so education overlays never stack.

Each checklist row opens a short contextual state, then `Show me` closes the
modal and highlights the real control. The Vendor performs the action. The chip
reflects live completion and returns to the refreshed checklist. Kitchen opening
is warning-gated, not blocked, when Menu or Payment remains incomplete.

The approved generated image is a design reference only:
`C:\Users\G\.codex\generated_images\01a05eed-040b-77c3-96d8-7ca58625e0df\exec-eaf121ea-6bcb-4dea-b661-fea903b914a3.png`.
Shipping UI must use accessible product components and authentic product state.

## Consequences

- The local order-progression guide in `85e3091` is not release-ready and must
  be replaced/reframed before deployment.
- Readiness state and education preference remain local per Vendor/device;
  completion itself comes from live domain data.
- Help provides a clear return path without forcing the guide into normal KDS
  operation.
- The broader order/Stock/customer-update guide catalogue is deferred behind a
  later owner priority decision.
- No database migration or production write is implied by this decision.
