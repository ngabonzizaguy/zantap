"use client";

import { useEffect, useRef } from "react";
import type { KdsSnapshot } from "@/lib/kds/types";

/**
 * JSON has no Date type, so `JSON.stringify` on the server turns each
 * `order.createdAt` into an ISO string and `JSON.parse` here leaves it a string.
 * Revive the date fields so the snapshot honors its `Date` typing — otherwise
 * downstream `createdAt.getTime()` calls throw and crash the KDS.
 */
function reviveSnapshot(raw: KdsSnapshot): KdsSnapshot {
  return {
    ...raw,
    orders: raw.orders.map((order) => ({
      ...order,
      createdAt: new Date(order.createdAt),
    })),
  };
}

// First reconnect is near-instant so the planned ~250s server self-close feels
// seamless; genuine outages back off geometrically up to a ceiling so a dead
// backend isn't hammered.
const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 15_000;

/**
 * Subscribes to the vendor KDS SSE stream. The server reads through the Store
 * seam and pushes only when the snapshot fingerprint changes.
 *
 * The stream self-closes just under Vercel's function limit (see the route's
 * MAX_STREAM_MS); we own the reconnect with exponential backoff rather than
 * leaning on the native EventSource retry so a real outage degrades gracefully
 * instead of tight-looping.
 */
export function useKdsLiveSnapshot(
  vendorSlug: string,
  onSnapshot: (snapshot: KdsSnapshot) => void
) {
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  useEffect(() => {
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      source = new EventSource(`/api/vendor/${vendorSlug}/kds-stream`);

      source.onopen = () => {
        attempts = 0;
      };

      source.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data) as KdsSnapshot;
          onSnapshotRef.current(reviveSnapshot(raw));
        } catch {
          // Ignore malformed frames; the stream will send another snapshot soon.
        }
      };

      source.onerror = () => {
        // Fires on the planned self-close and on real drops alike. Close to stop
        // the native retry, then reconnect ourselves with backoff.
        source?.close();
        if (stopped) return;
        const delay = Math.min(
          RECONNECT_BASE_MS * 2 ** attempts,
          RECONNECT_MAX_MS
        );
        attempts += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      source?.close();
    };
  }, [vendorSlug]);
}
