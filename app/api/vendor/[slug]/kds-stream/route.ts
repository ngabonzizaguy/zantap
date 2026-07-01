import { fetchKdsSnapshot, fetchKdsSnapshotRevision } from "@/lib/kds/snapshot";
import { fingerprintKdsSnapshot } from "@/lib/kds/fingerprint";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

// Vercel kills a function at its max duration. We claim the full window so the
// self-close margin below is deterministic instead of riding on the plan default.
export const maxDuration = 300;

const POLL_MS = 1_000;
const HEARTBEAT_MS = 15_000;
// Close the stream ourselves comfortably before Vercel's hard kill. A clean
// controller.close() lets the function RETURN (no "Task timed out" logged); the
// browser EventSource then reconnects via the backoff in useKdsLiveSnapshot.
const MAX_STREAM_MS = 250_000;

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
      let lastRevision = "";

      const pushIfChanged = async () => {
        if (closed) return;
        const revision = await fetchKdsSnapshotRevision(slug);
        if (revision === lastRevision) return;

        const snapshot = await fetchKdsSnapshot(slug);
        lastRevision = fingerprintKdsSnapshot(snapshot);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(snapshot)}\n\n`)
        );
      };

      const sendHeartbeat = () => {
        if (closed) return;
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      };

      // Declared up front so every exit path (initial read, poll error, abort,
      // planned self-close) routes through one idempotent cleanup.
      let pollTimer: ReturnType<typeof setInterval>;
      let heartbeatTimer: ReturnType<typeof setInterval>;
      let lifetimeTimer: ReturnType<typeof setTimeout>;

      const teardown = () => {
        if (closed) return;
        closed = true;
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
        clearTimeout(lifetimeTimer);
        controller.close();
      };

      try {
        await pushIfChanged();
      } catch {
        closed = true;
        controller.close();
        return;
      }

      pollTimer = setInterval(() => {
        void pushIfChanged().catch(teardown);
      }, POLL_MS);

      heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);

      // Planned self-close before the platform limit → function returns normally.
      lifetimeTimer = setTimeout(teardown, MAX_STREAM_MS);

      request.signal.addEventListener("abort", teardown);
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
