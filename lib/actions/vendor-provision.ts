"use server";

import { normalizePhone, phonesMatchForRecovery } from "@/lib/format";
import { normalizeMomoPayoutPhoneForStorage } from "@/lib/momo/ussd-dial";
import { getStore } from "@/lib/store";
import type { CreateVendorInput, MenuItem, Vendor } from "@/lib/types";
import { mintOwnerToken, verifyOwnerToken } from "@/lib/vendor/owner-token";
import { assertProvisioningOpen } from "@/lib/vendor/provision-gate";
import {
  validateProvisionVendorInput,
  validateStarterItemInput,
} from "@/lib/vendor/provision-validation";
import { enforceRateLimit } from "@/lib/vendor/rate-limit";
import { normalizeVendorSlug } from "@/lib/vendor/slug";

// NOTE: export only async server actions — no type re-exports (AGENTS.md).

// Gate-free public actions (ADR-0022) — coarse in-process caps to blunt abuse.
const PROVISION_LIMIT = 10;
const PROVISION_WINDOW_MS = 60_000;
const RECOVERY_LIMIT = 5;
const RECOVERY_WINDOW_MS = 60_000;

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const normalized = normalizeVendorSlug(slug);
  if (!normalized) return false;
  return getStore().isSlugAvailable(normalized);
}

/**
 * Validate a device-cached owner capability before the KDS presents editing as
 * unlocked. A stale token is expected after recovery, revocation, or a local
 * in-memory Store reset, so this returns a boolean instead of throwing.
 */
export async function validateOwnerAccess(
  slug: string,
  ownerToken: string | null | undefined
): Promise<boolean> {
  const normalizedSlug = normalizeVendorSlug(slug);
  if (!normalizedSlug || !ownerToken) return false;
  const hash = await getStore().getVendorOwnerTokenHash(normalizedSlug);
  return verifyOwnerToken(ownerToken, hash);
}

/**
 * Self-serve vendor provisioning (ADR-0022). Gate-free: no provision secret is
 * required — an optional env kill-switch (`PROVISION_KILL_SWITCH`) can close
 * signup, and a coarse rate limit blunts spam. Mints a per-vendor owner token,
 * persists only its hash via `createVendor`, and returns the plaintext EXACTLY
 * ONCE so the browser can cache it (keyed by slug, never typed).
 */
export async function provisionVendor(
  input: CreateVendorInput,
  starterItem?: { name: string; priceRwf: number }
): Promise<{ vendor: Vendor; menuItem?: MenuItem; ownerToken: string }> {
  assertProvisioningOpen();
  enforceRateLimit("provision", PROVISION_LIMIT, PROVISION_WINDOW_MS);

  const validationError = validateProvisionVendorInput(input);
  if (validationError) {
    throw new Error(validationError);
  }

  if (starterItem) {
    const starterError = validateStarterItemInput(starterItem);
    if (starterError) {
      throw new Error(starterError);
    }
  }

  const normalizedSlug = normalizeVendorSlug(input.slug);
  const store = getStore();

  if (!(await store.isSlugAvailable(normalizedSlug))) {
    throw new Error("This storefront URL is already taken");
  }

  const { token: ownerToken, hash: ownerTokenHash } = mintOwnerToken();

  const payoutMethod = input.payoutMethod ?? "MERCHANT_CODE";
  const momoCodeRaw = input.momoCode.trim();
  const momoCode =
    payoutMethod === "PHONE"
      ? normalizeMomoPayoutPhoneForStorage(momoCodeRaw)!
      : momoCodeRaw;

  const vendor = await store.createVendor({
    ...input,
    name: input.name.trim(),
    slug: normalizedSlug,
    phoneNumber: normalizePhone(input.phoneNumber),
    momoCode,
    tagline: input.tagline?.trim() || undefined,
    location: input.location?.trim() || undefined,
    deliveryTime: input.deliveryTime?.trim() || undefined,
    businessCategory: input.businessCategory?.trim() || undefined,
    payoutMethod,
    ownerTokenHash,
  });

  let menuItem: MenuItem | undefined;
  if (starterItem) {
    menuItem = await store.createMenuItem(normalizedSlug, {
      name: starterItem.name.trim(),
      priceRwf: starterItem.priceRwf,
      category: "General",
    });
  }

  return { vendor, menuItem, ownerToken };
}

/**
 * Non-halting phone-based owner-token recovery (ADR-0022, decision 9). Matches
 * the storefront slug + signup phone; on match, IMMEDIATELY re-issues a fresh
 * owner token (never blocking the vendor), records a recovery event for the
 * future admin panel (#17), and returns the plaintext once. No OTP. Returns a
 * generic `{ ok: false }` on any miss so callers cannot enumerate slugs/phones.
 */
export async function recoverOwnerToken(
  slug: string,
  phoneNumber: string
): Promise<{ ok: true; ownerToken: string } | { ok: false }> {
  const normalizedSlug = normalizeVendorSlug(slug);
  enforceRateLimit(
    `recover:${normalizedSlug || "unknown"}`,
    RECOVERY_LIMIT,
    RECOVERY_WINDOW_MS
  );

  if (!normalizedSlug) return { ok: false };

  const store = getStore();
  const vendor = await store.getVendorBySlug(normalizedSlug);
  if (!vendor) return { ok: false };

  if (!phonesMatchForRecovery(vendor.phoneNumber, phoneNumber)) {
    return { ok: false };
  }

  const { token: ownerToken, hash: ownerTokenHash } = mintOwnerToken();
  await store.setVendorOwnerToken(normalizedSlug, ownerTokenHash);
  await store.recordRecoveryEvent({
    vendorId: vendor.id,
    context: "phone-recovery",
  });

  return { ok: true, ownerToken };
}
