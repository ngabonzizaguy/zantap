# Candidate #29 — KDS, customer hub, lead capture and Ops improvements

Status: OPS TRASH/OPTIONS + BRIEFING PIN DEPLOYED · READ-ONLY PROD SMOKE PASSED · PROD ATTACHMENT PERSISTENCE NOT YET PROVED · IMPORT GATED · QUESTIONS 1–14 NOT STARTED
Date: 2026-09-01

## Owner request

This discovery covers four related but independently releasable surfaces:

- KDS: replace unclear update-batch wording, make the active batch preview
  collapsible, give Menu and Inventory distinct relevant icons, add an
  educational screenshot carousel/page, and offer new-Vendor contextual guides.
- Customer app/storefront: show changed images in `Your restaurants`, redesign
  update viewing as an automatically advancing horizontal carousel that pauses
  while held, revise the install invitation cadence, make Landmark optional,
  and allow a typed delivery location when the Kigali Sector list is insufficient.
- Ops: add time-period filtering/reset/search to Marketing Insights and make a
  public 14-day urgency notice controllable by Operators.
- Marketing Lead Form: accept international phone numbers.
- Vendor menu intake: provide a separate, openly shareable page where a Vendor
  can enter a digital menu or request ZanTap's help creating it from source
  material. This is Candidate #29's number-one implementation priority.

The owner explicitly permits recommendations and requested generated sample
imagery for the KDS guide-overlay direction after its content and target screens
are chosen.

## Repository findings

- `VendorUpdatesPanel` labels the surface `Customer updates`, explains a rolling
  20-minute grouping, and renders `Active batch preview` permanently expanded.
- `Tabs` currently renders `Icon name="inventory"` for both Menu and Inventory.
  The shared icon registry already maps `plate` to Lucide `Utensils` and
  `inventory`/`stock` to Lucide `Package`.
- `RestaurantUpdates` already includes `entry.imageUrl` inside the full-screen
  update viewer, but the compact update row on `Your restaurants` shows only the
  Vendor logo and text. Navigation is manual swipe/arrows; there is no timed
  auto-advance or press-and-hold pause.
- The install invitation is currently one-time per surface after a meaningful
  Customer action; it marks itself seen as soon as it appears and auto-hides
  after five seconds (eight seconds on iOS). The requested repeat cadence would
  supersede Candidate #26's prior no-nag decision and needs explicit semantics.
- Checkout currently requires phone, Sector and Landmark. Sector is a fixed
  Kigali dropdown; Landmark is a required text input.
- Ops Marketing Insights is fixed to the last 30 days. The server seam already
  accepts a bounded day count (1–365), but not exact date/time ranges.
- The Lead Form and server action currently validate Rwanda-only `2507…` phone
  numbers. The persisted Lead has one optional text `message`; it has no
  structured menu-help request or uploaded-image relation.

## Decision queue

- [x] Choose Menu and Inventory glyph direction from the owner's screenshot/reference.
- [x] Resolve `Stock` terminology between supplies and per-dish counts.
- [x] Lock short KDS vocabulary for the Vendor update-batch surface.
- [x] Define collapse defaults and growth threshold for active batch preview.
- [x] Define exact image placement in compact Customer update rows and viewer.
- [x] Resolve carousel structure, hold behavior, accessibility and reduced motion.
- [x] Lock the carousel auto-advance duration.
- [x] Resolve install-invitation eligibility, three-attempt cadence and stop rules.
- [x] Define typed delivery-location fallback and the meaning of optional Landmark.
- [x] Define Ops Insights presets, custom date/time bounds and timezone.
- [x] Choose KDS education information architecture and guide targets.
- [x] Generate and approve sample guide-overlay imagery.
- [x] Define international phone storage/validation and supported countries.
- [x] Supersede the Lead-Form-attached menu-help concept after owner clarification.
- [x] Define public urgency campaign wording, timer semantics, audience and Ops controls.
- [x] Clarify that Menu intake is a separate openly shareable Vendor page, not a
  Lead Form section or an Operator-published collaboration view.
- [x] Approve the two-path Menu intake and Ops-to-KDS import boundary.
- [x] Define safe merge behavior when the destination KDS already has menu items.
- [x] Define destination linking for existing versus not-yet-onboarded Vendors.
- [x] Approve the generated self-build-to-import UI/UX image.
- [x] Approve the brand-referenced assisted-intake UI/UX image.
- [x] Define how intake questions are answered from Ops without a Vendor login.
- [x] Define safe post-submission resume/edit access without an account.
- [x] Define upload formats, limits and retention for both intake paths.
- [x] Define Menu intake language support.
- [x] Define Vendor-facing status/notification behavior after submission.
- [x] Complete final scope confirmation and close discovery.

## Question 1 — KDS tab icons — RESOLVED 2026-08-28

The owner supplied the current KDS tab screenshot and a desired three-box plus
check reference, requested a different Inventory glyph, and asked to relabel the
tab `Stock`. The exact reference is not a single installed Lucide glyph. The
installed set includes `Boxes` (closest stock silhouette) and `PackageCheck`
(one box plus check). Recommendation: map the semantic stock-tab icon to Lucide
`Boxes` at the existing 20px tab size because the multi-box shape remains clear;
a check badge would imply verified/completed inventory and become cramped.
Menu should use the already-registered `plate`/Lucide `Utensils` glyph rather
than the current package glyph.

## Question 2 — Which concept owns “Stock”? — RESOLVED 2026-08-28

The requested `Inventory` → `Stock` label conflicts with the existing domain:
`Stock` currently means a MenuItem's optional remaining dish count, while the
Inventory tab tracks independent supplies such as ingredients, bottles and
packaging. Recommendation: use `Stock` for the supply tab, because it is the
more visible Vendor-facing concept. The owner rejected `Available portions` as
too long and unfriendly for Vendors with limited English. Revised
recommendation: label the per-dish editor field `Dish count`, and show its value
on menu cards as `5 left`/`Sold out`. This uses basic words, describes the
action directly, and keeps the supply tool's `Stock` label unambiguous.
`Quantity` is shorter but more abstract; `Portions` may be unfamiliar; `Left`
alone lacks context. The owner approved the revised recommendation. Vendor-facing
copy will use `Stock` for the supply area, `Dish count` for a MenuItem's editable
remaining count, and `N left`/`Sold out` for status. Internal types/routes may
retain their existing names for compatibility. `CONTEXT.md` now records these
canonical terms; no ADR is warranted because this copy decision is easy to
reverse and does not change the data model.

## Question 3 — Short wording for update batches — RESOLVED 2026-08-28

`Customer updates` is ambiguous: it can sound like updates *from* Customers.
The owner clarified that `batch` itself is too complex for a local Rwandan
street Vendor. It must remain an internal engineering term and disappear from
Vendor-facing copy. Revised recommendation:

- section label: `Menu updates`
- title: `Show customers what's new`
- helper: `New dishes, prices and photos stay here for 20 minutes.`
- metric labels initially proposed: `Updates`, `Changes`, `Views`, `Menu visits`
- preview label: `What customers see now`
- empty state: `No menu update is live. Your next important change will appear here.`

This exposes the outcome rather than ZanTap's grouping mechanism. The internal
domain and storage may continue to call the 20-minute group a batch. The owner
approved the plain-language section/title/helper/preview direction, then asked
for the distinction between `Updates` and `Changes`. The code defines `Updates`
as separate 20-minute groups and `Changes` as the sum of every qualifying save
(revision) inside those groups. Example: a price save followed by a photo save
five minutes later produces one Update and two Changes. This distinction is not
useful enough to teach a low-English Vendor. Revised recommendation: remove the
`Changes` card and show only `Updates`, `Views`, and `Menu visits`. The owner
declined that simplification and chose to keep all four metrics: `Updates`,
`Changes`, `Views`, and `Menu visits`. No extra explanation will occupy the main
screen; the product guide may explain the distinction if needed.

## Question 4 — Collapse behavior for “What customers see now” — RESOLVED 2026-08-28

The current preview is always expanded and lists every entry. Recommendation:
render one compact header row by default — `What customers see now · N changes`
with a chevron — and expand/collapse it on tap. Keep the empty state visible
without a toggle. Remember the chosen open/closed state only while the KDS page
remains open; do not persist it across visits. This is predictable and prevents
the panel from pushing Orders/Menu/Stock content far below the fold as it grows.
The owner approved this behavior.

## Question 5A — Opened update viewer — RESOLVED 2026-08-28

The full-screen viewer already attaches `entry.imageUrl` to the exact change
card, but the compact Vendor row shows only the Vendor logo and text. The owner
wants image-bearing changes visible before opening the viewer. Recommendation:
show up to three small square thumbnails at the right of the compact update row,
each using the image from its exact change; add `+N` when more exist. Accessible
labels name the associated dish/change. Do not auto-scroll this compact strip.
Opening the row still shows the large image directly on its matching change card.
This preserves row height and makes the image-to-change relationship explicit.

The owner then supplied three visual explorations for the opened update viewer:

1. one centered story card;
2. a centered card with neighboring cards peeking from both sides;
3. a full-screen food image with a floating bottom information sheet.

Recommendation: use Variation 2 as the structural direction. The neighboring
cards communicate horizontal swiping without relying on English, the image and
its exact change remain one card, and `View menu` stays in the bottom thumb zone.
Variation 1 is cleaner but makes swiping less discoverable. Variation 3 is more
cinematic but obscures more photography, adds sheet complexity, and feels less
suited to quickly scanning several restaurant updates. Modify Variation 2 by
keeping the small top-right pause control from Variation 1; while the Customer
holds, freeze auto-advance and show only a subtle `Paused` pill rather than the
large center overlay. Respect reduced-motion by disabling auto-advance.

The owner approved the modified Variation 2 direction. The implementation must
use peeked neighboring cards, keep each image attached to its exact change,
retain the bottom `View menu` action, use a small top-right pause control, pause
while held without a large center overlay, and disable autoplay when the
Customer requests reduced motion.

## Question 5B — Compact update-row imagery and scale — RESOLVED 2026-08-28

Before the Customer opens the approved viewer, the `Your restaurants` update
row still needs an image treatment. Recommendation remains: show up to three
small square thumbnails from the exact image-bearing changes, followed by `+N`
when more exist. This gives a useful visual preview without turning the compact
row into a second carousel or making it tall.

At the owner's request, a preview-only image was generated from the existing
mobile `Your restaurants` review screenshot to make this proposal concrete. It
shows the Updates card expanded just enough for three labeled square thumbnails
(`New dish`, `New photo`, `New price`) and a `+2` overlay while preserving the
rest of the hub. Preview output:
`C:\Users\G\.codex\generated_images\01a045cb-a5aa-7240-8886-3c2a064bad57\exec-df9cbf14-ea4c-4925-be8c-fa004799be20.png`.
This is a decision aid only, not an approved project asset or implementation.

The owner liked the image presentation but rejected rendering textual changes
(prices, taglines, descriptions, etc.) as if they were image tiles. A second
preview-only edit now demonstrates the revised mixed treatment:

- only `New dish` and `New photo` use photo tiles;
- `Price changed`, `New tagline`, and `Description updated` use slim icon/text
  rows with the changed value and no placeholder image;
- the two treatments remain under the same Vendor update card.

Second preview output:
`C:\Users\G\.codex\generated_images\01a045cb-a5aa-7240-8886-3c2a064bad57\exec-b84d7db1-1b54-4a30-842e-6d842b8bd12b.png`.
Recommendation: approve this mixed visual rule, but treat the mockup's exact
height as illustrative. The implementation should cap the compact preview and
use `+N more` when needed so the Updates card cannot dominate the hub.

The owner then asked how the treatment scales when more than one Restaurant has
updates. A third preview shows two separately bordered restaurant mini-cards:
each owns its identity, unseen count, image previews, text preview, chevron and
`+N more`; changes from different Restaurants are never mixed. Preview output:
`C:\Users\G\.codex\generated_images\01a045cb-a5aa-7240-8886-3c2a064bad57\exec-3c2661be-97f3-436b-8a38-88e77c71a39c.png`.

The preview also demonstrates the height risk. An initial recommendation was to
show at most two Restaurant mini-cards, cap their contents, and use `+N more`.
The owner rejected expansion links because an update set could contain more than
ten changes and expansion depth would be unpredictable. The owner locked the
following behavior instead:

- the avatar badge is the total published-change count for that Restaurant;
- no `+N more` or inline expansion action appears;
- tapping anywhere on the Restaurant update card opens its full approved viewer,
  where every published change is available through swipe/autoplay;
- the overview paginates Restaurants at ten per page when more than ten have
  active updates; changes inside one Restaurant are not paginated.

## Question 5C — Paginated overview visual approval — RESOLVED 2026-08-28

A fourth preview-only concept presents both states side by side: a Restaurant
overview with badge totals and `Previous · Page 1 of 3 · Next` plus
`Showing 1–10 of 23 restaurants`, and the full Inka viewer showing `1 of 12`
with a peeked next card. It contains no `+N more` action. Preview output:
`C:\Users\G\.codex\generated_images\01a045cb-a5aa-7240-8886-3c2a064bad57\exec-5ec74628-2efc-4e77-a191-147289383051.png`.
The owner approved the visual composition. Question 5 is now fully resolved.

## Question 6 — Install-notice timing and stop rules — RESOLVED 2026-08-28

The current customer install notice appears once after one meaningful action,
marks itself seen as soon as it appears, and auto-hides after five seconds. The
owner requested a three-attempt engagement cadence instead. Proposed precise
rule:

- count only active storefront time while the page is visible and the Customer
  has interacted recently; background/idle time does not advance the clock;
- show attempt 1 after five active minutes, then attempts 2 and 3 after two more
  active minutes each (active-minute marks 5, 7 and 9);
- the close button dismisses only the current notice and the next eligible
  attempt may still appear;
- tapping `Install` stops all future notices on that device even if the Customer
  dismisses the browser's native prompt; successful installation and standalone
  mode also stop them;
- after attempt 3 is dismissed or ignored, never auto-show again, but retain a
  manual Install entry in `Your restaurants` when installation remains possible.

Recommendation: adopt this deterministic rule. It matches the owner's 5-minute,
three-attempt, 2-minute-interval intent without counting a background tab as
engagement or nagging after the Customer actively tried the Install action.

The owner approved the recommendation without revision. Automatic appearances
are therefore capped at active-minute marks 5, 7 and 9; background and idle time
do not count; X dismisses only the current appearance; tapping `Install` stops
future automatic notices even when the native prompt is declined; and after the
third appearance only the manual `Install` entry remains when installation is
still possible. This interaction policy is easy to reverse and does not warrant
an ADR.

## Question 7 — Delivery area fallback and optional Landmark — RESOLVED 2026-08-28

The current checkout requires a value from a short fixed `KIGALI_SECTORS` list
and a non-empty Landmark. The Order model and every downstream surface call the
first value `deliverySector`, but the requested fallback may be a neighborhood,
cell, district or place outside that list rather than a formal Kigali Sector.

Recommendation: make one required Customer-facing field called `Delivery area`.
Keep the existing Kigali choices and add a final `Type another area` option. If
chosen, reveal one required free-text input; its trimmed value becomes the
Order's delivery-area value instead of a list choice. A Customer chooses either
a listed area or a typed area, never both. Label the second field `Landmark
(optional)` and accept an empty trimmed value. KDS tickets, dispatch, receipts,
WhatsApp and exports should show the delivery area alone when Landmark is empty,
and `Area — Landmark` only when both exist. Switching from the typed fallback
back to a listed area clears the typed draft so a hidden value cannot be sent.

This preserves one delivery destination concept and avoids forcing Customers to
misclassify an unlisted place as a Kigali Sector. Internal names may retain
`deliverySector` for compatibility unless implementation discovery finds a
strong reason to migrate them.

The owner approved the recommendation without revision. Customer-facing copy
will use the broader `Delivery area`; one listed choice or one typed fallback is
required; Landmark is optional; and every downstream representation must omit
Landmark-specific punctuation when it is empty. `CONTEXT.md` now records the
canonical term. This wording and compatibility choice is not hard to reverse,
so it does not warrant an ADR.

As a side acceptance requirement, the owner stated that a Customer must be able
to remove an added cart item. Repository inspection confirms the existing cart
already meets the minimum rule: `−` removes one unit, and pressing it on quantity
one removes that exact cart line plus its associated notes. Distinct size/add-on
combinations are independent cart lines. Candidate #29 must preserve this
behavior; it does not add a separate immediate-delete control unless later
requested.

## Question 8 — Ops Marketing Insights range, reset and search — RESOLVED 2026-08-28

Marketing Insights currently loads a fixed rolling 30-day window and renders
five aggregate cards plus three ranked lists: Clicked actions, Visitor languages
and Sources. The API accepts only a bounded day count; the Store reads all events
after one instant and cannot yet express an exact end bound. The analytics are
privacy-minimal and contain no Customer or Lead contact/form values to search.

Recommendation: provide presets `Today`, `Yesterday`, `Last 7 days`, `Last 30
days` (default), `Last 90 days`, and `Custom`. Interpret calendar boundaries in
`Africa/Kigali`, with Custom accepting inclusive From/To dates and optional times;
blank times mean 00:00 at the start and 23:59:59.999 at the end. Reject future,
reversed, or longer-than-365-day ranges. `Reset` returns to Last 30 days, clears
the custom bounds and clears search.

Keep Search as a case-insensitive display filter across the three ranked-list
labels (action, language and source) after the chosen period is summarized. It
must not change the five headline totals or imply searching private Lead/contact
data. Show matching rows in their existing sections and a clear no-match state.
This makes Search useful without changing what `Visitors` or conversion rate
mean.

The owner approved the recommendation without revision. These period, timezone,
validation, reset and search semantics are locked. They extend the existing
privacy-minimal analytics contract and do not warrant an ADR by themselves.

## Question 9 — KDS education structure and first guide targets — RESOLVED 2026-08-28

The KDS already has three education surfaces with different purposes:

- `Setup guide` tracks configuration progress from live Vendor data;
- `Kitchen help` holds text reference sections and WhatsApp support;
- coachmarks point at three live controls (`kitchen-toggle`, `menu-add`, and
  `dispatch-button`) and persist dismissal on the device.

Recommendation: keep those responsibilities and add one reusable full-screen
`Visual guides` viewer launched from Kitchen help and relevant Setup rows. It is
not a new top-level KDS tab. Each guide is a short task carousel of three to five
annotated screenshots with a title, one plain-English instruction per frame,
step count, Previous/Next, Close, and a final `Show me` action that closes the
viewer and opens the relevant KDS tab/control. Guides are always replayable from
Help.

Use contextual coachmarks only as small entry prompts into the relevant guide;
never auto-open the full screenshot carousel and never stack several coachmarks
on first load. Persist per-guide completion/dismissal by Vendor and device. A
new Vendor sees at most one eligible prompt at a time, chosen from real state.

Start with five visual guides tied to the highest-risk tasks:

1. `Get ready for orders` — OPEN/CLOSED status and what Customers experience.
2. `Add and update dishes` — dish details, photos, price, Dish count and what is
   published to Customers.
3. `Move an order through the kitchen` — NEW → ACCEPTED → PREPARING → READY →
   OUT FOR DELIVERY → COMPLETED, including dispatch.
4. `Track your Stock` — add a supply, record Received/Used/Wasted, and understand
   low-stock state.
5. `See what customers see` — Menu updates, the collapsed live preview, Views,
   Menu visits, and opening the storefront preview.

Do not make History, receipts, Profit or profile editing part of the first image
generation pass; their existing Help text remains available, and they can become
later guides if observed support demand justifies them. After this structure and
target list are approved, generate preview-only sample imagery for owner review
before locking the annotation style or treating anything as a project asset.

The owner approved the recommendation without revision. Setup, Help and
coachmarks retain their existing responsibilities; one replayable Visual guides
viewer owns screenshot lessons; no full guide auto-opens; prompts are
state-driven and appear at most one at a time; and the first guide set is limited
to the five named high-risk tasks. This information architecture extends
existing reversible UI seams and does not warrant an ADR.

## Question 10 — Visual-guide annotation style — RESOLVED 2026-08-28

One preview-only frame was generated from the real paid-order KDS screenshot for
guide 3, `Move an order through the kitchen`. It tests a full-screen dark guide
frame with:

- compact title, `1 of 4`, and Close header;
- the real KDS screen kept large and recognizable;
- one thin warm-orange callout around `ACCEPTED`;
- one plain-English instruction;
- large Back and Next actions.

Preview output:
`C:\Users\G\.codex\generated_images\01a04613-b147-7470-a459-555c3fd7a924\exec-f5a4dd90-08be-44f9-a9bc-60db40039f2b.png`.

This is a decision aid only, not an approved project asset. Recommendation:
approve the hierarchy and single-callout restraint as the common guide style.
During implementation, build the chrome and annotations as accessible UI over
real screenshots rather than shipping generated text/buttons inside a bitmap;
the preview establishes composition, not literal rasterized controls.

The owner visually approved the preview without revision. The common direction
is therefore a large authentic screen, one restrained warm-orange callout, one
short instruction, compact progress/Close chrome, and large Back/Next actions.
The generated frame remains outside the repository and is not a shipping asset.

## Question 11 — International Lead phone semantics — RESOLVED 2026-08-28

The Lead domain already defines `phone` as canonical E.164 digits without a
leading plus, and WhatsApp handoff accepts another canonical international
number. The public form currently shows one plain phone input; its client check
accepts a loose international shape, but the server canonicalizes with Rwanda as
the implicit country and then hard-rejects anything outside `2507…`. The existing
onboarding country list has only Rwanda, six nearby/common African codes, the US
and UK; it is not a complete international catalogue.

Recommendation: make the Lead Form country picker searchable and support every
country covered by the chosen phone-validation metadata, with Rwanda pinned and
selected by default. A Customer may type a national number under the selected
country or paste a complete `+` international number; a complete international
paste takes authority and updates the displayed country. Validate plausibility
for that country rather than accepting only an 8–15 digit length. Store exactly
one canonical E.164 digit string without `+`, preserving the current schema,
rate-limit key and WhatsApp handoff. Do not add a separate persisted country
field unless later workflow requirements need it.

An international contact number does not imply the food business operates
outside Rwanda: `area` remains an independent business-location answer. Reject
extensions, premium/service short codes and ambiguous national numbers that
cannot be parsed under the selected country. Display the canonical number back
to Ops with `+` and readable spacing.

The owner approved the recommendation without revision. Lead contact numbers
are now international E.164 values; Rwanda remains the default country but not a
validation restriction. `CONTEXT.md` records the revised Lead definition. The
existing persisted phone shape remains valid, so this decision does not require
a data migration or an ADR.

## Question 12 — Optional Menu-help request and uploads — SUPERSEDED 2026-08-29

The public Lead Form currently captures five required identity/business fields
and no message control, although the Lead model has one optional `message` text.
Ops shows a searchable Lead inbox with the shared Lead lifecycle and WhatsApp
follow-up; it has no request detail panel, attachment relation, or independent
Menu-help progress. Existing menu/branding uploads use public Vercel Blob and a
5 MB image rule. Raw Lead submissions must not be published through that path.

Recommendation: add an unchecked `I want help creating my menu` choice. When
selected, reveal a structured optional Menu-help request with:

- `What do you have?` — Current menu, Dish list, or Starting from scratch;
- estimated dishes — 1–10, 11–25, or 26+;
- `Help needed` multi-select — Add it to ZanTap, Write/clean descriptions,
  Organize categories and prices, Prepare food photos;
- optional details, maximum 1,000 characters;
- optional images labeled by the submitter as `Menu page`, `Dish photo`, or
  `Other`.

Allow at most six JPEG/PNG/WebP images, 5 MB each and 20 MB total. Validate MIME
and decoded image content server-side. Upload to private Vercel Blob under an
unguessable Lead-specific path; persist attachment metadata/Blob pathname in a
related record, never the bytes or a public URL in `Lead.message`. Ops reads an
attachment only through its authenticated boundary. Do not send attachment URLs
through the automatic WhatsApp handoff.

Give the nested Menu-help request its own lightweight status `REQUESTED →
IN_PROGRESS → COMPLETE`, with `CANCELLED` as an exit, because Lead contact status
and menu-production status can advance independently. In Ops, show a `Menu help`
badge/filter and an expandable detail view with the structured answers,
thumbnails/downloads and status control; preserve existing round-robin Lead
assignment. Delete private source uploads 90 days after the request becomes
COMPLETE/CANCELLED or the Lead becomes CLOSED, unless an Operator explicitly
promotes an approved image into the Vendor's public menu gallery. Promotion must
copy through the existing guarded menu-media seam; it must not expose the raw
Lead Blob directly.

The owner approved the recommendation without revision. `CONTEXT.md` defines the
Menu-help request as distinct from Lead follow-up, and ADR-0080 records the
separate workflow, private storage, retention and guarded-promotion boundary.

The owner later clarified that menu creation must not be nested in or attached
to the first Lead Form. It is a separate, openly shareable Vendor intake page.
Question 16 supersedes this Lead-attached model; ADR-0080 is retained as a
superseded decision record until the replacement is approved.

## Question 13 — Public 14-day urgency campaign — RESOLVED 2026-08-28

There is no current public announcement/campaign surface. `MarketingSiteSettings`
is a singleton for footer contact/social values and its Operator mutation is
audited, but it does not carry campaign lifecycle or an authoritative expiry.

Recommendation: render one slim, dismissible announcement strip on the public
marketing landing page only—never Vendor storefronts, KDS, Ops, Briefing or legal
pages. It should state the real closing event, not generic scarcity. Recommended
default English copy:

- headline: `Early setup window closes in {time}`
- body: `Food businesses can request ZanTap setup until {date}.`
- CTA: `Request setup` → the existing Lead Form anchor.

Operators may replace headline/body/CTA label and destination, but the UI warns
that copy must name what actually ends. English is required; Kinyarwanda, French
and Swahili variants are optional and fall back to English, using the existing
marketing locale rules.

Model one campaign with `DRAFT → SCHEDULED → ACTIVE → ENDED`; an Operator may
pause visibility or end it early. `Activate now` fixes `startsAt` and `endsAt`
exactly 14 × 24 hours apart. A scheduled campaign fixes the same duration from
its chosen start. Time is authoritative in `Africa/Kigali`. Re-enabling a paused
campaign keeps the original end; it never resets or extends the countdown.
After activation, extending the end is prohibited; a genuinely new window must
be a new audited campaign.

Display whole days using ceiling while more than 24 hours remain (`14 days
left`, then `13 days left`); below 24 hours show `Ends today`, plus the exact
Kigali closing date/time in accessible text. Hide immediately at expiry on both
server render and an already-open page. X dismisses the strip for the current
browser session only; the next session may show it again while the campaign is
active. CTA navigation also dismisses it for that session. Ops controls: editable
localized copy/CTA, start preview, Schedule/Activate, Pause/Resume, End early,
and a read-only authoritative start/end plus audit history.

The owner approved the recommendation, including the highlighted sentence `Food
businesses can request ZanTap setup until {date}.` without revision. `CONTEXT.md`
defines the Public urgency campaign and ADR-0081 records the truthful fixed-window
rule, scope and Operator lifecycle.

## Question 14 — Carousel auto-advance interval and end behavior — RESOLVED 2026-08-28

Question 5's structure, imagery, navigation, hold behavior, accessibility and
visual composition are approved, but the decision queue still lacks a numeric
auto-advance interval and a rule for the final card. Those values must be explicit
before implementation.

Recommendation: advance after six seconds on each settled change card. A manual
swipe or arrow navigation starts a fresh six-second interval. Press-and-hold
freezes the remaining interval and release resumes it; hiding/backgrounding the
page pauses autoplay and returns with a fresh six seconds. Reduced-motion users
still receive no autoplay. After the final change, stop on that final card rather
than looping back to the first; manual navigation remains available. This gives
Customers time to read price/description changes and avoids an endless carousel.

The owner approved the recommendation. Six seconds, the reset/pause semantics,
reduced-motion exception and stop-at-last behavior are locked. All discovery
questions are now resolved; Candidate #29 is ready to be converted into a PRD
and independently grabbable issues. No implementation is authorized by this
approval.

## Question 15 — Shareable Menu-help collaboration and questions — SUPERSEDED 2026-08-29

After the initial grill closed, the owner expanded Question 12: an Operator
should be able to share a Menu-help request with anyone, and recipients should
be encouraged to ask questions. This reopens the discovery because it changes
ADR-0080's authenticated-Ops-only read boundary. Repository inspection found a
recipient-specific, expiring and revocable Access-grant pattern for the private
Briefing, but no reusable question/comment thread.

Recommendation: let an Operator create multiple named collaboration links for a
Menu-help request. Each link is recipient-specific, secret-bearing, revocable,
and defaults to seven days; it requires no ZanTap account. The recipient sees
the structured Menu-help brief and approved source attachments, but never the
Lead phone, consent timestamp, routing assignment, internal Lead status, audit
history or other Ops data. Operators choose which attachments each grant may
view before sharing.

The collaboration page includes a prominent `Ask a question` composer and warm
encouragement such as `Questions are welcome — ask before you start.` Questions
and replies form one durable request-level thread with author display name and
timestamp. A recipient supplies a display name on first post; the grant records
which recipient link authored it. Operators answer in Ops, may resolve/reopen a
question, and can revoke any link immediately. New questions appear in the Ops
Menu-help inbox; external email/WhatsApp notifications remain out of scope unless
separately approved.

Do not use one unrestricted permanent public URL: it could be forwarded without
attribution and would weaken the approved private-source boundary. Sharing is
therefore broad in who may be invited, but controlled per recipient. ADR-0080
must be amended after the owner approves or revises this access model.

The owner then set this external Menu-help collaboration capability as Candidate
#29's number-one implementation priority, ahead of every other approved slice.
That priority is locked. At that point, the recipient-specific versus
unrestricted-public access choice remained pending.

The owner rejected secrets and recipient-specific access. The Menu-help share
page must be openly forwardable, require no login or secret, and be controlled
from Ops. An Operator publishes/unpublishes one public page for a request and
chooses exactly which structured fields and attachments appear. The page never
exposes the Lead's phone, consent, routing assignment, Lead status, audit history
or private/unselected attachments. Because forwarding is intentional, every
published attachment must be treated as public.

Privacy-minimal page views, question submissions and replies are recorded in the
request's Ops detail. Operators answer from Ops; there is no separate external
admin or reply tool. ADR-0080 and `CONTEXT.md` are amended to distinguish private
source material from the deliberately published Menu-help collaboration view.

The owner then clarified that the intended shareable page is not an
Operator-published view of an existing request. It is the Vendor-facing form
itself: a separate page that any prospective or operating Vendor can open to
build and submit a digital menu. Question 16 replaces this collaboration-page
interpretation. The number-one implementation priority remains locked, but now
applies to the separate Vendor menu-intake page.

## Question 16 — Separate Vendor menu intake — RESOLVED 2026-08-29

Owner clarification: this must be a separate, openly shareable page, independent
of the Marketing Lead Form. It serves Vendors who already operate or have a
business in mind but do not yet have an established digital menu. The Vendor
already owns the useful facts and media, so the page should let them contribute
those directly. It is not an Operator-published collaboration page and requires
no login or secret.

Recommendation: create one public `Menu intake` page with a short business and
contact identity section followed by two explicit paths:

1. `Build my menu` — repeatable draft items that mirror the customer-facing
   fields in KDS Add Item: required dish name and price (or size prices),
   category, optional description, up to six dish photos, and optional add-on
   groups. Exclude operational KDS fields such as Sold out/Availability, Dish
   count, supply Stock, low-stock rules and cost price.
2. `Help me create it` — a lighter assisted path where the Vendor uploads
   existing menu pages, dish photos and price material, adds notes, and asks
   questions. ZanTap/Ops turns the material into structured draft items.

Both paths create a staged `Menu intake`, never live `MenuItem` records. Suggested
workflow: `DRAFT → SUBMITTED → IN_REVIEW → READY_TO_IMPORT → IMPORTED`, with
`CANCELLED` as an exit. Ops owns the inbox, review/editing, validation and all
answers to Vendor questions. A deliberate `Approve and create menu` action then
copies reviewed items through the existing guarded Store/menu-media seams into
the selected existing or newly provisioned Vendor. Nothing submitted from the
public browser publishes directly to a Storefront.

The generic page may be shared with anyone. Before submission, browser-local
autosave protects an unfinished menu without creating a publicly editable URL.
Post-submission resume/edit identity and expiry are deliberately deferred to the
next one-at-a-time question after this architecture is approved.

The owner approved the two-path architecture and made the completion boundary
explicit: a reviewed intake must be importable into the selected Vendor's KDS
menu. Whether the Vendor structured the dishes personally or ZanTap/Ops created
them from assisted-source material, clicking the final Ops approval must
automatically create/fill the corresponding KDS menu data. It is not acceptable
to approve only the workflow status and then manually re-enter the menu in KDS.

The import is complementary to KDS: it promotes the reviewed intake into the
Vendor's real menu through the existing Store and guarded menu-media seams,
including approved names, categories, descriptions, price or size pricing,
images and add-ons. It records the source intake and import result for Ops audit.
Operational settings excluded from intake receive safe KDS defaults and remain
editable in KDS. ADR-0082 records this boundary and supersedes ADR-0080.

## Question 17 — Existing-menu matches during import — RESOLVED 2026-08-29

The approved import can target a Vendor whose KDS already contains dishes. A
blind append could create duplicates, while automatic name-based overwrite could
silently damage a live menu.

Recommendation: before final approval, Ops shows an import preview divided into
`New items` and `Possible matches`. Exact normalized names and close name/category
matches are warnings, never automatic decisions. New items are selected for
creation by default. For each possible match, the Operator must choose `Skip`,
`Add as new`, or `Update existing`; default to `Skip`. Updating changes only the
reviewed catalog fields selected in the preview and preserves KDS-only operational
fields such as availability, Dish count, supply links and cost. Import runs as
one auditable operation, prevents a second click from importing twice, and shows
the created/updated/skipped result per dish. This makes the intake genuinely
merge with an existing KDS menu without destructive guesswork.

The owner approved the recommendation without revision. Possible matches never
overwrite automatically; the Operator makes an explicit per-item decision and
KDS-only operational data survives an update. The import is idempotent and its
per-item outcome is auditable in Ops. ADR-0082 now includes this rule.

## Question 18 — Selecting or creating the destination Vendor — RESOLVED 2026-08-29

The public Menu intake must work for both an existing ZanTap Vendor and someone
whose business is not onboarded yet. Recommendation: start the intake with
`Is your business already on ZanTap?`

- `Yes` asks for the Storefront link or slug plus the submitter's contact phone.
  This is a matching hint, not proof of ownership; Ops confirms the destination.
- `No / Not yet` collects the minimum business identity needed for review, but
  does not create a live Vendor merely because the public form was submitted.

Before `Approve and import` becomes available, Ops must resolve exactly one
destination: select an existing Vendor, or choose `Create Vendor and import` and
complete the required Vendor profile/access fields. In the second case, final
approval creates the Vendor and imports the reviewed menu as one resumable,
audited operation; a partial failure cannot leave the intake marked `IMPORTED`.
The resulting Vendor uses the existing owner-access/recovery model. This keeps
the intake open to pre-onboarding businesses without allowing public submissions
to provision live Storefronts automatically.

The owner approved the recommendation without revision. An existing Storefront
reference is only a matching hint until Ops confirms it. A not-yet-onboarded
business remains an intake until Ops deliberately selects `Create Vendor and
import`; public submission alone cannot create a live Storefront.

The owner also required a design-first delivery sequence. Before any product
implementation, the complete Menu intake and Ops import journeys must be
expressed as UI/UX artifacts and visually approved by the owner. This is a hard
gate, not an optional implementation polish pass.

## Question 19 — Generated self-build UI/UX image — RESOLVED 2026-08-29

The owner rejected a prototype or clickable artifact. The required design-first
artifact is one generated high-fidelity image using ZanTap's existing visual
system, with two connected sides:

1. **Vendor intake, mobile-first (375 px baseline):** public welcome/business
   identity; existing-versus-new choice; `Build my menu`; repeatable Add Item,
   image, price/size and add-on states; `Help me create it`; source uploads and
   encouraged questions; review; validation/error; autosaved draft; submit; and
   reassuring success/reference state.
2. **Ops review/import, desktop-first with mobile responsive coverage:** inbox;
   intake detail; assisted structuring/editing; question/reply; destination
   selection or `Create Vendor`; new-item/possible-match comparison; per-item
   Skip/Add/Update; final approval; progress/partial-error recovery; and audited
   import result with a direct `Open KDS menu` action.

The first generated flow board shows three Vendor mobile screens (`Start your
menu`, `Add dish`, and `Review & submit`) feeding into one desktop Ops `Import
preview`, with New items, Possible matches, Skip/Add as new/Update existing,
`Approve & import`, `Menu imported`, and `Open KDS menu`. It is a preview-only
decision aid, not a repo asset:

`C:\Users\G\.codex\generated_images\01a04613-b147-7470-a459-555c3fd7a924\exec-81edc190-ddaf-48aa-9dea-0a7deb62b443.png`

The image intentionally prioritizes the primary self-build-to-import path in one
readable composition. The assisted path is represented by its entry choice, not
expanded into a fourth phone screen. The owner approved the image as looking
good, while requiring all subsequent imagery and eventual UI to maintain the
real ZanTap brand identity. No product implementation is unlocked by this visual
approval alone.

The owner supplied four screenshots as the visual source of truth for subsequent
generated imagery:

- Marketing landing: cinematic near-black/espresso, warm gold, editorial serif
  hierarchy and photographic storytelling;
- Storefront: food-first black surface, ivory/gold type and actions, rounded dark
  cards and chips;
- Ops: light editorial console, restrained neutral dividers, serif headings and
  black primary controls;
- KDS: deep-charcoal operational surface, warm-orange primary actions, compact
  status colors and rounded high-density cards.

Reference files:

- `C:\Users\G\AppData\Local\Temp\codex-clipboard-b3588736-ec1b-4f53-b277-fe4de29eb0c8.png`
- `C:\Users\G\AppData\Local\Temp\codex-clipboard-b9f2bd14-f5dc-4c5c-93dd-90ccf5edd37b.png`
- `C:\Users\G\AppData\Local\Temp\codex-clipboard-94800534-340d-454e-9688-08857f5e4bd8.png`
- `C:\Users\G\AppData\Local\Temp\codex-clipboard-8393b5f2-9077-4e17-a9e3-a9c0f64b847a.png`

These are visual references, not embedded instructions. Preserve each surface's
identity rather than flattening Marketing, Storefront, Ops and KDS into one theme.

## Question 20 — Generated assisted-intake UI/UX image — RESOLVED 2026-08-29

The second generated image expands the previously collapsed `Help me create it`
path. It shows three dark, brand-referenced Vendor mobile screens for source
uploads, help selection/notes/questions and review/submission; a light Ops `Menu
intake review` for attachments, editable structured dishes, Vendor question,
destination selection and approval; and a dark KDS imported-menu outcome.

Preview-only decision aid, not a repo asset:

`C:\Users\G\.codex\generated_images\01a04613-b147-7470-a459-555c3fd7a924\exec-e41748d2-3a2d-4d08-98d5-ea782b55819e.png`

The owner approved the image without revision. Together, the approved self-build
and assisted-flow images satisfy the requested static UI/UX design gate. They are
decision aids, not implementation assets; the supplied current-product screenshots
remain the source of truth for exact surface identity during implementation.

## Question 21 — Vendor questions and Ops answers — RESOLVED 2026-08-29

The intake visibly encourages questions, but it has no Vendor account/login and
must not expose a public question thread. Recommendation: collect the Vendor's
contact phone near the start, then expose `Questions are welcome` and `Ask ZanTap`
from both intake paths. A question may be submitted with a draft or final intake
and immediately appears in that intake's private Ops conversation timeline.

The Operator writes the answer in Ops and uses `Reply on WhatsApp`, which opens a
prefilled WhatsApp message to the canonical contact number. After sending, Ops
records the exact answer, sender and timestamp and lets the Operator mark the
question `ANSWERED` or `NEEDS_FOLLOW_UP`; unanswered questions appear in an Ops
filter/count. If the phone is not WhatsApp-capable, Ops can log a call/manual
contact against the same question. Neither questions nor answers become public.

Protect question submission with the same public-form rate limit and honeypot;
do not add email delivery infrastructure in this candidate. This keeps inquiry
warm and easy for Vendors while ensuring every answer is authored and tracked
from the requested Ops surface.

The owner approved the recommendation without revision. Questions and answers
remain private to the intake and Ops. Operators author and track every response
from Ops; WhatsApp is the primary delivery handoff with a logged manual-contact
fallback. No public Q&A or email-delivery system is added.

## Question 22 — Returning to a submitted intake — RESOLVED 2026-08-29

The page requires no account, but Vendors may need to add a missing photo,
correct a price or answer an Ops follow-up after submission. A permanently public
edit URL would expose private source material; making every correction flow
through the Operator would create unnecessary re-entry work.

Recommendation:

- before submission, autosave the draft in the current browser;
- on submission, create an immutable submitted revision and show a short public
  reference number, while the same browser retains an invisible, non-guessable
  resume credential—no password or code is shown or requested;
- until import starts, that browser may reopen the intake and submit additions or
  corrections as a new revision, so Ops can see exactly what changed rather than
  silently mutating the version under review;
- from another device, the Vendor requests access through Ops; after confirming
  the contact, Ops sends a one-time resume link through the approved WhatsApp
  conversation. Do not allow lookup using only phone plus reference number;
- once import begins, lock editing. Later Vendor changes become an amendment that
  returns to Ops review and never modifies the live KDS automatically.

Resume credentials expire 30 days after the last activity or immediately when
Ops revokes them. Private source attachments follow the previously approved
retention boundary. This preserves the no-account experience without turning an
openly shareable form into an openly editable submission.

The owner approved the recommendation without revision. Same-browser resume is
automatic and invisible to the Vendor; cross-device access is Ops-verified and
delivered once through WhatsApp. Every correction is a new reviewable revision,
editing locks during import, post-import changes are amendments, and access
expires after 30 inactive days or on Ops revocation.

Four questions remain including final scope confirmation.

## Question 23 — Upload formats, limits and retention — RESOLVED 2026-08-29

Recommendation: keep self-build dish media identical to KDS Add Item—JPEG, PNG
or WebP, maximum six images per dish and 5 MB per image. For `Help me create it`,
accept JPEG, PNG, WebP and PDF because Vendors commonly have photographed or PDF
menus; allow up to 30 source files, maximum 5 MB per image, 15 MB per PDF and
75 MB total per intake. Reject executable/archive/office-document formats and
strip unsafe image metadata during processing.

All assisted source files remain private and are readable only through Ops or an
authorized resume session. Delete terminal source files 90 days after Imported
or Cancelled unless an Operator explicitly retains a case for an active dispute.
Images approved for the live menu are copied through the guarded Vendor media
seam; importing never turns the private source URL itself into a public menu URL.
Show upload progress, per-file retry/removal and clear limit errors so a weak
mobile connection does not force the Vendor to restart the full intake.

The owner approved the recommendation without revision. Self-build media keeps
KDS parity; assisted source accepts images and PDFs within the approved per-file,
count and total limits. Source media remains private, terminal source files use
90-day retention, and only a guarded copy can become Vendor menu media.

Three questions remain including final scope confirmation.

## Question 24 — Menu intake languages — RESOLVED 2026-08-29

Recommendation: localize the public Menu intake interface in ZanTap's existing
four public languages: English, Kinyarwanda, French and Swahili. Inherit the
language from the referring ZanTap/marketing URL when present; otherwise use a
supported browser preference and fall back to English. Keep a visible language
selector throughout the flow and remember the choice in the draft/intake.

Do not automatically translate Vendor-authored dish names, descriptions, notes,
uploaded source material or questions. Store and show that content exactly as
submitted, record the interface language for Ops context, and let Ops deliberately
edit/translate structured catalog fields during review. WhatsApp answers are
authored by the Operator in the appropriate language; the system must not claim
machine-translated accuracy. Ops navigation itself remains in its current
Operator language rather than being expanded to four-locale administration in
this candidate.

The owner approved the recommendation without revision. The public UI supports
English, Kinyarwanda, French and Swahili with inherited/browser selection,
English fallback and a persistent visible selector. Vendor-authored content is
never silently translated; Ops receives the chosen-interface-language context.

Two questions remain including final scope confirmation.

## Question 25 — Vendor-facing status and notifications — RESOLVED 2026-08-29

Recommendation: after submission, show a reassuring confirmation with the short
reference number and a private same-browser status view. Use simple Vendor-facing
labels that map onto the internal workflow:

- `Sent` (`SUBMITTED`)
- `Being reviewed` (`IN_REVIEW`)
- `We need more information` (review blocked on Vendor)
- `Ready to add` (`READY_TO_IMPORT`)
- `Added to your KDS` (`IMPORTED`)
- `Closed` (`CANCELLED`)

Do not expose a public status lookup by reference number. Notify the Vendor only
for meaningful action/outcome states: `We need more information`, `Added to your
KDS`, or `Closed`; internal review movement does not generate noise. As with
question answers, Ops prepares and sends a localized WhatsApp message from the
intake detail and records the exact message, Operator and timestamp. No automatic
WhatsApp API or email service is introduced in this candidate.

The Imported message includes the Storefront link and `Open KDS` link; when Ops
created a new Vendor, it also uses the existing owner-access/recovery path rather
than transmitting an owner token in the message. Same-browser status access ends
under the approved 30-day inactivity/revocation rule, but the final confirmation
remains in Ops audit history.

The owner approved the recommendation without revision. Status remains private
to the authorized browser/resume session; reference numbers alone reveal
nothing. Only Need information, Imported and Closed prompt Vendor WhatsApp
updates, all authored and logged from Ops. Imported messages include Storefront
and KDS destinations but never an owner token.

One question remains: final scope confirmation.

## Question 26 — Final discovery confirmation — RESOLVED 2026-08-29

Recommendation: close Candidate #29 discovery with the following release shape:

1. **Priority #1 — separate Vendor Menu intake:** the openly shareable,
   four-locale, no-account page with self-build and assisted paths; private media
   and questions; revisions/resume; visually approved brand direction; Ops inbox,
   structuring, question answers, Vendor resolution, safe match review and an
   idempotent `Approve and import` into the real KDS menu. Public submission never
   provisions a Storefront or publishes a live dish by itself.
2. **Independent follow-up slices:** retain Questions 1–14 exactly as approved—
   KDS icons/Stock vocabulary/update copy/education, Customer update imagery and
   carousel, install cadence, checkout delivery-area behavior, international Lead
   phone input, Ops Insights filters and the truthful public urgency campaign.
   These are not prerequisites for Menu intake and may be planned separately.

Approval closes grilling as `READY FOR PRD/ISSUES · NOT IMPLEMENTED`, with the
Menu intake package listed first. It does not authorize product code, schema,
migrations, deployment or production writes, and it does not create the PRD or
issues until the owner requests that next step.

The owner approved final scope and then explicitly authorized delivery. Build
Priority #1 completely end to end and make it testable/shareable with potential
Vendors before starting the remaining approved Questions 1–14 slices. All work
must live on a separate test branch. The owner requested avoiding PowerShell if
another terminal is available and asked to approve the terminal/branch approach
before branch creation.

Read-only environment verification found:

- explicit Git Bash exists at `C:\Program Files\Git\bin\bash.exe` and works with
  this repository, Node v25.2.1, npm 11.7.0 and Git;
- the generic `bash` selector resolves to the Windows WSL launcher and fails with
  `Bash/CallMsi/ERROR_FILE_NOT_FOUND`; WSL is therefore not usable as configured;
- current branch `codex/customer-restaurant-hub` points at `6510df6`, the same
  commit as `origin/main`; local `main` is 29 commits behind;
- the current worktree contains substantial pre-existing dirty/untracked work.

Recommended execution setup, pending explicit owner approval: create a clean
linked worktree from `origin/main` on branch `codex/candidate-29`, use the explicit
Git Bash executable for commands, and implement all Candidate #29 work there in
the approved priority order. This isolates testing from unrelated current-worktree
changes while preserving them untouched.

## Boundaries

- This is a grilling/documentation session only. No product code, schema,
  migration, deployment, production data or generated image has changed.
- Candidate #26 remains the authoritative baseline for the installed customer
  app and update batches; this candidate records intentional follow-up changes.
- Work must remain behind the existing Store, customer repository, checkout and
  Operator seams. Do not add a competing browser-to-database path.
- Priority #1 must be fully wired and verified before any follow-up slice begins.
- The owner approved the explicit Git Bash and isolated linked-worktree setup;
  implementation then proceeded only inside that clean Candidate #29 worktree.

## Priority #1 implementation — COMPLETE LOCALLY 2026-08-29

- [x] Owner approved explicit Git Bash and the isolated
  `codex/candidate-29` linked worktree from `origin/main`; the original dirty
  checkout was preserved untouched.
- [x] Public `/menu-intake` ships the approved dark, mobile-first self-build and
  assisted paths, visible EN/RW/FR/SW selector, local autosave, structured dish
  catalog fields, private questions, source limits, progress, and submission.
- [x] Public submission creates only staged immutable revisions and hashed
  browser access. Same-browser status is private; one-time cross-device links
  exchange once into a 30-day browser credential and Ops can revoke access.
- [x] Private JPEG/PNG/WebP/PDF sources use private Blob storage, image metadata
  is stripped by re-encoding, authenticated Ops viewing reveals no raw storage
  path, and 90-day terminal-source eligibility is explicit and tested.
- [x] `/ops/menu-intakes` provides inbox/detail, assisted structuring, Operator
  revisions, question answering and exact contact logs, Vendor resolution,
  conservative match preview, explicit Skip/Add/Update decisions, status and
  notification controls, and direct KDS navigation.
- [x] Both Store adapters implement the same intake seam. Import is transactional
  and idempotent, audits per-item results, preserves KDS operational fields on
  update, and copies approved private images through public menu-media storage.
- [x] Prisma schema and additive migration
  `20260829170000_vendor_menu_intake` validate and generate locally. The
  migration was not applied to any database.
- [x] Verification: focused 8 files / 10 tests; full 443 passed / 117 expected
  skips; TypeScript clean; Candidate #29 ESLint clean; production build clean.
  Repository-wide lint reaches three pre-existing Candidate #28 Briefing errors
  on `origin/main`, with no Candidate #29 finding.
- [x] Headed Playwright smoke: self-build catalog controls and submission;
  assisted submission → Ops immutable structuring → logged call answer → Vendor
  selection → import → KDS item `Igisafuria · 4,200 RWF · Available`. Visual
  review passed for dark public intake and light Ops console.

Priority #1 is complete locally. No deploy, migration application, production
write, or Questions 1–14 implementation was authorized or performed.

## Priority #1 owner-review refinement — IMPLEMENTED LOCALLY 2026-08-29

- [x] Owner approved the generated three-screen UI/UX as the exact target.
- [x] Self-build uploads render immediately as compact image thumbnails; each
  thumbnail has its own remove action and selecting more files appends up to the
  existing six-image limit instead of replacing the whole selection.
- [x] Assisted uploads render image previews and compact removable PDF cards;
  removed files can be replaced without restarting the intake.
- [x] Self-build dishes use a one-open-at-a-time compact accordion with name,
  category and price summaries. At most five dishes render per page, with
  Previous/Next pagination and the newly added dish opened on its correct page.
- [x] The persistent header includes the approved `Visit zantap.app` CTA.
- [x] Verification: new presentation seam 2/2; Candidate #29 focused 12/12;
  full suite 445 passed / 117 expected skips; TypeScript and scoped ESLint clean;
  production build clean.
- [x] Owner mobile/desktop visual and interaction review.

This refinement changes no persistence contract or migration beyond the
Priority #1 release recorded below. Questions 1–14 remain untouched.

## Priority #1 plain-language/review refinement — IMPLEMENTED LOCALLY 2026-08-30

- [x] Public English copy is short, direct and friendly; existing restrained
  rise motion is applied to steps and accordion content with reduced-motion
  protection.
- [x] The public language selector is hidden by default. Ops Settings owns one
  global `Show language choices` switch; enabling it restores the existing
  EN/RW/FR/SW selector without another deployment.
- [x] Self-build Review renders the real dish catalog five per page with Edit,
  Remove (including the last dish), Add another dish and Send menu. Assisted
  Review shows removable sources and a direct Change files action.
- [x] Successful submission remains durable in Ops and additionally offers an
  outlined `Tell ZanTap` CTA with only its WhatsApp icon in brand green. It
  opens a prefilled message to
  `0784928786`; the Vendor must tap Send, because no automatic WhatsApp API is
  introduced.
- [x] Automated mobile browser pass at 390×844: English-only start, six-dish
  pagination, Review/Edit, successful submission and exact `wa.me/250784928786`
  handoff passed with zero browser errors. The sole logo LCP warning was fixed.
- [x] Post-correction browser inspection confirms the CTA is neutral and
  outlined while only the icon stroke is WhatsApp green (`#25D366`); a fresh
  reload produced zero new warnings or errors.
- [x] Final verification: 446 passed / 117 expected skips; scoped ESLint,
  TypeScript, Prisma validation and production build clean.
- [x] Owner release review.

The approved Ops switch adds one default-false column to
`20260829170000_vendor_menu_intake`. Questions 1–14 remain untouched.

## Priority #1 release — DEPLOYED · WRITE SMOKE PENDING 2026-08-30

- [x] Owner approved the final local UI and release gate.
- [x] Production migration `20260829170000_vendor_menu_intake` applied cleanly;
  follow-up Prisma status reports all 21 repository migrations up to date.
- [x] Pushed exact commits `aaf19c7` and `680e4df` to
  `origin/codex/candidate-29`.
- [x] A detached clean worktree deployed exact commit `680e4df` as Vercel
  Production `dpl_8SLHNCwgYpC2E6EhZF8qgs8LNLK4` (`READY`) on `zantap.app`.
- [x] Read-only production smoke: `/menu-intake`, storefront and KDS return 200;
  Ops intake route redirects to auth as expected; live Menu Intake renders the
  short English start with language choices hidden; browser console and
  release-window Vercel error/warning scans are clean.
- [ ] One labelled production Menu Intake submission → authenticated Ops review
  → KDS import smoke requires action-time owner confirmation because it creates
  real production rows. No WhatsApp message will be sent.

## Priority #1 production upload defect — HOTFIX DEPLOYED 2026-08-30

- [x] Production evidence captured: valid submissions create the intake, then
  attachment upload throws because private access was requested against the
  existing public Vercel Blob store.
- [x] Private intake sources now require the separate
  `MENU_INTAKE_READ_WRITE_TOKEN`; production refuses to fall back to the
  public media store.
- [x] Upload failures return short Vendor-facing recovery copy instead of an
  uncaught Server Action rejection.
- [x] The browser saves the staged intake credential before uploads, locks
  double taps, retries the same intake, and skips same-session files that have
  already uploaded.
- [x] Focused 5/5, full 449 passed / 117 expected skips, TypeScript, scoped lint
  and production build clean.
- [x] Owner authorized release without spending usage on visual browser testing.
- [x] Dedicated private Vercel Blob store connected under the `MENU_INTAKE_`
  prefix; commits `d77822d` + `648f187` pushed and exact commit `648f187`
  deployed READY as `dpl_Enq332qdNsoH6ZTcC6zSe2AYrcJ2` on `zantap.app`.
- [x] Read-only smoke: `/menu-intake` 200 and release-window error log empty.
- [x] Owner production submission attempts create durable `SUBMITTED` intakes
  that are readable in authenticated Ops. Six owner-labelled `Test` records are
  present; the newest is `MI-260830-B1DA8E` with revision 1, one structured dish
  and one private question. The hotfix deployment has no 500/error/fatal logs.
- [ ] Attachment persistence is not yet proved: all six visible production test
  records report `0 private files`, including the newest attempt. Do not mark the
  upload smoke complete until a labelled image/PDF appears in Ops after Send.
- [ ] Authenticated Ops review → KDS import smoke remains open and must not be
  performed without action-time owner confirmation because it writes live menu
  data. No WhatsApp message has been sent.

The owner separately requested international phone entry, correction of
intermittent local image previews, and a more professional form presentation.
A refined three-screen image was generated but was not part of this priority
deployment. Questions 1–14 remain untouched.

## Priority #1 owner-approved contact/preview/form refinement — IMPLEMENTED LOCALLY 2026-08-30

- [x] Owner explicitly approved the refined three-screen image as the exact
  implementation target:
  `C:\Users\G\.codex\generated_images\01a04f16-a73c-7380-bf9a-0c14723d1c3c\exec-03ecb2ec-1f6a-4bd3-8c09-0ac0930ca444.png`.
- [x] Menu Intake contact entry now uses the existing Rwanda-first international
  country list, keeps country code and national input separate on screen, sends
  one canonical digit-only phone to the unchanged Store schema, and displays it
  back with a leading `+` and readable spacing. The Marketing Lead Form was not
  touched.
- [x] Local image previews now publish Blob URLs from a cleanup-safe effect
  instead of creating/revoking them during render ownership. The selected image
  survived accordion collapse, Review navigation and hot refresh in the headed
  browser pass.
- [x] Send now reads the private browser status seam back and refuses success if
  any selected attachment ID is absent. A local self-build submission with one
  image completed as `MI-260830-6E8057` only after the attachment read-back
  passed. The production `0 private files` finding remains open and unchanged.
- [x] The approved professional form hierarchy is implemented as business →
  dishes → review (`1 of 3`, `2 of 3`, `3 of 3`), with compact fields, segmented
  ZanTap status, collapsed Sizes & extras, photo-first dish editing, review cards,
  exact fix guidance and disabled Send while a dish is invalid. Assisted intake,
  success/resume behavior and private upload policy remain intact.
- [x] Browser QA passed at 390×844 and 1440×1000 with zero errors/warnings;
  international selection, preview survival, fix navigation, Send gating and
  local durable attachment read-back passed. Evidence remains under the preserved
  `output/playwright/` directory.
- [x] Verification: focused 8/8; full 452 passed / 117 expected skips; scoped
  ESLint, TypeScript, diff check and production build clean.
- [ ] Production attachment persistence is still not proved. Do not close it
  until a new owner-labelled image/PDF is visible in authenticated Ops.
- [ ] Authenticated Ops → KDS import remains separately action-gated because it
  writes live menu data.

No push, deployment, migration or production write was authorized or performed
for this refinement. Questions 1–14 remain untouched.

## Release review — REPAIRED · VERIFIED · RELEASE AUTHORIZED 2026-08-30

- [x] Exact commit `6d87106` reviewed with focused Menu Intake tests (7/7),
  scoped ESLint, TypeScript and diff hygiene clean. Repository-wide lint still
  stops only on the three documented Candidate #28 Briefing findings.
- [x] Repair partial-upload removal before release. If one file uploads and a
  later file fails, removing the already-uploaded selection updates only local
  `File[]` state. The staged private attachment and `uploadedAttachments` entry
  remain, even though the public removal Server Action already exists. Removing
  a dish has the same stale-attachment edge. Retry can therefore reach Sent
  while retaining a file the Vendor removed from the visible draft.
- [x] Add focused regression coverage for upload-success → later failure → remove
  uploaded file/dish → retry, proving both the private attachment and retry map
  reflect the visible selection.
- [x] Keep failed/incomplete submissions out of Sent after reload. The resume
  credential is persisted before uploads (correctly), but startup currently
  treats any authorized staged `SUBMITTED` intake as Sent without retaining or
  rechecking the pending attachment expectation. A Vendor can therefore refresh
  after an upload error and see Sent even though the missing file was never
  confirmed. Persist a safe pending-upload manifest/status (no Blob path or file
  contents) or otherwise render an explicit recovery state until confirmation.
- [x] Confirm partial whole-dish cleanup remains retryable when deletion succeeds
  for one confirmed photo and fails for a later photo. Completed deletion state
  is retained while the visible dish remains for another attempt.
- [x] Verification on the final repair: focused 10/10; full 455 passed / 117
  expected skips; scoped ESLint, TypeScript, diff hygiene and production build
  clean. Real-browser recovery QA restored an incomplete staged intake to Review
  with explicit file-attention copy, and blocked Send until the expected file is
  reselected. The only browser console failures were blocked Vercel analytics and
  Speed Insights debug scripts in local development, not application errors.
- [x] Owner authorized the repair → verify → push → deploy sequence. Release is
  proceeding without a schema change or migration.

Production attachment persistence remains open until a newly labelled image/PDF
is visible in authenticated Ops after this release. Ops → KDS import remains a
separate action-time gate. The Marketing Lead Form and Questions 1–14 remain
untouched; no production business row was created during local verification.

## Retry-recovery release — DEPLOYED · READ-ONLY PROD-SMOKED 2026-08-30

- [x] Exact verified repair committed locally as `9c4365a`
  (`fix(menu-intake): make upload recovery durable`). `.playwright-cli/` and
  `output/` remain preserved and untracked.
- [x] Connectivity returned and `git push origin codex/candidate-29` advanced
  the remote from `003d906` through exact branch HEAD `d63edf5`.
- [x] Exact branch HEAD `d63edf5` (product repair `9c4365a`) deployed READY as
  Vercel Production `dpl_DTJE7Qjzr2ekxtqEc1rWTQZTP6gX`, aliased to
  `zantap.app`, `www.zantap.app` and `zantap-psi.vercel.app`.
- [x] Read-only release smoke passed: `/menu-intake`, `/inka-steakhouse` and
  `/vendor/inka-steakhouse` returned HTTP 200; `/ops/menu-intakes` returned the
  expected 307 to `/ops/login`; exact-deployment error, fatal, warning and HTTP
  500 queries were empty.
- [ ] Ask the owner to submit a newly labelled production image/PDF and verify
  it appears in authenticated Ops. This is the remaining attachment-persistence
  proof and is not an authorization to import anything into KDS.

Do not perform Ops → KDS import without its separate action-time approval.

## Ops review visibility and 30-day trash — DEPLOYED · READ-ONLY PROD-SMOKED 2026-09-01

- [x] Ops review renders every submitted size price and add-on group/choice,
  including required/optional selection rules, included prices and availability.
- [x] A non-imported submission can be moved immediately to Deleted. Deletion
  revokes public resume access and hides the record from the active inbox.
- [x] Ops can restore the submission for 30 days. Permanent purge is unavailable
  before that boundary and, after it, removes the intake row plus its private
  source files through the existing private-Blob seam.
- [x] Imported submissions remain audit-protected and cannot be deleted.
- [x] Focused Menu Intake Store/options coverage passes 4/4. Headed browser QA
  submitted Small/Large sizes and Sauce extras, verified them in authenticated
  Ops, then passed delete → Deleted/recover-until date → restore. No KDS import
  was performed.
- [x] Migration `20260901190000_menu_intake_ops_trash` applied; all 22
  migrations are current and the production `deletedAt` column was confirmed.
- [x] Exact product/release HEAD `5bd7d87` pushed and deployed READY as Vercel
  Production `dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv` on `zantap.app`.
- [x] Read-only production smoke passed for Briefing, Menu Intake, storefront,
  KDS and the Ops login boundary. Exact-deployment error, fatal, warning and
  HTTP-500 scans were empty.

Production attachment persistence remains open until a newly labelled owner
image/PDF is visible in authenticated Ops. Marketing Lead Form and Questions
1–14 remain untouched.

Local QA note (2026-09-01): port 3000 now reads a gitignored `.env.local` with
both required Operator values. Fresh-browser sign-in and `/ops` load pass with
zero console errors. No product or production configuration changed.
