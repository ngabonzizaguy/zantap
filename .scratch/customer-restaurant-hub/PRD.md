# Candidate #26 — Installed customer hub and restaurant updates

Status: ready-for-agent
Branch: `codex/customer-restaurant-hub`
Decision record: ADR-0064

## Problem Statement

Customers currently install a restaurant-specific storefront PWA. That works
for one Vendor, but fragments ZanTap into separate home-screen apps and gives a
Customer no private place to retain restaurants they use or notice meaningful
menu changes after leaving.

Customers need one ZanTap app that remembers only Vendors they deliberately
engage with, without becoming a marketplace, requiring an account, exposing
viewer identity, or sending push notifications. Vendors need a predictable,
low-effort way to share meaningful public changes and see aggregate interest
without authoring social posts.

## Solution

Replace new customer-side storefront installs with one ZanTap PWA. Meaningful
storefront actions save the Vendor to a versioned device-local collection and
unlock a one-time ZanTap install invitation. Installation leaves the Customer
on the originating storefront; later icon launches open `Your restaurants`.

The hub contains a persistent recently-interacted-with Vendor list and a
separate tray for active three-day update batches. Qualifying menu/profile
changes automatically publish small immutable public snapshots into a rolling
20-minute batch. Each revision becomes unseen again after a Customer viewed an
earlier revision. Seen state stays on the device. Vendors may disable updates,
suppress one save, preview the active batch, and see aggregate opens/menu visits.
The hub and previously cached menus are readable offline; ordering and checkout
remain online-only. The KDS remains a separately installed app.

## User Stories

1. As a Customer, I want to install ZanTap once, so that I do not collect one app per restaurant.
2. As a Customer, I want meaningful actions to save a Vendor, so that my collection reflects intent.
3. As a Customer, I want adding a dish to save the Vendor, so that it is retained at the first useful action.
4. As a Customer, I want starting checkout to save the Vendor, so that I can return if I stop before payment.
5. As a Customer, I want placing an Order to save the Vendor, so that restaurants I buy from remain easy to find.
6. As a Customer, I want an explicit `Save restaurant` action, so that I can retain a Vendor without ordering.
7. As a Customer, I do not want a passive visit to save a Vendor, so that my collection is not browsing history.
8. As a Customer, I want pre-install saves to remain after install, so that installing does not reset my collection.
9. As a Customer, I want the install invitation only after engagement, so that arrival is not interrupted.
10. As a Customer, I want the invitation to explain saved restaurants and updates, so that its value is clear.
11. As a Customer, I do not want repeated automatic install prompts after dismissal, so that ZanTap does not nag me.
12. As a Customer, I want install acceptance to leave me on the storefront, so that I can finish my task.
13. As a Customer, I want later icon launches to open `Your restaurants`, so that ZanTap has one customer home.
14. As a Customer with a generic ZanTap install, I want it to adopt the hub, so that I do not reinstall unnecessarily.
15. As a Customer with a restaurant install, I want its icon to keep opening that storefront, so that migration does not break it.
16. As a Customer with a legacy restaurant install, I want a path into the hub, so that I can transition deliberately.
17. As a Customer, I want saved Vendors keyed by stable ID, so that slug changes do not duplicate or break them.
18. As a Customer, I want restaurants ordered by recent interaction, so that the ones I use are easiest to reach.
19. As a Customer, I want unseen updates not to reorder that list, so that it remains predictable.
20. As a Customer, I want search limited to saved Vendors, so that the hub does not become discovery.
21. As a Customer, I want to remove a saved Vendor, so that I control my collection.
22. As a Customer, I want a suspended Vendor retained as unavailable, so that it does not silently disappear.
23. As a Customer, I want reactivation to restore normal access without re-saving, so that temporary suspension is reversible.
24. As a Customer, I want separate `N new updates` and `Your restaurants · N` counts, so that activity and collection size are distinct.
25. As a Customer, I want only non-expired updates in the tray, so that it stays current.
26. As a Customer, I want unseen rings active and viewed rings muted, so that new information is clear.
27. As a Customer, I want one ring per Vendor, so that multiple batches do not crowd the tray.
28. As a Customer, I want unseen Vendors before viewed Vendors and newest first within each group, so that new updates are easy to scan.
29. As a Customer, I want the newest unseen batch to open first, so that I reach what I have not seen.
30. As a Customer, I want batches newest to oldest, so that update navigation is understandable.
31. As a Customer, I want a batch marked seen only after display, so that skipped content stays unseen.
32. As a Customer, I want viewing one batch not to clear the rest, so that seen state is accurate.
33. As a Customer, I want an optional `Mark all as seen`, so that I can clear updates deliberately.
34. As a Customer, I want concise summaries and changed-dish cards, so that updates are quick to understand.
35. As a Customer, I want price announcements to retain old/current prices, so that later edits do not erase context.
36. As a Customer, I want archived/unavailable announced dishes labeled `Currently unavailable`, so that history does not imply orderability.
37. As a Customer, I want `View menu` to open current storefront truth, so that I can act on live data.
38. As a Customer, I want updates visible for three days after the latest revision, so that I have time without permanent clutter.
39. As a Customer, I want a later batch revision to become unseen again, so that rolling changes are not hidden.
40. As a Customer, I want saved/seen state on my device, so that no account is required.
41. As a Customer, I want storage-loss limits explained, so that device-local state is not mistaken for an account.
42. As a Customer, I want the hub and cached update summaries offline, so that I can remember Vendors without connectivity.
43. As a Customer, I want cached menus labeled `Last updated…`, so that stale truth is explicit.
44. As a Customer, I want offline menus read-only and checkout blocked, so that stale data cannot create an invalid Order.
45. As a Vendor, I want qualifying changes announced automatically, so that customers can notice them without manual posting.
46. As a Vendor, I want new dishes, meaningful image changes, price changes and restored dishes announced, so that important menu changes reach customers.
47. As a Vendor, I want public branding/profile changes announced, so that customers notice storefront identity changes.
48. As a Vendor, I do not want availability, Stock, Inventory, Order, payment or KDS activity announced, so that operations stay private.
49. As a Vendor, I want changes merged into a rolling 20-minute batch, so that editing does not create a burst of rings.
50. As a Vendor, I want the first change public immediately, so that no delayed job is required.
51. As a Vendor, I want repeated edits consolidated, so that a correction does not create contradictory cards.
52. As a Vendor, I want updates enabled by default, so that the feature works without setup.
53. As a Vendor, I want to disable all updates, so that I can opt out while editing normally.
54. As a Vendor, I want `Don't announce this change` per qualifying save, so that I can suppress a correction.
55. As a Vendor, I want to preview the active batch, so that I know what customers can see.
56. As a Vendor, I want suspended Vendors to publish nothing, so that unavailable storefronts do not attract Orders.
57. As a Vendor, I want aggregate opens and menu visits, so that I understand interest without individual viewers.
58. As a Customer, I do not want Vendors to receive my phone, device identity, saved list or viewer history, so that updates remain private.
59. As an Operator, I want feed reads bounded to supplied stable Vendor IDs, so that they cannot become discovery.
60. As an Operator, I want only public snapshot fields returned, so that private Vendor/customer data cannot leak.
61. As an Operator, I want update writes/reads behind the Store, so that both adapters keep one architecture.

## Implementation Decisions

- Retain the existing root ZanTap manifest identity and `/` scope; change its
  launch URL to the dedicated customer hub. New storefronts link that unified,
  ZanTap-branded manifest. The KDS manifest/identity/scope remain unchanged.
- Keep legacy per-storefront manifest endpoints and identities valid for
  installed-app compatibility, but stop advertising them on new storefront
  renders. Old icons keep launching their Vendor and receive a non-blocking hub
  transition affordance. Browsers cannot be forced to uninstall/replace icons.
- Install acceptance never navigates. The existing arrival-time hint becomes a
  one-time customer invitation unlocked by explicit save, first cart addition,
  checkout start or Order placement. Passive render does nothing. An explicit
  install entry may remain in the hub after automatic dismissal.
- Use one versioned IndexedDB database on the ZanTap origin for saved Vendor
  summaries, stable IDs, current slugs, `lastInteractedAt`, viewed batch
  revisions, analytics-sent markers, cached update summaries and cached menu
  read models. Access goes through one repository interface with an in-memory
  test adapter; direct storage calls are not scattered across components.
- Meaningful actions idempotently upsert the Vendor and update recency. Removal
  deletes its saved/seen/cache state after confirmation. A bounded public
  resolver accepts stable Vendor IDs and returns current public identity, slug,
  active state and presentation fields; it never accepts discovery text.
- The persistent list sorts by interaction recency; search filters only that
  list. Suspended/missing Vendors retain their last-known identity as
  unavailable and recover after later resolution.
- Extend the Store and both adapters with Vendor update settings, batches,
  immutable public snapshot entries and aggregate counters. The server stores
  no customer ID, saved-list membership or individual view event.
- Qualifying types are new dish, dish image change, price change, dish restore
  and public Vendor profile/branding change. Dish name/description-only edits,
  availability/Stock, Inventory, archive, Orders, payment and KDS changes do not
  qualify. Normalized no-op saves never publish.
- Every qualifying mutation carries announce policy. Default is global setting
  (on); `Don't announce this change` suppresses one save. Existing owner-token
  guards remain, and `use server` modules keep async-only exports.
- The first qualifying change publishes immediately. A change within 20 minutes
  of the latest revision updates the batch, increments a monotonic revision and
  advances publication time; later changes start a new batch. Expiry is three
  days after the latest revision.
- Repeated changes for the same subject/type consolidate: retain the first old
  value and latest current value. Each save still increments revision. Snapshot
  fields are minimal: type, stable subject ID, name, image, old/current price
  where relevant, and concise public profile summary.
- A bounded public feed accepts deduplicated saved Vendor IDs and returns
  current public identity/slug, active non-expired batches and live subject
  availability. Suspended Vendors return unavailable identity and no batches.
- Compare server batch revision with local viewed revision for unseen state.
  One ring represents all active batches. Unseen Vendors precede viewed; each
  group is newest-first. The persistent list never reorders from unseen state.
- Mark a revision viewed only after its content renders. Start at newest unseen
  (or newest if all seen), support accessible tap/swipe/keyboard movement, and
  make `Mark all as seen` explicit.
- The viewer shows identity, time, summary, cards and live `View menu`. Resolve
  current availability separately and label unavailable subjects without
  rewriting snapshots.
- Aggregate counters live on batches. The device sends open/menu-visit once per
  batch revision using local sent markers; the server stores no identifier or
  event history, so figures are directional rather than identity/audit data.
- KDS surfaces global on/off, per-save suppression, active-batch preview and
  aggregate counters without changing its PWA behavior.
- Offline uses the same repository for hub/update/menu read models. Cached
  menus show `Last updated…`; cart mutation, Server Actions, Order creation,
  checkout and payment are disabled offline. API/SSE/auth/payment responses
  never enter Cache Storage. The service worker caches only the customer shell
  and approved public assets/read models.
- Storage clearing/device change loses v1 state by design. No login, recovery
  or cross-device merge exists.

## Testing Decisions

- Assert external behavior/contracts, not component internals or Prisma query
  shape. Inject time for batching and expiry.
- Extend the existing Store contract suite across in-memory and opt-in Prisma
  adapters for qualification, suppression, consolidation, revisions, expiry,
  suspension, bounded feeds and counters.
- Add a customer-state repository contract shared by in-memory and IndexedDB
  adapters for idempotent saves, stable-ID slug changes, removal, recency,
  per-revision seen/sent state, migrations and storage failure.
- Extend current pure PWA tests for unified identity/start route, unchanged KDS
  manifest, storefront metadata migration and legacy endpoint compatibility.
- Action tests cover owner-token guards, async-only exports, announce controls
  and excluded operations. Public route tests cover bounds, deduplication,
  missing/suspended behavior, expiry and field allowlists.
- Customer interactions cover all save triggers, passive exclusion, install
  timing/dismissal, search/removal, unavailable/reactivation, tray ordering,
  viewer semantics and live-menu navigation. KDS tests cover setting,
  suppression, preview and counters.
- Offline/service-worker tests cover cached fallback, stale labels, blocked
  checkout and exclusion of API/SSE/payment/authenticated data.
- Browser acceptance at mobile/desktop covers two Vendors, pre-install save,
  install/launch, slug rename, suspension/reactivation, rolling revisions,
  expiry, offline hub/menu, persistence, accessibility, overflow and zero
  console/framework errors.
- Physical-device acceptance covers Android Chrome and iOS where available:
  new unified install, generic-root upgrade behavior, unchanged KDS coexistence
  and a legacy restaurant icon still launching its storefront.
- Migration/deployment/production smoke are a later explicitly authorized gate.
  This planning session performs none of them.

## Out of Scope

- Customer accounts, recovery and cross-device synchronization
- Public discovery, ranking, location search, recommendations or paid placement
- Push notifications, background sync and permission prompts
- Manual Vendor announcements, promotions or status posts
- Identifiable viewers or per-customer Vendor analytics
- Availability/Stock/Inventory announcements or recipe integration
- Automatic uninstall/replacement/redirection of legacy PWA icons
- Any KDS PWA identity/scope/launch change
- Production migration, deployment or smoke in this planning session

## Further Notes

- This supersedes ADR-0059 only for new customer-side storefront installation.
  The separate KDS decision remains active.
- This is a private return surface, not a marketplace. Feed reads start from
  stable Vendor IDs already saved locally.
- Issues 01 and 02 may proceed independently; Issue 03 joins them, and Issue 04
  follows the completed customer read models.
