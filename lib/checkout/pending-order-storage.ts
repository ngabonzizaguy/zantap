import type { Vendor } from "@/lib/types";

const STORAGE_PREFIX = "zantap:pending-checkout:";

export interface PendingCheckoutState {
  orderId: string;
  vendorSlug: string;
  customerPhone: string;
  ussdDial: string;
  orderCreatedAt: string;
  expiresAt: number;
}

function storageKey(vendorSlug: string): string {
  return `${STORAGE_PREFIX}${vendorSlug}`;
}

function readStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function savePendingCheckout(state: PendingCheckoutState): void {
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.setItem(storageKey(state.vendorSlug), JSON.stringify(state));
  } catch {
    // Quota or privacy mode — resume falls back to server phone lookup.
  }
}

export function loadPendingCheckout(
  vendorSlug: string
): PendingCheckoutState | null {
  const storage = readStorage();
  if (!storage) return null;

  const raw = storage.getItem(storageKey(vendorSlug));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingCheckoutState;
    if (parsed.vendorSlug !== vendorSlug) return null;
    if (Date.now() > parsed.expiresAt) {
      clearPendingCheckout(vendorSlug);
      return null;
    }
    return parsed;
  } catch {
    clearPendingCheckout(vendorSlug);
    return null;
  }
}

export function clearPendingCheckout(vendorSlug: string): void {
  const storage = readStorage();
  storage?.removeItem(storageKey(vendorSlug));
}

export function buildPendingCheckoutState(input: {
  orderId: string;
  vendor: Pick<Vendor, "slug">;
  customerPhone: string;
  ussdDial: string;
  orderCreatedAt: Date;
  expiresAt: number;
}): PendingCheckoutState {
  return {
    orderId: input.orderId,
    vendorSlug: input.vendor.slug,
    customerPhone: input.customerPhone,
    ussdDial: input.ussdDial,
    orderCreatedAt: input.orderCreatedAt.toISOString(),
    expiresAt: input.expiresAt,
  };
}
