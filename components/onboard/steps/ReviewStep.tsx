"use client";

import { formatStorefrontDisplayPath } from "@/lib/base-url";
import { formatRwf } from "@/lib/format";
import { normalizeVendorSlug } from "@/lib/vendor/slug";
import { useDishPhotoPreview } from "@/components/onboard/useDishPhotoPreview";
import { Button } from "@/components/ui/primitives";
import type { WizardData, WizardStep } from "@/components/onboard/types";

interface ReviewStepProps {
  data: WizardData;
  onEdit: (step: WizardStep) => void;
  onGoLive: () => void;
  submitting: boolean;
  error: string | null;
}

interface ReviewCardProps {
  title: string;
  meta?: string;
  onEdit: () => void;
  children: React.ReactNode;
}

function ReviewCard({ title, meta, onEdit, children }: ReviewCardProps) {
  return (
    <div className="rounded-brand-lg border border-hairline bg-surface-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-body text-body-sm font-semibold text-ink">
          {title}
          {meta ? (
            <span className="ml-1 font-normal text-muted">{meta}</span>
          ) : null}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="rounded-pill border border-hairline-strong px-3 py-1 font-body text-caption font-medium text-ink transition-colors hover:border-ink"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

export function ReviewStep({
  data,
  onEdit,
  onGoLive,
  submitting,
  error,
}: ReviewStepProps) {
  const slug = normalizeVendorSlug(data.slug);
  const price = Number.parseInt(data.dishPriceRwf, 10);
  const priceValid = Number.isInteger(price) && price > 0;
  const fullPhone = `${data.countryDialCode} ${data.phoneLocal}`.trim();
  const photoPreview = useDishPhotoPreview(data.dishPhoto);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md leading-tight text-ink">
          Review your setup.
        </h1>
        <p className="mt-2 font-body text-body-md text-muted">
          You&apos;re almost live!
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ReviewCard title="Restaurant" onEdit={() => onEdit("business")}>
          <p className="font-body text-body-md text-ink">{data.name}</p>
          <p className="font-body text-caption text-muted">
            {formatStorefrontDisplayPath(slug)}
          </p>
          <p className="mt-1 font-body text-body-sm text-primary">
            {fullPhone}
          </p>
        </ReviewCard>

        <ReviewCard title="Payments" onEdit={() => onEdit("payments")}>
          {data.payoutMethod === "MERCHANT_CODE" ? (
            <>
              <p className="font-body text-body-sm text-muted">
                MoMo Merchant Code
              </p>
              <p className="font-body text-body-md text-ink">
                {data.merchantCode}
              </p>
            </>
          ) : (
            <>
              <p className="font-body text-body-sm text-muted">
                Receive to Phone Number
              </p>
              <p className="font-body text-body-md text-ink">
                {data.payoutSameAsBusiness
                  ? `${data.countryDialCode} ${data.phoneLocal}`.trim()
                  : `${data.countryDialCode} ${data.payoutPhone}`.trim()}
              </p>
            </>
          )}
        </ReviewCard>

        <ReviewCard title="Menu" meta="(1 item)" onEdit={() => onEdit("menu")}>
          <div className="flex items-center gap-3">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt=""
                className="h-12 w-12 flex-none rounded-brand-md object-cover"
              />
            ) : (
              <span
                className="flex h-12 w-12 flex-none items-center justify-center rounded-brand-md bg-surface-strong text-lg"
                aria-hidden="true"
              >
                🍽️
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-body text-body-md font-semibold text-ink">
                {data.dishName}
              </p>
              <p className="font-body text-caption text-muted">
                {data.dishCategory}
              </p>
              <p className="font-body text-body-sm font-semibold text-primary">
                {priceValid ? formatRwf(price) : "— RWF"}
              </p>
            </div>
          </div>
        </ReviewCard>
      </div>

      <div className="flex items-start gap-3 rounded-brand-lg border border-success/40 bg-surface-card px-4 py-3">
        <span
          className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-success text-success"
          aria-hidden="true"
        >
          ✓
        </span>
        <p className="font-body text-body-sm text-muted">
          <span className="font-semibold text-ink">Everything looks good.</span>{" "}
          You can always update this later.
        </p>
      </div>

      {error ? (
        <p className="font-body text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        size="kds"
        radius="lg"
        className="w-full"
        disabled={submitting}
        onClick={onGoLive}
      >
        {submitting ? "Going live…" : "🚀 Go Live"}
      </Button>
    </div>
  );
}
