import { getStore } from "@/lib/store";
import { verifyOwnerToken } from "@/lib/vendor/owner-token";

/**
 * Thrown when a guarded vendor write is attempted without a valid owner token
 * for that specific vendor (ADR-0022). Replaces the retired shared write-secret
 * (WriteSecretError). Distinct from a "vendor not found": a bearer token that
 * does not hash to the vendor's stored `ownerTokenHash` is rejected here.
 */
export class OwnerTokenError extends Error {
  readonly code = "OWNER_TOKEN_INVALID";
  constructor(message = "Invalid or missing owner token") {
    super(message);
    this.name = "OwnerTokenError";
  }
}

/**
 * Reject a guarded write unless `token` matches the owner-token hash stored on
 * the vendor identified by `vendorSlug`. The hash is server-only (never crosses
 * the Store seam onto the domain Vendor) — we read it through the dedicated
 * `getVendorOwnerTokenHash` verb and compare with a timing-safe check. Binding
 * to the slug is what gives per-vendor isolation the shared secret never had.
 */
export async function assertOwnerToken(
  vendorSlug: string,
  token: string | null | undefined
): Promise<void> {
  const hash = await getStore().getVendorOwnerTokenHash(vendorSlug);
  if (!verifyOwnerToken(token, hash)) {
    throw new OwnerTokenError();
  }
}
