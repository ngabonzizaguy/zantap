"use client";

import { useEffect, useState } from "react";
import { checkSlugAvailable } from "@/lib/actions/vendor-provision";
import {
  isValidVendorSlug,
  normalizeVendorSlug,
} from "@/lib/vendor/slug";
import { Button, Input } from "@/components/ui/primitives";

export interface BusinessFormValues {
  name: string;
  slug: string;
  phoneNumber: string;
  momoCode: string;
}

type SlugAvailability = "idle" | "checking" | "available" | "taken" | "invalid";

interface BusinessStepProps {
  values: BusinessFormValues;
  onChange: (values: BusinessFormValues) => void;
  slugManuallyEdited: boolean;
  onSlugManuallyEdited: () => void;
  onBack?: () => void;
  onContinue: () => void;
}

const SLUG_DEBOUNCE_MS = 400;

function slugStatusMessage(status: SlugAvailability): string | null {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "available":
      return "This URL is available";
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
      return "text-muted-soft";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function BusinessStep({
  values,
  onChange,
  slugManuallyEdited,
  onSlugManuallyEdited,
  onBack,
  onContinue,
}: BusinessStepProps) {
  const [origin, setOrigin] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugAvailability>("idle");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const normalizedSlug = normalizeVendorSlug(values.slug);

  useEffect(() => {
    if (!normalizedSlug) {
      setSlugStatus("idle");
      return;
    }

    if (!isValidVendorSlug(values.slug)) {
      setSlugStatus("invalid");
      return;
    }

    setSlugStatus("checking");
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkSlugAvailable(normalizedSlug).then((available) => {
        if (!cancelled) {
          setSlugStatus(available ? "available" : "taken");
        }
      });
    }, SLUG_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [normalizedSlug, values.slug]);

  const handleNameBlur = () => {
    if (slugManuallyEdited || !values.name.trim()) return;
    onChange({
      ...values,
      slug: normalizeVendorSlug(values.name),
    });
  };

  const canContinue =
    values.name.trim().length > 0 &&
    isValidVendorSlug(values.slug) &&
    slugStatus === "available" &&
    values.phoneNumber.trim().length > 0 &&
    values.momoCode.trim().length > 0;

  const statusMessage = slugStatusMessage(slugStatus);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-display-sm text-ink">
          Your restaurant
        </h2>
        <p className="mt-2 font-body text-body-md text-muted">
          This is what customers will see on your menu page.
        </p>
      </div>

      <Input
        label="Restaurant name"
        value={values.name}
        onChange={(event) =>
          onChange({ ...values, name: event.target.value })
        }
        onBlur={handleNameBlur}
        placeholder="e.g. Sunrise Café"
        maxLength={80}
        autoComplete="organization"
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="Storefront URL"
          value={values.slug}
          onChange={(event) => {
            onSlugManuallyEdited();
            onChange({ ...values, slug: event.target.value });
          }}
          placeholder="sunrise-cafe"
          autoComplete="off"
          spellCheck={false}
        />
        {origin && normalizedSlug ? (
          <p className="font-body text-caption text-muted">
            {origin}/{normalizedSlug}
          </p>
        ) : origin ? (
          <p className="font-body text-caption text-muted-soft">
            {origin}/your-restaurant
          </p>
        ) : null}
        {statusMessage ? (
          <p
            className={`font-body text-caption ${slugStatusClass(slugStatus)}`}
            role="status"
          >
            {statusMessage}
          </p>
        ) : null}
      </div>

      <Input
        label="Phone number"
        type="tel"
        value={values.phoneNumber}
        onChange={(event) =>
          onChange({ ...values, phoneNumber: event.target.value })
        }
        placeholder="0788 123 456"
        autoComplete="tel"
      />

      <div className="flex flex-col gap-1.5">
        <Input
          label="MoMo merchant code"
          value={values.momoCode}
          onChange={(event) =>
            onChange({ ...values, momoCode: event.target.value })
          }
          placeholder="Your merchant ID"
          autoComplete="off"
        />
        <p className="font-body text-caption text-muted-soft">
          Used when live mobile money is enabled.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {onBack ? (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:flex-1"
            onClick={onBack}
          >
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          className="w-full sm:flex-1"
          disabled={!canContinue}
          onClick={onContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
