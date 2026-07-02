/**
 * Static option lists for the self-serve onboarding wizard (Issue 3). Plain
 * module (no "use server") so both client steps and the review screen can read
 * them. Kept intentionally small; the "real modifiers"/category epic can expand
 * these later.
 */

export const BUSINESS_CATEGORIES = [
  "Grill / Steakhouse",
  "Restaurant",
  "Café / Coffee",
  "Bakery",
  "Fast Food",
  "Pizzeria",
  "Bar / Lounge",
  "Groceries",
  "Other",
] as const;

export const MENU_CATEGORIES = [
  "Main Course",
  "Starters",
  "Sides",
  "Drinks",
  "Desserts",
  "General",
] as const;

/** Default menu category persisted by provisionVendor's starter item. */
export const DEFAULT_MENU_CATEGORY = "General";

export interface CountryOption {
  code: string;
  label: string;
  dialCode: string;
  flag: string;
}

/**
 * Phone country picker options. Rwanda first (the launch market); a short list
 * of neighbours + common diaspora codes so the picker is useful without being a
 * full ISO catalogue.
 */
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "RW", label: "Rwanda", dialCode: "+250", flag: "🇷🇼" },
  { code: "KE", label: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "UG", label: "Uganda", dialCode: "+256", flag: "🇺🇬" },
  { code: "TZ", label: "Tanzania", dialCode: "+255", flag: "🇹🇿" },
  { code: "BI", label: "Burundi", dialCode: "+257", flag: "🇧🇮" },
  { code: "CD", label: "DR Congo", dialCode: "+243", flag: "🇨🇩" },
  { code: "US", label: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", label: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
];

export const DEFAULT_COUNTRY = COUNTRY_OPTIONS[0];

export const DIAL_CODE_SELECT_OPTIONS = COUNTRY_OPTIONS.map((country) => ({
  value: country.dialCode,
  label: `${country.flag} ${country.dialCode}`,
}));
