# ADR-0083: KDS first-run education is a replayable readiness guide

Date: 2026-09-02

Status: Accepted · Stage 1 actionability amendment implemented locally; owner review pending; Stage 2 held

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

## Stage 1 implementation — 2026-09-02

Stage 1 defines readiness from existing live seams: storefront completeness is
logo, cover, description, location, and phone; menu readiness is at least one
available non-archived item; payment readiness uses the existing payout
validator; kitchen readiness uses the live open/closed state. Completion is not
stored locally—the checklist always re-derives it.

Only education preference is stored, under a versioned Vendor-slug key on the
current device. `guided` and `self` choices suppress later automatic offers;
Close increments a capped dismissal count; manual Help replay bypasses that
automatic-offer decision. The automatic offer waits for owner-access validation
and never competes with recovery, Setup, Help, or coachmarks.

The shared Modal primitive gained an optional accessible label for custom
headerless compositions. The old order-guide viewer and its three screenshot
assets were removed. No migration, production configuration, or product data
path was introduced. Stage 2 row destinations, `Show me`, highlighting, warning
flow, and return chip remain intentionally absent pending owner review.

## Owner-review amendment — 2026-09-02

The static Stage 1 checklist is not an acceptable standalone release gate. A
highlighted incomplete row without a clear tap affordance, plain next-action
copy, or direct destination tells the Vendor that something is wrong but not
how to fix it. This is especially harmful for Vendors with limited English or
technical experience.

Stage 1 must therefore include the minimum actionable loop for its recommended
incomplete row: unmistakable button semantics, short action-led copy, an
explanation of what is missing, a direct route to the exact live KDS control,
and a visible return path to readiness. The broader four-row contextual
screenshot catalogue remains Stage 2 and stays unstarted until this corrected
Stage 1 receives owner approval.

### Pending visual proposal

The owner requested a visual of the live-control handoff before implementation.
The pending preview is
`C:\Users\G\.codex\generated_images\01a060b7-f1d7-7fd2-a867-e3b9d6a768f1\exec-8c9b9a80-cb04-40e5-bec0-65362f3ceaff.png`.
It proposes no nested setup form: the guide opens the existing Setup drawer,
and the tappable `Start here` badge invokes the same real control as its
highlighted group. Completion continues to derive only from successfully saved
live data. The owner accepted this visual and interaction direction as the exact
future implementation target, while explicitly deferring implementation
authorization to another session. Product code remains held.

## Actionability amendment implementation — 2026-09-02

The owner later authorized the accepted preview exactly. Stage 1 now gives the
recommended incomplete row button semantics, short missing-state copy,
`Show me where`, and a direct route to the existing live KDS control. It stores
only the active readiness row ID; target, remaining count, completion, and the
next granular storefront field continue to derive from saved live Vendor/menu/
payment/kitchen state.

The existing Setup drawer is the storefront/payment adapter. Guided mode
scrolls and highlights the exact control group, exposes a tappable and
keyboard-operable `Start here`, and keeps `Back to readiness` visible. Existing
branding uploads persist immediately; existing profile/business/payment save
actions remain authoritative for text. Menu and Kitchen use their existing live
controls plus the same compact return path. A completed live row removes the
highlight and changes the action to `Done — continue guide`, which returns to
the refreshed checklist without replaying the welcome screen.

This is the minimum Stage 1 actionability loop, not Stage 2: no contextual
screenshot view, warning flow, completed-row review catalogue, or broader guide
set was added. No schema, migration, production configuration, deployment, push,
Ops import, Marketing Lead Form, or Question 11 change occurred.
