/** Ten-minute checkout payment window (ADR-0033). */
export const PAYMENT_WINDOW_MS = 10 * 60 * 1000;

export function isWithinPaymentWindow(
  createdAt: Date,
  now: Date = new Date()
): boolean {
  return now.getTime() - createdAt.getTime() < PAYMENT_WINDOW_MS;
}

export function paymentWindowRemainingMs(
  createdAt: Date,
  now: Date = new Date()
): number {
  return Math.max(0, PAYMENT_WINDOW_MS - (now.getTime() - createdAt.getTime()));
}

export function paymentWindowExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + PAYMENT_WINDOW_MS);
}
