# ADR 0089 — KDS translation control discovery

Date: 2026-09-10
Status: Accepted

The owner requested work on KDS translation control in Ops on a separate branch. Created `codex/kds-translation-control` from local commit `6510df6`; unrelated existing changes are preserved.

Ops edits marketing translations through the authenticated operator API and the Store seam. KDS labels were hard-coded English. The owner selected shared KDS wording management with a language selector in the loaded KDS; this does not set a permanent language on the Vendor record.

## Decision

Reuse `SiteTranslation` with explicitly registered `kds.*` keys. Ops Settings exposes separate Marketing and KDS copy editors. The KDS loads persisted `rw`, `fr`, and `sw` overrides through the Store seam, falls back to registered English copy, and stores the selected interface language in a device cookie.

Translate interface labels only. Vendor-entered names, menu content, order data, identifiers, and machine status values remain unchanged. Switching language must not reload the dashboard or discard working state. An Ops-managed per-Vendor language remains out of scope.

## Consequences

No schema migration or competing data path is required. New KDS interface copy must be added to the registered catalog before Ops can edit it. Saved wording appears after the KDS is refreshed; language switching within that loaded dictionary is immediate.

The owner confirmed on 2026-09-12 that reviewed KDS leftovers—including readiness, guided Setup, and update metrics—must also be editable in Ops. Translation is display-only: persisted expense categories and other machine/domain values retain their canonical English tokens even when the visible label is translated.

Tracking: `.scratch/kds-translation-control/issues/01-ops-kds-translations.md`.
