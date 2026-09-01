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

## Amendment — plain language, review control and optional WhatsApp handoff — 2026-08-30

The public intake uses short, direct English and restrained rise motion that is
disabled under reduced-motion preferences. The existing EN/RW/FR/SW selector is
hidden by default until the owner has reviewed the translations. A global
default-false `Show language choices` setting in Ops controls its visibility;
the setting stays behind the existing MarketingSiteSettings Store seam.

Before submission, self-build Vendors can read, create, edit and remove every
dish from Review, including the last dish, with five dishes per page. Assisted
Vendors can review/remove sources and return to change files. Submission still
persists directly to the Ops intake inbox. The success screen additionally
offers an outlined `Tell ZanTap` link with only its WhatsApp icon in brand
green and a prefilled reference to
`0784928786`; WhatsApp notifies the number only after the Vendor taps Send. This
candidate does not claim or add automatic WhatsApp delivery.

## Release status

Owner release review passed on 2026-08-30. Migration
`20260829170000_vendor_menu_intake` is applied and exact commit `680e4df` is
deployed READY as Vercel Production `dpl_8SLHNCwgYpC2E6EhZF8qgs8LNLK4` on
`zantap.app`. Read-only production route, render, browser-console and
error/warning-log checks pass. A labelled live intake → Ops → KDS import smoke
remains gated on action-time owner confirmation because it creates production
rows; it will not send a WhatsApp message.

## Amendment — dedicated private source store and recoverable uploads — 2026-08-30

The public storefront/menu-media Blob store and private Menu Intake source store
must use different credentials. Intake attachment reads, writes and deletes use
only `MENU_INTAKE_READ_WRITE_TOKEN`; a Vercel runtime without that private
store fails closed instead of silently placing source material in the public
store. Local development may still use the existing in-memory blob fallback.

Submission persists the private browser credential immediately after the
staged intake is created. Attachment failures are returned as recoverable,
plain-language results rather than uncaught Server Action errors. Repeated taps
in the same browser reuse the staged intake, omit files already uploaded in that
attempt and are guarded against concurrent double submission. This preserves
the private-source decision while making partial upload failure visible and
retryable.

The hotfix is deployed from exact commit `648f187` as Production deployment
`dpl_Enq332qdNsoH6ZTcC6zSe2AYrcJ2`. Private store
`zantap-menu-intake-private` is connected only to Production under the
`MENU_INTAKE_` prefix; the existing public Blob store remains unchanged.

## Amendment — international contact, durable preview confirmation and three-stage form — 2026-08-30

The owner approved the refined generated image as the exact public form target.
After the existing path choice, Menu Intake is an explicit three-stage sequence:
business contact, menu/source editing and review. The dark editorial identity is
retained, but the form is narrower and operationally clearer: one progress rail,
compact fields, a segmented existing-ZanTap choice, photo-first dish cards,
collapsed Sizes & extras, review-time fix guidance and a Send action that remains
disabled while a structured dish is invalid. Assisted intake continues through
the same stages without changing its source limits or review contract.

Menu Intake contact entry reuses the existing Rwanda-first international country
options. Country code and national number are separate presentation state; the
server still receives and persists exactly one canonical E.164 digit string
without `+`. No country column or migration is added. The Marketing Lead Form is
outside this amendment and remains untouched.

Selected local images retain preview identity across accordion and step changes.
Blob preview URLs are created and revoked under effect cleanup rather than render
memoization, avoiding development remounts revoking a URL that the UI still uses.
Submission also reads the authorized intake status back after uploads and does
not show Sent unless every selected attachment ID appears in that private result.
The check reveals no Blob path and does not weaken the dedicated private-store
policy. It makes partial persistence recoverable; it does not convert the public
browser into an importer or prove production storage without a live attached
record visible in authenticated Ops.

The approved reference image is a decision aid outside the repository:
`C:\Users\G\.codex\generated_images\01a04f16-a73c-7380-bf9a-0c14723d1c3c\exec-03ecb2ec-1f6a-4bd3-8c09-0ac0930ca444.png`.

## Local refinement status — 2026-08-30

Implemented on `codex/candidate-29`. Headed mobile and desktop QA passed and a
local self-build submission with one image reached Sent only after attachment
read-back. Production attachment persistence remains open because the six owner
submissions reviewed before this amendment all showed zero private files. No
push, deployment, migration or production write is part of this amendment yet.

## Amendment — durable retry identity and truthful resume state — 2026-08-30

The browser persists a safe expected-upload manifest with the staged intake
credential before files are sent. The manifest contains deterministic local file
keys and confirmed attachment IDs only; it never contains file bytes, Blob paths
or private read URLs. An authorized staged intake is shown as Sent only when each
expected key maps to an attachment ID that the private status seam still returns.
After a reload with missing confirmation, the Vendor returns to Review with an
explicit recovery message and must reselect the expected files before Send can
continue.

Removing a file or dish after partial upload is a durable operation, not only a
presentation change. A confirmed private attachment is removed through the
existing authorized Server Action before its local selection disappears, and its
retry entry is removed at the same time. Multi-photo dish cleanup records each
successful deletion even if a later deletion fails, leaving the visible dish in
place and the remaining cleanup retryable. These decisions are implemented
behind `lib/menu-intake/pending-uploads.ts`; they do not change the Store seam,
private Blob credential policy, schema, migration or import contract.

## Retry-recovery release status — 2026-08-30

The durable retry amendment is shipped. Exact branch HEAD `d63edf5`, containing
product repair `9c4365a`, is pushed and deployed READY as Vercel Production
`dpl_DTJE7Qjzr2ekxtqEc1rWTQZTP6gX` on `zantap.app`. Menu Intake, storefront and
KDS returned HTTP 200; the authenticated Ops boundary redirected to login; and
exact-deployment error, fatal, warning and HTTP 500 queries were empty.

Production attachment persistence remains unproved until a newly labelled
image/PDF submitted by the owner is visible in authenticated Ops. That
verification does not authorize Ops → KDS import, which remains a separate
action-time approval gate.

## Amendment — visible options and recoverable Ops deletion — 2026-09-01

Ops review must show the full catalog material already present in each submitted
dish: size labels/prices and add-on groups, choices, selection rules, price and
availability. This is a read-only review projection; it does not change import
semantics or publish anything to a Storefront.

An Operator may move a non-imported intake to Deleted immediately. The soft
delete revokes resume access and removes the intake from the active inbox, while
Ops may restore it for 30 days. Permanent purge becomes available only after
that boundary and removes both the durable intake graph and its private source
objects. Imported intakes remain immutable audit records and cannot enter this
deletion lifecycle. The Store remains the sole database seam and private source
cleanup remains behind the Menu Intake Blob seam.

## Ops trash/options release status — 2026-09-01

Migration `20260901190000_menu_intake_ops_trash` is applied; all 22 migrations
are current and the production `MenuIntake.deletedAt` column was verified with a
read-only query. Exact HEAD `5bd7d87` is pushed and deployed READY as Vercel
Production `dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv` on `zantap.app`. Route and
release-log smoke pass. No Ops → KDS import was performed or newly authorized.
