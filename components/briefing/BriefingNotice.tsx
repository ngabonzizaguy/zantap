"use client";

import { useEffect, useMemo, useState } from "react";

interface BriefingNoticeProps {
  recipient: string;
  expiresAt: string;
}

function formatRemaining(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const clock = [hours, minutes, secs]
    .map((part) => part.toString().padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}:${clock}` : clock;
}

export function BriefingNotice({ recipient, expiresAt }: BriefingNoticeProps) {
  const expiry = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    setRemaining(expiry - Date.now());
    const timer = window.setInterval(() => {
      const next = expiry - Date.now();
      setRemaining(next);
      if (next <= 0) {
        window.clearInterval(timer);
        window.location.reload();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expiry]);

  return (
    <>
      <aside className="briefing-notice" aria-label="Confidential viewer notice">
        <time
          dateTime={expiresAt}
          aria-label={`Access time remaining: ${formatRemaining(remaining)}`}
        >
          {formatRemaining(remaining)}
        </time>
      </aside>
      <div className="briefing-watermark" aria-hidden>
        <span>{recipient}</span>
        <span>PRIVATE · ZANTAP BRIEFING</span>
        <span>{new Date(expiresAt).toISOString().slice(0, 10)}</span>
      </div>
    </>
  );
}
