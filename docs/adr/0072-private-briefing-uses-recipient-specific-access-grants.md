---
status: accepted
---

# Private briefing uses recipient-specific Access grants

The private ZanTap presentation will use a separately generated Access grant
for every intended recipient instead of shared group passwords. Each grant has
its own secret, human-readable recipient label, expiry, revocation state, and
view history so Ops can end access independently and make embedded watermarking
meaningfully attributable. This adds grant-management work compared with one
campaign password, but shared credentials would undermine leak investigation,
selective revocation, and recipient accountability.

Grant expiry is authoritative even during an open viewing session. When the
countdown reaches zero, the protected presentation is replaced immediately by
a graceful expired-access surface with a way to request renewal; an already-open
tab does not extend the grant.

Each authorized view carries a low-contrast abstract fingerprint derived from
its grant and a restrained, repositioning human-readable mark containing the
recipient label, short grant code, and current time. This intentionally trades
some visual purity and recipient privacy for meaningful attribution and sharing
deterrence; the mark must remain legible in a captured image without dominating
the presentation.

One Access grant may authorize at most two active Viewing sessions, supporting
a recipient's phone and computer without making a shared secret effectively
unlimited. A third browser is denied until Ops revokes an existing session or
resets the grant; Ops can inspect and revoke sessions independently.

Each new Viewing session must accept a one-time Viewer acknowledgement naming
the recipient, expiry, and no-recording/no-redistribution expectation. After
entry, that card collapses into the persistent abstract recipient/countdown
notice; it does not interrupt returns within the same active session.

An Access-grant secret is shown in plaintext exactly once at creation/reset and
included in the Operator's Share kit. ZanTap stores only a slow password hash;
Ops cannot reveal an existing secret. Reset generates a replacement and
immediately invalidates the old secret and every active Viewing session.

## Amendment — shared four-digit PIN entry — 2026-09-01

The owner has deliberately changed the access trade-off: new and reset grants
use a four-digit numeric PIN generated in Ops, and every person who knows an
active PIN may open a Viewing session. The earlier two-active-session ceiling is
removed. Grant expiry, revocation, version pinning, acknowledgement, watermark
and per-session activity remain authoritative.

The PIN input is always present, including on expired or unavailable legacy
preview states. Those states provide context but cannot replace the credential
form. PIN allocation checks for lookup collisions, unlock attempts are
rate-limited by a privacy-limited request fingerprint, and only the existing
slow hash is stored. Legacy long secrets continue to verify until their grant is
reset so this change does not strand an already-issued recipient.

## Four-digit PIN release status — 2026-09-01

The amendment is live from exact HEAD `5bd7d87` in Vercel Production deployment
`dpl_5kvk1NEtjwtgK66oMBKmn3n5TFbv`, READY on `zantap.app`. Live read-only smoke
confirmed the four-digit PIN gate and the owner-approved `Private viewing` label;
the exact-deployment error, fatal, warning and HTTP-500 scans were empty.
