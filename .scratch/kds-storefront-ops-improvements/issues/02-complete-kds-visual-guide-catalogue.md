# Stage 2 — Complete the KDS visual-guide catalogue and contextual entry

Status: ready-for-agent · start after Stage 1 owner review

## Parent

`.scratch/kds-storefront-ops-improvements/issue-00-discovery.md` — Questions 9
and 10.

## What to build

Extend the proven Stage 1 viewer with the remaining four high-risk task guides:

1. `Get ready for orders` — OPEN/CLOSED and what Customers experience.
2. `Add and update dishes` — customer-facing details, photos, price and Dish
   count.
3. `Track your Stock` — supplies, Received/Used/Wasted and low-stock state.
4. `See what customers see` — Menu updates, the collapsed live preview, Views,
   Menu visits and Storefront preview.

Each guide contains three to five authentic, annotated KDS screenshots and uses
the same approved accessible chrome and single-callout language as Stage 1.
Kitchen help owns the complete replayable catalogue. Relevant Setup rows and
small contextual coachmarks may open the matching guide, but the full viewer
never opens automatically.

Prompt eligibility comes from real Vendor state and completion/dismissal state.
A Vendor sees at most one eligible prompt at a time, selected deterministically;
several coachmarks must never stack on first load. A final `Show me` returns the
Vendor to the matching live tab/control without performing the action for them.
History, receipts, Profit and profile editing stay outside this first catalogue.

## Acceptance criteria

- [ ] Kitchen help lists and replays all five approved guides, including the
  Stage 1 order walkthrough, without adding a new top-level KDS tab.
- [ ] Each new guide has three to five authentic screenshots, one callout and
  one plain-English instruction per frame using the approved Stage 1 viewer.
- [ ] `Show me` routes to the correct live destination: kitchen availability,
  Menu/Add Item, Stock, or customer-update/Storefront preview.
- [ ] Relevant Setup rows can deliberately open their matching guide.
- [ ] Contextual prompts are derived from real Vendor state, show at most one at
  a time, and never auto-open a full guide.
- [ ] Completion/dismissal remains isolated per guide, Vendor and device, and
  every completed/dismissed guide remains manually replayable from Help.
- [ ] History, receipts, Profit and profile editing receive no new visual guide
  in this stage.
- [ ] Focused automated coverage proves guide definitions, eligibility order,
  single-prompt behavior, persistence isolation and every `Show me` target;
  headed mobile and desktop QA covers all four additions with no application
  console errors.

## Blocked by

- `.scratch/kds-storefront-ops-improvements/issues/01-kds-visual-guide-foundation.md`
