import { decodeLocalBlobPathname, getLocalBlob } from "@/lib/menu/local-blob-store";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

/** Serves dev uploads when BLOB_READ_WRITE_TOKEN is not configured. */
export async function GET(_request: Request, context: RouteContext) {
  const { path } = await context.params;
  const pathname = decodeLocalBlobPathname(path);
  const blob = getLocalBlob(pathname);

  if (!blob) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(blob.body), {
    headers: {
      "Content-Type": blob.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
