"use client";

import { useEffect, useState } from "react";
import { checkSlugAvailable } from "@/lib/actions/vendor-provision";
import { isValidVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import {
  BUSINESS_CATEGORIES,
  COUNTRY_OPTIONS,
} from "@/lib/vendor/onboard-options";
import { Button } from "@/components/ui/primitives";
import type { WizardData } from "@/components/onboard/types";

type SlugAvailability = "idle" | "checking" | "available" | "taken" | "invalid";

interface BusinessStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  slugManuallyEdited: boolean;
  onSlugManuallyEdited: () => void;
  onContinue: () => void;
}

const SLUG_DEBOUNCE_MS = 400;

const fieldLabelClass =
  "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none";

function slugStatusMessage(status: SlugAvailability): string | null {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "available":
      return "Available!";
    case "taken":
      return "This URL is already taken";
    case "invalid":
      return "Use lowercase letters, numbers, and hyphens only";
    case "idle":
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function slugStatusClass(status: SlugAvailability): string {
  switch (status) {
    case "available":
      return "text-success";
    case "taken":
    case "invalid":
      return "text-error";
    case "checking":
    case "idle":
      return "text-muted";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function BusinessStep({
  data,
  update,
  slugManuallyEdited,
  onSlugManuallyEdited,
  onContinue,
}: BusinessStepProps) {
  const [slugStatus, setSlugStatus] = useState<SlugAvailability>("idle");
  const normalizedSlug = normalizeVendorSlug(data.slug);

  useEffect(() => {
    if (!normalizedSlug) {
      setSlugStatus("idle");
      return;
    }
    if (!isValidVendorSlug(data.slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkSlugAvailable(normalizedSlug).then((available) => {
        if (!cancelled) setSlugStatus(available ? "available" : "taken");
      });
    }, SLUG_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSlug, data.slug]);

  const handleNameBlur = () => {
    if (slugManuallyEdited || !data.name.trim()) return;
    update({ slug: normalizeVendorSlug(data.name) });
  };

  const canContinue =
    data.name.trim().length > 0 &&
    slugStatus === "available" &&
    data.phoneLocal.trim().length >= 6;

  const statusMessage = slugStatusMessage(slugStatus);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md leading-tight text-ink">
          Let&apos;s get your business essentials.
        </h1>
        <p className="mt-2 font-body text-body-md text-muted">
          This helps us create your storefront.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="biz-name" className={fieldLabelClass}>
          Restaurant Name
        </label>
        <input
          id="biz-name"
          className={fieldControlClass}
          value={data.name}
          onChange={(event) => update({ name: event.target.value })}
          onBlur={handleNameBlur}
          placeholder="e.g. Inka Steakhouse"
          maxLength={80}
          autoComplete="organization"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="biz-slug" className={fieldLabelClass}>
          Storefront URL
        </label>
        <div className="flex items-stretch overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card focus-within:border-primary">
          <span className="flex items-center whitespace-nowrap border-r border-hairline-strong bg-surface-strong px-3 font-body text-body-sm text-muted">
            zantap.ai/
          </span>
          <input
            id="biz-slug"
            className="h-12 min-w-0 flex-1 bg-transparent px-3 font-body text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
            value={data.slug}
            onChange={(event) => {
              onSlugManuallyEdited();
              update({ slug: event.target.value });
            }}
            placeholder="inka-steakhouse"
            autoComplete="off"
            spellCheck={false}
          />
          {slugStatus === "available" ? (
            <span
              className="flex items-center pr-3 text-success"
              aria-hidden="true"
            >
              ✓
            </span>
          ) : null}
        </div>
        {statusMessage ? (
          <p
            className={`font-body text-caption ${slugStatusClass(slugStatus)}`}
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="biz-phone" className={fieldLabelClass}>
          Phone Number
        </label>
        <div className="flex items-stretch gap-2">
          <select
            aria-label="Country code"
            className="h-12 rounded-brand-md border border-hairline-strong bg-surface-card px-2 font-body text-body-md text-ink focus:border-primary focus:outline-none"
            value={data.countryDialCode}
            onChange={(event) => update({ countryDialCode: event.target.value })}
          >
            {COUNTRY_OPTIONS.map((country) => (
              <option key={country.code} value={country.dialCode}>
                {country.flag} {country.dialCode}
              </option>
            ))}
          </select>
          <input
            id="biz-phone"
            type="tel"
            className={`${fieldControlClass} flex-1`}
            value={data.phoneLocal}
            onChange={(event) => update({ phoneLocal: event.target.value })}
            placeholder="781 234 567"
            autoComplete="tel-national"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="biz-category" className={fieldLabelClass}>
          Business Category
        </label>
        <select
          id="biz-category"
          className={fieldControlClass}
          value={data.businessCategory}
          onChange={(event) => update({ businessCategory: event.target.value })}
        >
          {BUSINESS_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-start gap-3 rounded-brand-lg border border-primary/40 bg-primary/5 px-4 py-3">
        <span className="text-primary" aria-hidden="true">
          ★
        </span>
        <p className="font-body text-body-sm text-muted">
          You can change everything later. This just gets you live faster.
        </p>
      </div>

      <Button
        type="button"
        size="kds"
        radius="lg"
        className="w-full"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue →
      </Button>
    </div>
  );
}
