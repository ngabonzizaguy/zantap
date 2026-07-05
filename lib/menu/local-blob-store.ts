import "server-only";

/** Dev-only in-memory blob bytes when BLOB_READ_WRITE_TOKEN is unset. */
const localBlobs = new Map<string, { body: Buffer; contentType: string }>();

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
): { body: Buffer; contentType: string } | null {
  return localBlobs.get(pathname) ?? null;
}

export function deleteLocalBlob(pathname: string): void {
  localBlobs.delete(pathname);
}

/** Decode catch-all route segments back to the stored pathname key. */
export function decodeLocalBlobPathname(segments: string[]): string {
  return segments.map(decodeURIComponent).join("/");
}
