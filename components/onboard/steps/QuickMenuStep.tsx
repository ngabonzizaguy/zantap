"use client";

import { useEffect, useRef, useState } from "react";
import { formatRwf } from "@/lib/format";
import { MENU_CATEGORIES } from "@/lib/vendor/onboard-options";
import { Button } from "@/components/ui/primitives";
import type { WizardData } from "@/components/onboard/types";

interface QuickMenuStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  onContinue: () => void;
}

const fieldLabelClass = "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none";

export function QuickMenuStep({ data, update, onContinue }: QuickMenuStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!data.dishPhoto) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(data.dishPhoto);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [data.dishPhoto]);

  const price = Number.parseInt(data.dishPriceRwf, 10);
  const priceValid = Number.isInteger(price) && price > 0;
  const canContinue = data.dishName.trim().length > 0 && priceValid;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md leading-tight text-ink">
          Add your first menu item.
        </h1>
        <p className="mt-2 font-body text-body-md text-muted">
          Just one to get started.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dish-name" className={fieldLabelClass}>
          Dish Name
        </label>
        <input
          id="dish-name"
          className={fieldControlClass}
          value={data.dishName}
          onChange={(event) => update({ dishName: event.target.value })}
          placeholder="e.g. Prime Ribeye Steak"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dish-price" className={fieldLabelClass}>
          Price (RWF)
        </label>
        <input
          id="dish-price"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          className={fieldControlClass}
          value={data.dishPriceRwf}
          onChange={(event) => update({ dishPriceRwf: event.target.value })}
          placeholder="25000"
        />
        {data.dishPriceRwf && !priceValid ? (
          <p className="font-body text-caption text-error">
            Enter a positive whole number
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="dish-category" className={fieldLabelClass}>
          Category
        </label>
        <select
          id="dish-category"
          className={fieldControlClass}
          value={data.dishCategory}
          onChange={(event) => update({ dishCategory: event.target.value })}
        >
          {MENU_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <p className={fieldLabelClass}>Photo (optional)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            update({ dishPhoto: file });
          }}
        />
        {photoPreview ? (
          <div className="flex items-center gap-3 rounded-brand-lg border border-hairline-strong bg-surface-card p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Selected dish"
              className="h-16 w-16 rounded-brand-md object-cover"
            />
            <div className="flex flex-1 flex-col gap-1">
              <p className="truncate font-body text-body-sm text-ink">
                {data.dishPhoto?.name}
              </p>
              <p className="font-body text-caption text-muted">
                Uploaded right after you go live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => update({ dishPhoto: null })}
              className="font-body text-caption text-muted underline-offset-2 hover:text-error hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-1 rounded-brand-lg border border-dashed border-hairline-strong bg-surface-card px-4 py-6 text-muted transition-colors hover:border-primary hover:text-ink"
          >
            <span className="text-2xl" aria-hidden="true">
              +
            </span>
            <span className="font-body text-body-sm">Add Photo</span>
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className={fieldLabelClass}>Live Preview</p>
        <div className="flex items-center gap-4 rounded-brand-lg border border-primary/40 bg-surface-card p-3">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt=""
              className="h-20 w-20 flex-none rounded-brand-md object-cover"
            />
          ) : (
            <span
              className="flex h-20 w-20 flex-none items-center justify-center rounded-brand-md bg-surface-strong text-2xl"
              aria-hidden="true"
            >
              🍽️
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-body-md font-semibold text-ink">
              {data.dishName.trim() || "Your dish name"}
            </p>
            <p className="font-body text-caption text-muted">
              {data.dishCategory}
            </p>
            <p className="mt-1 font-body text-body-md font-semibold text-primary">
              {priceValid ? formatRwf(price) : "— RWF"}
            </p>
          </div>
        </div>
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
