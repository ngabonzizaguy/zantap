"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function PwaRuntime() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const syncNetworkState = () => setOffline(!navigator.onLine);
    syncNetworkState();
    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);

    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[100] flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-pill border border-on-primary/15 bg-primary/95 px-4 py-2 text-center font-body text-caption text-on-primary shadow-brand-soft"
    >
      <Icon name="wifiOff" size={15} strokeWidth={2} />
      You&apos;re offline. Live data and payments are paused.
    </div>
  );
}
