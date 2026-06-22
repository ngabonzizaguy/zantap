import { fetchKdsSnapshot } from "@/lib/kds/snapshot";
import { fingerprintKdsSnapshot } from "@/lib/kds/fingerprint";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

const POLL_MS = 1_000;
const HEARTBEAT_MS = 15_000;

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const vendor = await getStore().getVendorBySlug(slug);
  if (!vendor) {
    return new Response("Not found", { status: 404 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      let lastFingerprint = "";

      const pushIfChanged = async () => {
        if (closed) return;
        const snapshot = await fetchKdsSnapshot(slug);
        const fingerprint = fingerprintKdsSnapshot(snapshot);
        if (fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
          );
        }
      };

      const sendHeartbeat = () => {
        if (closed) return;
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      };

      try {
        await pushIfChanged();
      } catch {
        closed = true;
        controller.close();
        return;
      }

      const pollTimer = setInterval(() => {
        void pushIfChanged().catch(() => {
          closed = true;
          clearInterval(pollTimer);
          clearInterval(heartbeatTimer);
          controller.close();
        });
      }, POLL_MS);

      const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
