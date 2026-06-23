import "server-only";

import { del, put } from "@vercel/blob";

/** Server-side Vercel Blob put for menu media (ADR-0007). */
export async function putMenuImageBlob(
  pathname: string,
  body: Buffer,
  contentType: string
): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return {
      url: `https://blob.local/${pathname}`,
      pathname,
    };
  }

  const blob = await put(pathname, body, {
    access: "public",
    contentType,
    token,
  });
  return { url: blob.url, pathname: blob.pathname };
}

/** Deletes a stored blob when a MenuImage row with blobPath is removed. */
export async function deleteMenuImageBlob(pathname: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;
  await del(pathname, { token });
}
