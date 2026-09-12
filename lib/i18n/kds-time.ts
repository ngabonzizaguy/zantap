import type { KdsTranslate } from "@/lib/i18n/kds-localize";

export function formatKdsRelativeTime(t: KdsTranslate, value: Date | string | null | undefined, now = new Date()): string {
  const date = value ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) return t("kds.time.just-now");
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return t("kds.time.just-now");
  if (minutes < 60) return t("kds.time.minutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t(hours === 1 ? "kds.time.hour" : "kds.time.hours", { count: hours });
  const startOfToday = new Date(now);
  const startOfDay = new Date(date);
  startOfToday.setHours(0, 0, 0, 0);
  startOfDay.setHours(0, 0, 0, 0);
  const days = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);
  if (days === 1) return t("kds.time.yesterday");
  if (days < 7) return t("kds.time.days", { count: days });
  return t("kds.time.date", { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() });
}
