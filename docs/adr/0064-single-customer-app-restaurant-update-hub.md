# ADR-0064 — Single installed customer app with restaurant updates

Date: 2026-08-21
Status: Accepted · not implemented
Supersedes: ADR-0059 customer-storefront install decision only
Preserves: ADR-0059 separate vendor KDS install

## Context

ADR-0059 gives every storefront a restaurant-named manifest and narrow install
scope. That makes a customer install represent one restaurant. The desired
customer experience now spans multiple restaurants: after meaningful
interaction, a customer should retain a private collection of vendors and see
recent menu changes through a familiar status-ring pattern when returning.

Multiple independently installed storefront PWAs are a poor product identity
for that experience and have browser-dependent scope and installation behavior.
The customer side therefore needs one stable application identity. This does
not change the KDS, which remains a separate vendor-facing installed surface.

## Decision

ZanTap will provide one customer PWA installed once and branded ZanTap. The
originating restaurant becomes the first saved restaurant, the install flow
returns to that storefront, and subsequent icon launches open a private `Your
restaurants` hub.

Restaurants enter the collection only through meaningful interaction (save,
cart addition, checkout start, or order), not passive visits. V1 state is
device-local and carries from browser use into installation. Vendors are stored
by stable ID, persist until manual removal, and survive slug changes.

The hub contains:

- an active three-day update tray using unseen and viewed rings;
- a persistent, recently interacted-with restaurant list;
- separate unseen-update and saved-restaurant counts;
- saved-restaurant search, but no marketplace discovery.

One ring represents each vendor. Active batches are viewed newest to oldest,
with the newest unseen batch first. Seen state is per displayed batch, and a
secondary action can mark all updates seen.

Customer updates are automatic, public snapshots of meaningful storefront
changes. New dishes, relevant photos, price changes, restored dishes, and
public profile/branding changes qualify. Operational changes do not. Changes
merge into a 20-minute rolling batch, revisions can reactivate an unseen ring,
and batches expire from the tray after three days. The viewer preserves the
announced snapshot while its CTA resolves current storefront truth.

Vendors may disable customer updates globally, suppress an individual change,
and inspect the active batch. Manual promotional posts are deferred. Analytics
are aggregate-only and push notifications are deferred.

The hub is read-only offline using local/cached restaurant and update data;
checkout continues to require connectivity.

## Consequences

- The customer portion of ADR-0059 must be migrated from vendor-specific app
  identities to one ZanTap customer identity. Existing installed storefronts
  need an explicit compatibility and transition plan in the PRD.
- The vendor KDS manifest, scope, install identity, and operational behavior do
  not change.
- Device-local state minimizes signup friction but does not survive storage
  clearing or follow customers across devices.
- Server-side immutable update snapshots and public batched feed reads are new
  Store concerns. Browser code must not introduce a competing data path.
- The feed request must disclose only already-public storefront information and
  must not turn local saved-vendor state into identifiable tracking.
- The WhatsApp Status pattern is used as interaction vocabulary, not copied
  literally: updates last three days, one vendor ring can contain multiple
  batches, and there is no viewer identity list or push in v1.
- Implementation requires a PRD and isolated issues. No schema migration,
  implementation, deployment, or production validation is part of this ADR
  session.
