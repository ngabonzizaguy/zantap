import type { PayoutMethod } from "@/lib/types";

/**
 * All the data the onboarding wizard collects across its steps, held in one
 * object by {@link OnboardWizard}. Split into typed slices when handed to steps.
 */
export interface WizardData {
  // Business essentials
  name: string;
  slug: string;
  countryDialCode: string;
  phoneLocal: string;
  businessCategory: string;

  // Payments
  payoutMethod: PayoutMethod;
  merchantCode: string;
  payoutPhone: string;

  // First dish
  dishName: string;
  dishPriceRwf: string;
  dishCategory: string;
  dishPhoto: File | null;
}

export type WizardStep =
  | "splash"
  | "business"
  | "payments"
  | "menu"
  | "review"
  | "live";
