import { canonicalizePhone } from "@/lib/format";
import { normalizeMomoPayoutPhoneForStorage } from "@/lib/momo/ussd-dial";
import { getStore } from "@/lib/store";
import type {
  OperatorUpdateVendorInput,
  OperatorVendorDetail,
  Vendor,
  VendorListEntry,
  VendorListFilters,
} from "@/lib/types";
import { isValidVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import { auditOperatorAction } from "@/lib/operator-control/audit";

function momoCodeValidationError(payoutMethod: "MERCHANT_CODE" | "PHONE"): string {
  return payoutMethod === "PHONE"
    ? "A valid MoMo payout phone number is required"
    : "MoMo merchant code must be exactly 6 digits";
}

export async function listOperatorVendors(
  filters?: VendorListFilters
): Promise<VendorListEntry[]> {
  return getStore().listVendors(filters);
}

export async function getOperatorVendor(
  slug: string
): Promise<OperatorVendorDetail | null> {
  return getStore().getOperatorVendorDetail(slug);
}

export async function suspendOperatorVendor(
  slug: string,
  reason?: string
): Promise<Vendor | null> {
  const store = getStore();
  const existing = await store.getVendorBySlug(slug);
  if (!existing) return null;

  const updated = await store.setVendorActive(slug, false, reason);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: existing.id,
    action: "SUSPEND",
    detail: { reason: reason ?? null, slug },
  });
  return updated;
}

export async function reactivateOperatorVendor(
  slug: string
): Promise<Vendor | null> {
  const store = getStore();
  const existing = await store.getVendorBySlug(slug);
  if (!existing) return null;

  const updated = await store.setVendorActive(slug, true);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: existing.id,
    action: "REACTIVATE",
    detail: { slug },
  });
  return updated;
}

export async function patchOperatorVendor(
  slug: string,
  input: OperatorUpdateVendorInput
): Promise<Vendor | null> {
  const store = getStore();
  const existing = await store.getVendorBySlug(slug);
  if (!existing) return null;

  const payload: OperatorUpdateVendorInput = { ...input };

  if (input.slug !== undefined) {
    const normalizedNewSlug = normalizeVendorSlug(input.slug);
    if (!normalizedNewSlug || !isValidVendorSlug(input.slug)) {
      throw new Error(
        "Storefront URL must use lowercase letters, numbers, and hyphens only"
      );
    }
    if (
      normalizedNewSlug !== existing.slug &&
      !(await store.isSlugAvailable(normalizedNewSlug))
    ) {
      throw new Error("This storefront URL is already taken");
    }
    payload.slug = normalizedNewSlug;
  }

  if (input.phoneNumber !== undefined) {
    const normalizedPhone = canonicalizePhone(input.phoneNumber);
    if (normalizedPhone.length < 10) {
      throw new Error("A valid phone number is required");
    }
    payload.phoneNumber = normalizedPhone;
  }

  if (input.momoCode !== undefined) {
    const payoutMethod = input.payoutMethod ?? existing.payoutMethod;
    if (payoutMethod === "PHONE") {
      const localPhone = normalizeMomoPayoutPhoneForStorage(input.momoCode);
      if (!localPhone) {
        throw new Error(momoCodeValidationError("PHONE"));
      }
      payload.momoCode = localPhone;
    } else {
      const merchantCode = input.momoCode.trim();
      if (!/^\d{6}$/.test(merchantCode)) {
        throw new Error(momoCodeValidationError("MERCHANT_CODE"));
      }
      payload.momoCode = merchantCode;
    }
  }

  const updated = await store.operatorUpdateVendor(slug, payload);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: existing.id,
    action: "PROFILE_OVERRIDE",
    detail: { slug, fields: Object.keys(input) },
  });
  return updated;
}

export async function revokeOperatorOwnerToken(
  slug: string
): Promise<Vendor | null> {
  const store = getStore();
  const existing = await store.getVendorBySlug(slug);
  if (!existing) return null;

  const updated = await store.operatorRevokeOwnerToken(slug);
  if (!updated) return null;

  await auditOperatorAction({
    vendorId: existing.id,
    action: "TOKEN_REVOKE",
    detail: { slug },
  });
  return updated;
}

export async function reissueOperatorOwnerToken(slug: string): Promise<{
  ownerToken: string;
} | null> {
  const store = getStore();
  const existing = await store.getVendorBySlug(slug);
  if (!existing) return null;

  const result = await store.operatorReissueOwnerToken(slug);
  if (!result) return null;

  await auditOperatorAction({
    vendorId: existing.id,
    action: "TOKEN_REISSUE",
    detail: { slug },
  });
  return result;
}
