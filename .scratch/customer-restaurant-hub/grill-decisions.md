# Candidate #26 — Installed customer hub + restaurant updates

Status: GRILL COMPLETE · READY FOR PRD · NOT IMPLEMENTED
Date: 2026-08-21

## Product direction

Replace the customer-side per-storefront install model with one ZanTap customer
app installed once. The storefront from which installation begins becomes the
customer's first saved restaurant; later home-screen launches open a private
`Your restaurants` hub. The vendor KDS remains a separate installed app.

This candidate is not a marketplace. New restaurants enter the collection only
through QR codes, shared links, direct visits, and meaningful customer actions.

## Locked decisions

- A restaurant is saved after the customer adds an item, starts checkout,
  places an order, or explicitly taps a bookmark-style `Save restaurant`
  action. A passive page view is insufficient.
- Saved restaurants and viewed-update markers are device-local in v1. There is
  no customer login or cross-device restoration. Pre-install activity on the
  ZanTap origin carries into the installed app.
- Saved restaurants persist until manually removed. They are keyed by stable
  vendor ID so slug changes follow automatically.
- Suspended or unavailable vendors remain listed as unavailable, publish no
  updates, and cannot accept orders. Reactivation restores normal behavior.
- Installation uses ZanTap branding and iconography. The invitation appears
  only after meaningful engagement and explains that installation preserves
  restaurants and menu updates. Immediate arrival prompts and repeated nagging
  are excluded.
- Immediately after installation the customer stays on the originating
  storefront. Later home-screen launches open `Your restaurants`.
- The hub orders the persistent restaurant list primarily by recent
  interaction. Unseen state must not continually reorder that list.
- The home has two layers: a horizontal active-update tray and a persistent
  list of all saved restaurants. It shows `N new updates` and the quieter
  `Your restaurants · N` total separately. Search filters only saved vendors.
- Only restaurants with a non-expired update appear in the tray. Unseen updates
  use the active ZanTap ring; viewed updates remain for their three-day life
  with a muted ring. Unseen restaurants precede viewed restaurants, and each
  group is newest-first.
- One ring represents all active batches from a restaurant. Its viewer orders
  those batches newest to oldest and opens the newest unseen batch first.
- A batch becomes viewed only when it is actually displayed. Opening one batch
  does not clear the rest. A secondary tray-overflow action may mark all as
  seen.

## Update production

- Qualifying customer-facing changes are: a new dish, a new or changed dish
  photo, a price change, restoration of an archived dish, and a public vendor
  branding/profile change. A future vendor-authored announcement or promotion
  requires a separate candidate.
- Stock/availability toggles, inventory operations, internal KDS activity, and
  trivial corrections do not produce customer updates.
- Qualifying changes publish automatically and merge into a 20-minute rolling
  batch. The first change publishes immediately. Each later qualifying change
  advances the update revision, so a customer who saw the earlier revision
  receives an unseen ring again.
- Updates remain prominent for three days rather than WhatsApp's 24 hours.
  Viewing clears unseen state for the displayed batch; expiry removes the batch
  from the tray but never removes the restaurant.
- Each update preserves a small immutable public snapshot: change type, dish
  name, image, and old/current price where relevant. `View menu` resolves the
  live storefront. An archived or unavailable dish is labeled `Currently
  unavailable` in the viewer rather than rewriting history.
- Vendors have a default-on `Share menu updates with customers` setting, a
  per-save `Don't announce this change` control, and visibility into the active
  20-minute batch from KDS.
- Manual status posts are explicitly deferred.

## Viewer and privacy

- Tapping a ring opens a focused full-screen viewer with restaurant identity,
  publish time, concise change summary, changed-dish cards, current-menu CTA,
  and tap/swipe movement between restaurant updates.
- Vendors receive aggregate update-open and menu-visit counts only. ZanTap does
  not expose phone numbers, device identities, or individual viewer history.
- Push notifications are deferred. Updates surface on return to ZanTap.

## Offline boundary

- The hub remains available offline with locally saved restaurant identity,
  last interaction, and cached update summaries.
- A previously visited cached menu may render read-only with a clear
  `Last updated...` label. Cart submission and checkout require connectivity.

## Explicit exclusions

- Customer accounts and cross-device synchronization
- Public vendor discovery, ranking, location search, and paid placement
- Push notifications
- Manual vendor status/promotion authoring
- Identifiable update-viewer analytics
- Any change to the separately installed vendor KDS PWA

## Next step

Create a PRD and isolated issues before implementation. The PRD must resolve
manifest/scope migration from ADR-0059, local device-state storage, Store-backed
update events/snapshots, public batched feed reads, vendor controls, analytics,
offline caching, and backward compatibility for already-installed restaurant
PWAs. No migration, deployment, or production smoke is authorized by this
grill.
