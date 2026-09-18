import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js/max";

export interface LeadPhoneCountry {
  code: CountryCode;
  name: string;
  dialCode: string;
  flag: string;
  searchText: string;
}

export interface ParsedLeadPhone {
  country: CountryCode;
  e164: string;
  digits: string;
  display: string;
}

export const DEFAULT_LEAD_PHONE_COUNTRY: CountryCode = "RW";

function countryFlag(code: CountryCode): string {
  return [...code]
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

let cachedCountries: LeadPhoneCountry[] | undefined;

/** All countries supported by the same metadata used to validate Lead phones. */
export function getLeadPhoneCountries(): LeadPhoneCountry[] {
  if (cachedCountries) return cachedCountries;

  const names = new Intl.DisplayNames(["en"], { type: "region" });
  cachedCountries = getCountries()
    .map((code) => {
      const name = names.of(code) ?? code;
      const dialCode = `+${getCountryCallingCode(code)}`;
      return {
        code,
        name,
        dialCode,
        flag: countryFlag(code),
        searchText: `${name} ${code} ${dialCode}`.toLocaleLowerCase(),
      };
    })
    .sort((left, right) => {
      if (left.code === DEFAULT_LEAD_PHONE_COUNTRY) return -1;
      if (right.code === DEFAULT_LEAD_PHONE_COUNTRY) return 1;
      return left.name.localeCompare(right.name);
    });

  return cachedCountries;
}

/**
 * Parse and validate a Lead contact number. A leading `+` is authoritative;
 * otherwise the selected country supplies the national-number context.
 */
export function parseLeadPhone(
  raw: string,
  selectedCountry: CountryCode = DEFAULT_LEAD_PHONE_COUNTRY
): ParsedLeadPhone | null {
  const input = raw.trim();
  if (!input || /(?:ext\.?|extension|x)\s*\d+$/i.test(input)) return null;

  const parsed = parsePhoneNumberFromString(input, selectedCountry);
  if (!parsed?.country || !parsed.isValid() || parsed.ext) return null;
  if (parsed.getType() === "PREMIUM_RATE") return null;

  return {
    country: parsed.country,
    e164: parsed.number,
    digits: parsed.number.slice(1),
    display: parsed.formatInternational(),
  };
}

/** Render the canonical digits stored on a Lead in readable international form. */
export function formatStoredLeadPhone(stored: string): string {
  const digits = stored.replace(/\D/g, "");
  if (!digits) return "";
  return (
    parsePhoneNumberFromString(`+${digits}`)?.formatInternational() ?? `+${digits}`
  );
}
