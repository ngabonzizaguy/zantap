"use client";

import { useEffect, useMemo, useState } from "react";

interface BriefingNoticeProps {
  recipient: string;
  expiresAt: string;
}

function formatRemaining(milliseconds: number): string {
  if (milliseconds <= 0) return "Expired";
  const seconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return days > 0
    ? `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`
    : `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function BriefingNotice({ recipient, expiresAt }: BriefingNoticeProps) {
  const expiry = useMemo(() => new Date(expiresAt).getTime(), [expiresAt]);
  const [remaining, setRemaining] = useState(() => expiry - Date.now());

  useEffect(() => {
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
        <span className="briefing-notice__pulse" aria-hidden />
        <span className="truncate">Prepared for {recipient}</span>
        <span aria-hidden>·</span>
        <time dateTime={expiresAt}>{formatRemaining(remaining)}</time>
      </aside>
      <div className="briefing-watermark" aria-hidden>
        <span>{recipient}</span>
        <span>PRIVATE · ZANTAP BRIEFING</span>
        <span>{new Date(expiresAt).toISOString().slice(0, 10)}</span>
      </div>
    </>
  );
}
