# ADR-0007: Vercel Blob as menu media storage

Date: 2026-06-23
Status: Accepted

## Context

Vendors need to upload food photos from the KDS. The Store seam must remain the
single persistence path; ad-hoc Supabase Storage SDK usage is out of scope per
`AGENTS.md`. Uploads are abuse-prone and already guarded by `VENDOR_WRITE_SECRET`
(ADR-0009).

## Decision

- Use **`@vercel/blob`** for server-side menu image uploads.
- Env var **`BLOB_READ_WRITE_TOKEN`** on the deployment; documented in
  `.env.example`.
- Upload flow: guarded Server Action validates size/type → Store
  `uploadMenuImageBlob` → `putMenuImageBlob` in `lib/menu/blob-storage.ts` →
  persist CDN `url` + `blobPath` on `MenuImage`.
- **Remove** calls `del` when `blobPath` is set; URL-only images skip Blob delete.
- Limits enforced before put: **5 MB**, `image/jpeg` | `image/png` | `image/webp`.
- When the token is absent (local/tests), blob helpers return deterministic fake
  URLs so contract tests stay offline.

## Consequences

- Media storage is coupled to Vercel Blob for uploaded files; URL-added images
  remain vendor-hosted with no Blob row.
- Production requires `BLOB_READ_WRITE_TOKEN` in Vercel project env before deploy.
- Blob paths use `menu/{vendorSlug}/{itemId}/…` for targeted deletion.
- Store adapters own persistence; Blob I/O stays in server-only helpers, not UI.
