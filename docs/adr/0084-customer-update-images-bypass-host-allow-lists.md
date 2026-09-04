# ADR-0084 — Customer update images bypass optimizer host allow-lists

Date: 2026-09-04
Status: Accepted · implemented, verified and owner-tested green · not released
Amends: ADR-0064 customer update rendering

## Context

The customer update feed contains immutable public snapshots of Vendor branding
and menu changes. Their image URLs can be same-origin local-upload routes or
absolute public HTTPS URLs from Vercel Blob and other approved Vendor media
hosts. The set of public hosts is data, not build-time application configuration.

`RestaurantUpdates` rendered its logo and entry media with `next/image`. Next's
default loader requires every absolute hostname to be configured at build time,
so a valid public Blob URL from an unlisted store crashed `/restaurants` before
the browser could request it. Allow-listing the one observed Blob hostname would
leave the same failure mode for the next approved CDN or Blob store. Native
images already used elsewhere on the hub avoided that exception but displayed a
broken-image icon when an object was missing or expired.

## Decision

Dynamic public images on `/restaurants` render through one client component
outside the Next image optimizer. The component accepts:

- root-relative same-origin paths, including `/api/local-blob/...`;
- absolute `https:` URLs without embedded credentials.

It rejects protocol-relative, insecure HTTP, data, script, malformed and
credential-bearing URLs. Approved URLs are requested directly by the browser
with lazy loading, async decoding and no referrer. Each render supplies a stable
fallback: Vendor initials for logos and an accessible, fixed-ratio unavailable
panel for update media. A failed source remains replaced until its `src` changes.

The update tray, update viewer and saved-restaurant card share this renderer.
Static application assets remain on `next/image`; `next.config.mjs` does not gain
a wildcard or provider-specific hostname rule.

## Consequences

- Any approved public HTTPS Vendor image can render without a rebuild or a new
  hostname entry, so the feed is not coupled to one Blob store.
- Missing or expired objects degrade within their allocated layout instead of
  crashing the route or exposing the browser's broken-image icon.
- These dynamic images do not receive Next image optimization. Their public
  source is responsible for suitable dimensions and delivery; the browser keeps
  loading lazy and layout dimensions remain explicit.
- The browser, rather than a ZanTap image proxy, requests the public URL. The
  no-referrer policy avoids disclosing the ZanTap page URL to that host.
- This is a local bug fix only. It does not change persistence, migrations,
  Candidate #29 Stage 2, production configuration or deployment state.
