# ADR-0062: KDS order pagination preserves later-page stability

Status: Accepted · DONE · deployed 2026-08-20 · prod-smoked 2026-08-21

## Decision

Live KDS Orders filter and sort the Store-backed SSE snapshot before presenting
ten tickets per page. The URL owns the active tab, stage filter, sort direction
and page. Filter or sort changes return to page 1; result shrinkage clamps to the
last valid page. Bulk selection and mutations are derived only from the visible
page and clear whenever that page changes.

When a snapshot introduces previously unseen order IDs while the vendor is past
page 1, those IDs are temporarily excluded from later-page pagination and a
polite new-order notice is shown. Existing ticket status changes still apply
immediately, including removal from a stage filter and backward page clamping.
Choosing the notice clears the deferred set, restores newest-first sorting and
opens page 1, where the new work is visible.

Order History remains a Store-filtered server read rather than joining the live
SSE payload. It requests ten rows per page and URL-backs its date preset/custom
range, order status, payment status, search and page. An out-of-range result is
clamped and fetched again at the valid page.

## Consequences

- Realtime snapshots remain bounded to the existing KDS queue seam; no second
  browser data path or database migration is introduced.
- A later page stays stable for new arrivals, while status changes to existing
  tickets remain realtime and may legitimately change that page.
- The new-order notice is session-local; reloading reconstructs the canonical
  queue from the URL and current snapshot.
- History exports remain unpaginated and continue to use their existing guarded
  export path; only the visible History list changes to ten records.
- The combined production release is complete. The final single-run harness
  passed Live Orders page two/Previous and History page two/invalid-page
  clamping; fixture cleanup and exact-deployment error/fatal/5xx scans were
  clean. No migration repeat or redeploy was required for closeout.
- Release closeout `7028e5b` was later fast-forwarded to `main` and deployed as
  `dpl_874DQNUcV2fG7eXsbtLeFTqdeJJd` on 2026-08-21. KDS route checks and the
  initial exact-deployment error scan passed; neither migration nor production
  harness was repeated.
