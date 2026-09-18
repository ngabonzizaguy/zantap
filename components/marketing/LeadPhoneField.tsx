"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { CountryCode } from "libphonenumber-js";

import {
  DEFAULT_LEAD_PHONE_COUNTRY,
  getLeadPhoneCountries,
  parseLeadPhone,
} from "@/lib/leads/phone";

interface LeadPhoneFieldProps {
  label: string;
  placeholder: string;
  countryLabel: string;
  searchPlaceholder: string;
  noResults: string;
}

export function LeadPhoneField({
  label,
  placeholder,
  countryLabel,
  searchPlaceholder,
  noResults,
}: LeadPhoneFieldProps) {
  const phoneId = useId();
  const countries = useMemo(() => getLeadPhoneCountries(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [country, setCountry] = useState<CountryCode>(
    DEFAULT_LEAD_PHONE_COUNTRY
  );
  const [phone, setPhone] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected =
    countries.find((option) => option.code === country) ?? countries[0]!;
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return countries;
    return countries.filter((option) => option.searchText.includes(needle));
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  function selectCountry(nextCountry: CountryCode) {
    setCountry(nextCountry);
    setQuery("");
    setOpen(false);
  }

  function handlePhoneChange(event: ChangeEvent<HTMLInputElement>) {
    const nextPhone = event.target.value;
    setPhone(nextPhone);

    if (nextPhone.trim().startsWith("+")) {
      const parsed = parseLeadPhone(nextPhone, country);
      if (parsed) setCountry(parsed.country);
    }
  }

  return (
    <div className="block space-y-1.5">
      <label
        htmlFor={phoneId}
        className="block font-body text-caption-uppercase uppercase text-[#777169]"
      >
        {label}
      </label>
      <span className="flex">
        <span ref={containerRef} className="relative block shrink-0">
          <button
            type="button"
            aria-label={`${countryLabel}: ${selected.name} ${selected.dialCode}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex h-full min-h-12 items-center gap-1.5 rounded-l-brand-md border border-r-0 border-[#d6d3d1] bg-white px-3 font-body text-body-sm text-[#0c0a09] focus:z-10 focus:border-2 focus:border-[#0c0a09] focus:outline-none"
          >
            <span aria-hidden>{selected.flag}</span>
            <span>{selected.dialCode}</span>
            <span className="text-[#777169]" aria-hidden>
              ▾
            </span>
          </button>

          {open ? (
            <span className="absolute left-0 z-30 mt-1.5 block w-[min(21rem,calc(100vw-3.5rem))] overflow-hidden rounded-brand-lg border border-[#e7e5e4] bg-white shadow-kds">
              <span className="block border-b border-[#e7e5e4] p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setOpen(false);
                    if (event.key === "Enter" && filtered[0]) {
                      event.preventDefault();
                      selectCountry(filtered[0].code);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="w-full rounded-brand-md border border-[#d6d3d1] bg-white px-3 py-2.5 font-body text-body-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:border-[#0c0a09] focus:outline-none"
                />
              </span>
              <span
                role="listbox"
                aria-label={countryLabel}
                className="block max-h-64 overflow-y-auto py-1"
              >
                {filtered.length ? (
                  filtered.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      role="option"
                      aria-selected={option.code === country}
                      onClick={() => selectCountry(option.code)}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left font-body text-body-sm text-[#0c0a09] hover:bg-[#f0efed] focus:bg-[#f0efed] focus:outline-none"
                    >
                      <span aria-hidden>{option.flag}</span>
                      <span className="min-w-0 flex-1 truncate">
                        {option.name}
                      </span>
                      <span className="text-[#777169]">{option.dialCode}</span>
                    </button>
                  ))
                ) : (
                  <span className="block px-3 py-4 font-body text-body-sm text-[#777169]">
                    {noResults}
                  </span>
                )}
              </span>
            </span>
          ) : null}
        </span>

        <input type="hidden" name="phoneCountry" value={country} />
        <input
          id={phoneId}
          name="phone"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-r-brand-md border border-[#d6d3d1] bg-white px-3.5 py-3 font-body text-body-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:z-10 focus:border-2 focus:border-[#0c0a09] focus:outline-none"
        />
      </span>
    </div>
  );
}
