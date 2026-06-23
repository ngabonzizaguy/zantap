# ADR-0009: Deferred-auth write-secret guardrail

Date: 2026-06-23
Status: Accepted

## Context

Real vendor authentication is explicitly out of scope (separate grill per
`AGENTS.md`). The KDS remains open for reads so kitchen staff can view live
orders without login. Menu mutations, media uploads, and data export are
abuse-prone if left entirely unauthenticated.

## Decision

- Env var `VENDOR_WRITE_SECRET` holds a long random shared secret (one per
  deployment; not per-vendor until real auth lands).
- Guarded Server Actions accept `writeSecret: string` as the **first** argument;
  `assertWriteSecret` in `lib/vendor/write-secret.ts` compares to the env value
  and throws `WriteSecretError` when missing or wrong.
- Client hook `useWriteSecret()` persists the secret in `localStorage`
  (`zantap:vendor-write-secret`). KDS shows a one-time prompt (key icon) to
  enter it.
- **Reads stay open:** `loadKdsSnapshot`, `loadArchivedMenu`, `loadMenuCategories`,
  availability toggle, kitchen toggle, order status advances.
- **Guarded in this batch:** menu CRUD (`lib/actions/vendor-menu.ts`); media and
  export actions follow the same pattern in Issues 02–04.

## Consequences

- Operators share the secret offline with trusted vendor staff; rotation requires
  updating env + re-entering in KDS clients.
- Wrong/missing secret fails fast with a typed error; no partial mutations.
- `"use server"` modules export **only** async functions — no type re-exports
  (production `ReferenceError` lesson from known-issue 0002).
- Per-vendor tokens arrive with a future auth PRD; this pattern is intentionally
  minimal.
