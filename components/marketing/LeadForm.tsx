"use client";

import { useState } from "react";
import type { SubmitLeadInput } from "@/lib/leads/types";
import { LEAD_FORM, MARKETING_WHATSAPP_PHONE } from "@/lib/marketing/copy";
import { buildWhatsAppUrl, toWhatsAppE164 } from "@/lib/whatsapp";

/**
 * Interim lead transport (pre-Issue-04): validated submissions open WhatsApp
 * to the owner's number with a prefilled message — the owner's stated
 * follow-up channel (ADR-0046 §9). Issue 04 replaces `deliverLead` with the
 * durable `submitLead` server action; the form and `SubmitLeadInput` stay.
 */
function deliverLead(lead: SubmitLeadInput): void {
  const text = [
    "New ZanTap setup request",
    `Business: ${lead.businessName}`,
    `Type: ${lead.businessType}`,
    `Contact: ${lead.contactName}`,
    `WhatsApp: ${lead.phone}`,
    `Area: ${lead.area}`,
  ].join("\n");
  window.open(
    buildWhatsAppUrl(text, MARKETING_WHATSAPP_PHONE),
    "_blank",
    "noopener"
  );
}

const inputClass =
  "w-full rounded-brand-md border border-[#d6d3d1] bg-white px-3.5 py-3 font-body text-body-sm text-[#0c0a09] placeholder:text-[#a8a29e] focus:border-[#0c0a09] focus:outline-none";

const labelClass =
  "block font-body text-caption-uppercase uppercase text-[#777169]";

export function LeadForm() {
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const lead: SubmitLeadInput = {
      businessName: String(data.get("businessName") ?? "").trim(),
      businessType: String(data.get("businessType") ?? "").trim(),
      contactName: String(data.get("contactName") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      area: String(data.get("area") ?? "").trim(),
      source: "marketing-root",
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
    if (!toWhatsAppE164(lead.phone)) {
      setError(LEAD_FORM.errors.phone);
      return;
    }

    setError(null);
    deliverLead(lead);
    setSubmitted(true);
  }

  return (
    <aside
      id="lead-form"
      className="w-full rounded-brand-xxl bg-[#faf7f2] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.45)] sm:p-7"
    >
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
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
              {LEAD_FORM.fields.businessType.options.map((option) => (
                <option key={option} value={option}>
                  {option}
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

          <label className="block space-y-1.5">
            <span className={labelClass}>{LEAD_FORM.fields.phone.label}</span>
            <input
              name="phone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={LEAD_FORM.fields.phone.placeholder}
              className={inputClass}
            />
          </label>

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
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-[#0c0a09] px-6 py-4 font-body text-button text-white transition-colors hover:bg-[#292524]"
          >
            {LEAD_FORM.submit} <span aria-hidden>→</span>
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
