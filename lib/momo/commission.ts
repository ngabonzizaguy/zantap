/**
 * Commission fee math + effective-rate resolution (ADR-0096 / grill Q6, Q13, Q21).
 * Pure — no Store/Prisma imports. Fee always rounds **up** to whole RWF.
 */

export type CommissionSettings = {
  id: string;
  /** Master kill: when false, every Vendor pays 0% regardless of per-Vendor flags. */
  globalEnabled: boolean;
  /** Used when a Vendor has Commission on and no custom %. */
  globalDefaultPercent: number;
  /** Smallest cart (RWF) allowed at checkout. */
  minimumOrderTotalRwf: number;
  updatedAt: Date;
};

export type UpdateCommissionSettingsInput = {
  globalEnabled?: boolean;
  globalDefaultPercent?: number;
  minimumOrderTotalRwf?: number;
};

/** Vendor fields that affect Commission resolution. */
export type CommissionVendorInput = {
  commissionEnabled: boolean;
  /** null/undefined → use globalDefaultPercent when enabled. */
  commissionPercent?: number | null;
};

export type CommissionSnapshot = {
  /** Effective % applied (0 when off). */
  percentApplied: number;
  commissionFeeRwf: number;
  vendorPayoutAmountRwf: number;
};

const PERCENT_MAX = 100;

/**
 * Round fee up to whole RWF. `percent` is 0–100 (e.g. 5 = 5%).
 * Examples: 10_000 @ 5% → 500; 1001 @ 5% → 51 (ceil of 50.05).
 */
export function roundCommissionFeeUp(
  totalRwf: number,
  percent: number,
): number {
  if (!Number.isFinite(totalRwf) || totalRwf <= 0) return 0;
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  const clamped = Math.min(PERCENT_MAX, percent);
  return Math.ceil((totalRwf * clamped) / 100);
}

/**
 * Resolve effective Commission for a Vendor under current settings.
 * Global off → 0. Vendor off → 0. Else custom % or global default.
 */
export function resolveEffectiveCommissionPercent(
  settings: Pick<CommissionSettings, "globalEnabled" | "globalDefaultPercent">,
  vendor: CommissionVendorInput,
): number {
  if (!settings.globalEnabled) return 0;
  if (!vendor.commissionEnabled) return 0;
  const raw =
    vendor.commissionPercent != null && Number.isFinite(vendor.commissionPercent)
      ? vendor.commissionPercent
      : settings.globalDefaultPercent;
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(PERCENT_MAX, raw);
}

/** Freeze fee + Vendor payout for an Order total at payment time. */
export function computeCommissionSnapshot(
  totalRwf: number,
  settings: Pick<CommissionSettings, "globalEnabled" | "globalDefaultPercent">,
  vendor: CommissionVendorInput,
): CommissionSnapshot {
  const percentApplied = resolveEffectiveCommissionPercent(settings, vendor);
  const commissionFeeRwf = roundCommissionFeeUp(totalRwf, percentApplied);
  const vendorPayoutAmountRwf = Math.max(0, totalRwf - commissionFeeRwf);
  return { percentApplied, commissionFeeRwf, vendorPayoutAmountRwf };
}

/** Clamp Ops percent input; reject non-finite / negative. */
export function normalizeCommissionPercent(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Commission percent must be a non-negative number");
  }
  return Math.min(PERCENT_MAX, Math.round(value * 100) / 100);
}

/** Clamp minimum order; must be a positive integer RWF. */
export function normalizeMinimumOrderTotalRwf(value: number): number {
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("Minimum order total must be at least 1 RWF");
  }
  return Math.floor(value);
}

export const DEFAULT_COMMISSION_SETTINGS: Omit<CommissionSettings, "updatedAt"> =
  {
    id: "default",
    globalEnabled: false,
    globalDefaultPercent: 0,
    minimumOrderTotalRwf: 1000,
  };
