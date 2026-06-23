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

/**
 * Subscribes to the vendor KDS SSE stream. The server reads through the Store
 * seam and pushes only when the snapshot fingerprint changes.
 */
export function useKdsLiveSnapshot(
  vendorSlug: string,
  onSnapshot: (snapshot: KdsSnapshot) => void
) {
  const onSnapshotRef = useRef(onSnapshot);
  onSnapshotRef.current = onSnapshot;

  useEffect(() => {
    const source = new EventSource(`/api/vendor/${vendorSlug}/kds-stream`);

    source.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as KdsSnapshot;
        onSnapshotRef.current(reviveSnapshot(raw));
      } catch {
        // Ignore malformed frames; the stream will send another snapshot soon.
      }
    };

    return () => source.close();
  }, [vendorSlug]);
}
