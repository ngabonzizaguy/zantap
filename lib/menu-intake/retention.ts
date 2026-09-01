export const MENU_INTAKE_TRASH_RETENTION_MS = 30 * 24 * 60 * 60_000;

export function menuIntakePurgeAt(deletedAt: Date): Date {
  return new Date(deletedAt.getTime() + MENU_INTAKE_TRASH_RETENTION_MS);
}

export function canPurgeMenuIntake(deletedAt: Date, at: Date): boolean {
  return menuIntakePurgeAt(deletedAt).getTime() <= at.getTime();
}
