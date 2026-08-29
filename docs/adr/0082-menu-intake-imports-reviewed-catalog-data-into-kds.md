# Menu intake imports reviewed catalog data into KDS

A Menu intake begins on a separate, openly shareable Vendor-facing page rather
than inside the Marketing Lead Form. The Vendor chooses `Build my menu` to enter
repeatable structured dishes or `Help me create it` to provide source menu pages,
dish images, prices, notes and questions for ZanTap/Ops assistance. Structured
items mirror KDS Add Item's customer-facing catalog fields: name, category,
description, price or size pricing, up to six images and optional add-ons.
Availability, Dish count, supply Stock, low-stock rules and cost remain KDS-only.

Both paths produce a staged Menu intake, not live MenuItem records. Ops reviews
and edits the intake, answers its questions and selects the destination Vendor.
Final approval is an import command: it creates or deliberately updates the
reviewed catalog data in that Vendor's real KDS menu through the existing Store
and guarded menu-media seams. It must not require manual re-entry after approval,
and it must record the source intake and per-item import result for audit. Nothing
submitted by the public browser publishes directly to a Storefront. Existing-menu
matching and post-submission resume/edit access are separate pending decisions.

Before import, Ops previews new items separately from possible matches. Exact
normalized names and close name/category matches are warnings, not automatic
identity. Each possible match requires `Skip`, `Add as new`, or `Update existing`,
defaulting to `Skip`. An update changes only catalog fields selected in the
preview and preserves KDS-owned availability, Dish count, supply links and cost.
The import is idempotent and records created, updated and skipped results per item.

The intake asks whether the business is already on ZanTap. A supplied Storefront
link or slug is only an Ops matching hint, never proof of ownership. Public
submission does not provision a Vendor. Before import, Ops must either select one
existing Vendor or deliberately complete `Create Vendor and import`; the latter
uses the existing owner-access/recovery model and cannot mark the intake imported
after a partial failure.

No implementation begins until the owner visually approves a generated UI/UX
image covering the Vendor intake and Ops review/import relationship. A clickable
prototype is explicitly not required.

Generated UI/UX and eventual implementation preserve ZanTap's surface-specific
identity: Marketing and public intake use the cinematic dark editorial language;
Storefront remains black and food-first; Ops remains a light editorial console;
KDS remains dark and operational. Do not force one surface's palette onto all
others. The owner approved the first self-build flow image; the assisted-flow
image was then approved without revision. These two static generated images
satisfy the design-first gate; implementation must translate their hierarchy
using the real design system rather than shipping the raster compositions.

Questions are private to the intake. Both Vendor paths encourage inquiry; Ops
authors replies and delivers them through a prefilled WhatsApp handoff, recording
answer, Operator, timestamp and follow-up state. A logged call/manual-contact
fallback is allowed. Questions and answers are never published, and this
candidate adds no email-delivery infrastructure.

Drafts autosave locally before submission. Submission creates an immutable
revision and the same browser retains an invisible, non-guessable resume
credential. Cross-device access requires Ops contact confirmation and a one-time
WhatsApp resume link; phone plus public reference alone is insufficient. Changes
before import create new revisions, import locks editing, and post-import changes
are reviewed amendments rather than direct KDS mutations. Resume access expires
after 30 inactive days or immediately on Ops revocation.

Self-build dish media uses KDS parity: JPEG, PNG or WebP, at most six images per
dish and 5 MB per image. Assisted source accepts JPEG, PNG, WebP and PDF, at most
30 files, 5 MB per image, 15 MB per PDF and 75 MB total. Sources remain private;
terminal sources are deleted after 90 days unless retained for an active dispute.
Approved live images are copied through the guarded Vendor media seam rather than
publishing private source URLs. Uploads expose progress, retry, removal and clear
limit errors.

The public Menu intake UI supports English, Kinyarwanda, French and Swahili. It
inherits a supported referring/browser locale, falls back to English, keeps a
visible selector and records the choice for Ops context. Vendor-authored names,
descriptions, notes, source material and questions remain exactly as submitted;
translation is an explicit Ops edit, never an automatic claim. Ops-console
localization is not expanded by this candidate.

After submission, the authorized browser shows simple Vendor-facing status:
Sent, Being reviewed, We need more information, Ready to add, Added to your KDS,
or Closed. A reference number alone never permits lookup. Ops prepares and logs
WhatsApp notifications only when more information is required, the menu is
imported, or the intake is closed; no new messaging API or email service is added.
Imported messages may include Storefront and KDS links but never an owner token.

This supersedes ADR-0080's Lead-attached request and Operator-published
collaboration-page model.

## Implementation status — 2026-08-29

Implemented and verified locally on `codex/candidate-29`. The durable model is
`MenuIntake` plus immutable revisions, scoped access grants, private
attachments, questions/contact logs, and one idempotent import run. The Store
remains the sole persistence seam in both adapters. Public sources stay private;
an approved dish image is read privately and copied into the existing guarded
public `MenuImage` seam during the import transaction. No migration or deploy
has been applied outside the local worktree.

## Amendment — compact, replaceable intake editing — 2026-08-29

The owner approved a generated UI/UX refinement as the exact public-intake
target. Pending self-build images must be visible as small thumbnails and
assisted sources as image previews or PDF file cards; every selected file has an
individual remove action, and later selections append within the existing limits
so one mistaken file can be replaced without resetting the intake.

Self-build dish editors use a one-open-at-a-time accordion. Collapsed rows retain
the dish identity, category and price, and the list paginates at five dishes per
page. Adding a dish navigates to and opens its page. These are presentation-only
decisions behind the existing staged-intake seam: upload policy, immutable
revision behavior and import semantics do not change. The public header also
provides an explicit `Visit zantap.app` route back to ZanTap's main site.
