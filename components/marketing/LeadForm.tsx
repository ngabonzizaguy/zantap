"use client";

import { useRef, useState } from "react";
import type { CountryCode } from "libphonenumber-js";
import { submitLead } from "@/lib/actions/lead-submit";
import { LeadPhoneField } from "@/components/marketing/LeadPhoneField";
import type {
  SubmitLeadErrorCode,
  SubmitLeadInput,
} from "@/lib/leads/types";
import { LEAD_FORM as LEAD_FORM_EN } from "@/lib/marketing/copy";
import type { Localized } from "@/lib/i18n/localize";
import { TornPanelBackdrop } from "@/components/marketing/TornPaint";
import { pairLeadBusinessTypeOptions } from "@/lib/leads/business-types";
import { parseLeadPhone } from "@/lib/leads/phone";
import { trackMarketingEvent } from "@/lib/analytics/client";

/**
 * Public marketing lead form. The browser submits through the Server Action;
 * only the server reaches the Store seam (ADR-0046 §9).
 * `copy` is the (possibly localized) LEAD_FORM tree; defaults to English.
 */
export type LeadFormCopy = Localized<typeof LEAD_FORM_EN>;

const inputClass =
  "w-full rounded-brand-md border border-[#d6d3d1] bg-white px-3.5 py-3 font-body text-body-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:border-[#0c0a09] focus:outline-none";

const labelClass =
  "block font-body text-caption-uppercase uppercase text-[#777169]";

export function LeadForm({ copy }: { copy?: LeadFormCopy } = {}) {
  const LEAD_FORM = copy ?? LEAD_FORM_EN;
  const businessTypeOptions = pairLeadBusinessTypeOptions(
    LEAD_FORM.fields.businessType.options
  );
  const submissionErrors: Record<SubmitLeadErrorCode, string> = {
    INVALID_INPUT: LEAD_FORM.errors.required,
    INVALID_PHONE: LEAD_FORM.errors.phone,
    RATE_LIMITED: LEAD_FORM.errors.rateLimited,
    SUBMISSION_FAILED: LEAD_FORM.errors.submissionFailed,
  };
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const started = useRef(false);

  function trackStart() {
    if (started.current) return;
    started.current = true;
    trackMarketingEvent("lead_form_start");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lead: SubmitLeadInput = {
      businessName: String(data.get("businessName") ?? "").trim(),
      businessType: String(data.get("businessType") ?? "").trim(),
      contactName: String(data.get("contactName") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      phoneCountry: String(data.get("phoneCountry") ?? "RW") as CountryCode,
      area: String(data.get("area") ?? "").trim(),
      source: "marketing-root",
      website: String(data.get("website") ?? "").trim(),
    };

    if (
      !lead.businessName ||
      !lead.businessType ||
      !lead.contactName ||
      !lead.phone ||
      !lead.area
    ) {
      setError(LEAD_FORM.errors.required);
      return;
    }
    if (!parseLeadPhone(lead.phone, lead.phoneCountry)) {
      setError(LEAD_FORM.errors.phone);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await submitLead(lead);
      if (!result.ok) {
        setError(submissionErrors[result.error]);
        return;
      }
      setWhatsappUrl(result.whatsappUrl ?? null);
      setSubmitted(true);
      trackMarketingEvent("lead_submit_success");
    } catch {
      setError(LEAD_FORM.errors.submissionFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside
      id="lead-form"
      className="relative isolate w-full p-7 sm:p-8"
    >
      {/* Torn-paint background replaces the card's straight edges */}
      <TornPanelBackdrop />
      <p className="font-body text-caption-uppercase uppercase text-[#b45309]">
        {LEAD_FORM.kicker}
      </p>
      <h2 className="mt-2 font-display text-display-md text-[#0c0a09]">
        {LEAD_FORM.heading}
      </h2>
      <p className="mt-1.5 font-body text-body-sm text-[#4e4e4e]">
        {LEAD_FORM.subheading}
      </p>

      {submitted ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-brand-lg border border-[#16a34a]/30 bg-[#16a34a]/10 p-4"
        >
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#16a34a] text-sm font-semibold text-white">
            ✓
          </span>
          <div>
            <p className="font-body text-body-strong text-[#0c0a09]">
              {LEAD_FORM.success.title}
            </p>
            <p className="mt-0.5 font-body text-caption text-[#4e4e4e]">
              {LEAD_FORM.success.detail}
            </p>
            {whatsappUrl ? (
              <div className="mt-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-pill bg-[#0c0a09] px-5 font-body text-button text-white transition-colors hover:bg-[#292524] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0c0a09]"
                >
                  {LEAD_FORM.success.whatsappCta}
                </a>
                <p className="mt-2 font-body text-[12px] text-[#777169]">
                  {LEAD_FORM.success.whatsappNote}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} onFocusCapture={trackStart} className="mt-6 space-y-4" noValidate>
          <div className="absolute -left-[10000px]" aria-hidden="true">
            <label>
              Website
              <input
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
          <label className="block space-y-1.5">
            <span className={labelClass}>
              {LEAD_FORM.fields.businessName.label}
            </span>
            <input
              name="businessName"
              required
              placeholder={LEAD_FORM.fields.businessName.placeholder}
              className={inputClass}
            />
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>
              {LEAD_FORM.fields.businessType.label}
            </span>
            <select
              name="businessType"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                {LEAD_FORM.fields.businessType.placeholder}
              </option>
              {businessTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className={labelClass}>
              {LEAD_FORM.fields.contactName.label}
            </span>
            <input
              name="contactName"
              required
              autoComplete="name"
              placeholder={LEAD_FORM.fields.contactName.placeholder}
              className={inputClass}
            />
          </label>

          <LeadPhoneField
            label={LEAD_FORM.fields.phone.label}
            placeholder={LEAD_FORM.fields.phone.placeholder}
            countryLabel={LEAD_FORM.fields.phone.countryLabel}
            searchPlaceholder={LEAD_FORM.fields.phone.searchPlaceholder}
            noResults={LEAD_FORM.fields.phone.noResults}
          />

          <label className="block space-y-1.5">
            <span className={labelClass}>{LEAD_FORM.fields.area.label}</span>
            <input
              name="area"
              required
              placeholder={LEAD_FORM.fields.area.placeholder}
              className={inputClass}
            />
          </label>

          {error ? (
            <p role="alert" className="font-body text-caption text-[#dc2626]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-[#0c0a09] px-6 py-4 font-body text-button text-white transition-colors hover:bg-[#292524] disabled:cursor-wait disabled:opacity-60"
          >
            {submitting ? LEAD_FORM.submitting : LEAD_FORM.submit}{" "}
            <span aria-hidden>→</span>
          </button>

          <p className="text-center font-body text-[12px] leading-relaxed text-[#777169]">
            {LEAD_FORM.consent}
          </p>
          <p className="text-center font-body text-caption text-[#a8a29e]">
            {LEAD_FORM.reassurance}
          </p>
        </form>
      )}
    </aside>
  );
}
