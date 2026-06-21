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
