/**
 * Marketing site settings — Ops-editable footer contacts and socials.
 * Singleton row id is always "default".
 */

export interface MarketingSiteSettings {
  id: string;
  publicPhone?: string;
  publicEmail?: string;
  socialX?: string;
  socialTiktok?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialYoutube?: string;
  socialWhatsapp?: string;
  updatedAt: Date;
}

export interface UpdateMarketingSiteSettingsInput {
  publicPhone?: string | null;
  publicEmail?: string | null;
  socialX?: string | null;
  socialTiktok?: string | null;
  socialInstagram?: string | null;
  socialFacebook?: string | null;
  socialLinkedin?: string | null;
  socialYoutube?: string | null;
  socialWhatsapp?: string | null;
}

export interface VendorExpense {
  id: string;
  vendorId: string;
  amountRwf: number;
  category: string;
  note?: string;
  spentAt: Date;
  createdAt: Date;
}

export interface CreateVendorExpenseInput {
  amountRwf: number;
  category: string;
  note?: string;
  spentAt?: Date;
}

export interface VendorFeatureFlags {
  featureWhatsappNotify: boolean;
  featureStockTracking: boolean;
  featureProfitInsights: boolean;
}

export interface UpdateVendorFeatureFlagsInput {
  featureWhatsappNotify?: boolean;
  featureStockTracking?: boolean;
  featureProfitInsights?: boolean;
}

export interface ProfitSnapshot {
  todayGrossRwf: number;
  weekdayAverageRwf: number;
  /** -1..1 relative to weekday average; used for glow color. */
  glowScore: number;
  periodRevenueRwf: number;
  periodExpensesRwf: number;
  periodCostOfGoodsRwf: number;
  periodProfitRwf: number;
  itemMargins: Array<{
    menuItemId: string;
    name: string;
    soldQty: number;
    revenueRwf: number;
    costRwf: number;
    marginRwf: number;
    marginPct: number | null;
  }>;
}
