const DRIVER_HUES = ["#F5945F", "#A78FE0", "#79B7E0", "#6BCB9A", "#E07A7A"];

export function deriveDriverInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function deriveDriverHue(existingCount: number): string {
  return DRIVER_HUES[existingCount % DRIVER_HUES.length] ?? DRIVER_HUES[0];
}

export function normalizeDriverName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}
