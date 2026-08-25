import "server-only";

interface LocalBlob {
  body: Buffer;
  contentType: string;
}

/**
 * Dev-only blob bytes when BLOB_READ_WRITE_TOKEN is unset. Next can evaluate a
 * Server Action and an API route in separate module graphs, so a module-local
 * Map makes the upload succeed while the serving route returns 404. Anchor the
 * registry on the Node process instead so both graphs share the same bytes.
 */
const localBlobGlobal = globalThis as typeof globalThis & {
  __zantapLocalBlobs?: Map<string, LocalBlob>;
};
const localBlobs =
  localBlobGlobal.__zantapLocalBlobs ??
  (localBlobGlobal.__zantapLocalBlobs = new Map<string, LocalBlob>());

export function putLocalBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): string {
  localBlobs.set(pathname, { body, contentType });
  return `/api/local-blob/${pathname.split("/").map(encodeURIComponent).join("/")}`;
}

export function getLocalBlob(
  pathname: string
): LocalBlob | null {
  return localBlobs.get(pathname) ?? null;
}

export function deleteLocalBlob(pathname: string): void {
  localBlobs.delete(pathname);
}

/** Decode catch-all route segments back to the stored pathname key. */
export function decodeLocalBlobPathname(segments: string[]): string {
  return segments.map(decodeURIComponent).join("/");
}
