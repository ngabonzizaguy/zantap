import { getStore } from "@/lib/store";
import type { VendorUpdateCounter } from "@/lib/vendor-updates/types";

interface RouteContext {
  params: Promise<{ batchId: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { batchId } = await params;
  const body = (await request.json().catch(() => null)) as {
    kind?: VendorUpdateCounter;
  } | null;
  if (!body || (body.kind !== "open" && body.kind !== "menuVisit")) {
    return Response.json({ error: "Invalid analytics kind" }, { status: 400 });
  }

  const batch = await getStore().incrementVendorUpdateCounter(batchId, body.kind);
  return new Response(null, {
    status: batch ? 204 : 404,
    headers: { "Cache-Control": "private, no-store" },
  });
}
