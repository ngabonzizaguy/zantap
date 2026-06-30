"use client";

import { Button, Input } from "@/components/ui/primitives";

export interface FirstDishFormValues {
  name: string;
  priceRwf: string;
}

interface FirstDishStepProps {
  values: FirstDishFormValues;
  onChange: (values: FirstDishFormValues) => void;
  onBack: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}

export function FirstDishStep({
  values,
  onChange,
  onBack,
  onSubmit,
  submitting,
  error,
}: FirstDishStepProps) {
  const price = Number.parseInt(values.priceRwf, 10);
  const priceValid = Number.isInteger(price) && price > 0;
  const canSubmit = values.name.trim().length > 0 && priceValid && !submitting;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-display-sm text-ink">Your first dish</h2>
        <p className="mt-2 font-body text-body-md text-muted">
          Add one dish now; you can add more in your kitchen dashboard.
        </p>
      </div>

      <Input
        label="Dish name"
        value={values.name}
        onChange={(event) => onChange({ ...values, name: event.target.value })}
        placeholder="e.g. Grilled tilapia"
        disabled={submitting}
      />

      <Input
        label="Price (RWF)"
        type="number"
        inputMode="numeric"
        min={1}
        step={1}
        value={values.priceRwf}
        onChange={(event) =>
          onChange({ ...values, priceRwf: event.target.value })
        }
        placeholder="3500"
        disabled={submitting}
        error={
          values.priceRwf && !priceValid
            ? "Enter a positive whole number"
            : undefined
        }
      />

      {error ? (
        <p className="font-body text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:flex-1"
          onClick={onBack}
          disabled={submitting}
        >
          Back
        </Button>
        <Button
          type="button"
          className="w-full sm:flex-1"
          disabled={!canSubmit}
          onClick={onSubmit}
        >
          {submitting ? "Creating your storefront…" : "Go live"}
        </Button>
      </div>
    </div>
  );
}
