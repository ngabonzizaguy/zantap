"use client";

import { useEffect, useRef } from "react";
import type { KdsSnapshot } from "@/lib/kds/types";

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
        const snapshot = JSON.parse(event.data) as KdsSnapshot;
        onSnapshotRef.current(snapshot);
      } catch {
        // Ignore malformed frames; the stream will send another snapshot soon.
      }
    };

    return () => source.close();
  }, [vendorSlug]);
}
