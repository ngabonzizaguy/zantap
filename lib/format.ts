export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-US")} RWF`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function orderDisplayId(id: string): string {
  const short = id.replace(/\D/g, "").slice(-4) || id.slice(-4);
  return `#${short.padStart(4, "0")}`;
}

export function minutesAgo(date: Date): number {
  return Math.max(1, Math.floor((Date.now() - date.getTime()) / 60000));
}

export type PaidAgeUrgency = "normal" | "warning" | "critical";

/** Human-readable relative label anchored on `paidAt` (KDS queue aging). */
export function formatRelativeTime(
  paidAt: Date | undefined | null,
  now: Date = new Date()
): string {
  if (!paidAt) return "Just now";

  const diffMs = now.getTime() - paidAt.getTime();
  if (diffMs < 60_000) return "Just now";

  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hr${diffHrs === 1 ? "" : "s"} ago`;

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfPaidDay = new Date(paidAt);
  startOfPaidDay.setHours(0, 0, 0, 0);
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfPaidDay.getTime()) / 86_400_000
  );

  if (dayDiff === 1) return "Yesterday";
  if (dayDiff < 7) return `${dayDiff} days ago`;

  return paidAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Urgency tier from minutes since payment (<10 normal, 10–20 warning, 20+ critical). */
export function getPaidAgeUrgency(
  paidAt: Date | undefined | null,
  now: Date = new Date()
): PaidAgeUrgency {
  if (!paidAt) return "normal";
  const minutes = Math.floor((now.getTime() - paidAt.getTime()) / 60_000);
  if (minutes < 10) return "normal";
  if (minutes < 20) return "warning";
  return "critical";
}

export function formatKitchenStageLabel(
  stage: string | undefined | null
): string {
  if (!stage) return "NEW";
  return stage.replace(/_/g, " ");
}
