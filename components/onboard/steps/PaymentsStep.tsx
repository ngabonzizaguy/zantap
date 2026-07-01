"use client";

import { cn } from "@/lib/cn";
import { COUNTRY_OPTIONS } from "@/lib/vendor/onboard-options";
import { Button } from "@/components/ui/primitives";
import type { PayoutMethod } from "@/lib/types";
import type { WizardData } from "@/components/onboard/types";

interface PaymentsStepProps {
  data: WizardData;
  update: (patch: Partial<WizardData>) => void;
  onContinue: () => void;
}

const fieldLabelClass = "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none";

interface OptionShellProps {
  method: PayoutMethod;
  selected: PayoutMethod;
  emoji: string;
  title: string;
  subtitle: string;
  onSelect: (method: PayoutMethod) => void;
  children: React.ReactNode;
}

function OptionShell({
  method,
  selected,
  emoji,
  title,
  subtitle,
  onSelect,
  children,
}: OptionShellProps) {
  const active = method === selected;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-brand-lg border p-4 transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-hairline-strong bg-surface-card"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(method)}
        aria-pressed={active}
        className="flex items-start gap-3 text-left"
      >
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-brand-md bg-surface-strong text-lg"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <span className="flex-1">
          <span className="block font-body text-body-md font-semibold text-ink">
            {title}
          </span>
          <span className="block font-body text-caption text-muted">
            {subtitle}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 flex h-5 w-5 flex-none items-center justify-center rounded-full border text-xs",
            active
              ? "border-primary bg-primary text-on-primary"
              : "border-hairline-strong"
          )}
          aria-hidden="true"
        >
          {active ? "✓" : ""}
        </span>
      </button>
      {active ? children : null}
    </div>
  );
}

export function PaymentsStep({ data, update, onContinue }: PaymentsStepProps) {
  const merchantValid = data.merchantCode.trim().length >= 3;
  const phoneValid = data.payoutPhone.trim().length >= 6;
  const canContinue =
    data.payoutMethod === "MERCHANT_CODE" ? merchantValid : phoneValid;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display-md leading-tight text-ink">
          How would you like to receive payments?
        </h1>
        <p className="mt-2 font-body text-body-md text-muted">
          You can change this later.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <OptionShell
          method="MERCHANT_CODE"
          selected={data.payoutMethod}
          emoji="🏷️"
          title="MoMo Merchant Code"
          subtitle="Receive payments to your MoMo Pay merchant code."
          onSelect={(method) => update({ payoutMethod: method })}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="pay-merchant" className={fieldLabelClass}>
              Merchant Code
            </label>
            <div className="flex items-stretch overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card focus-within:border-primary">
              <input
                id="pay-merchant"
                className="h-12 min-w-0 flex-1 bg-transparent px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
                value={data.merchantCode}
                onChange={(event) =>
                  update({ merchantCode: event.target.value })
                }
                placeholder="123456"
                inputMode="numeric"
                autoComplete="off"
              />
              {merchantValid ? (
                <span
                  className="flex items-center pr-3 text-success"
                  aria-hidden="true"
                >
                  ✓
                </span>
              ) : null}
            </div>
            {merchantValid ? (
              <p className="font-body text-caption text-success">Looks good!</p>
            ) : null}
          </div>
        </OptionShell>

        <OptionShell
          method="PHONE"
          selected={data.payoutMethod}
          emoji="📲"
          title="Receive to Phone Number"
          subtitle="Receive payments to your MoMo registered phone."
          onSelect={(method) => update({ payoutMethod: method })}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="pay-phone" className={fieldLabelClass}>
              Phone Number
            </label>
            <div className="flex items-stretch gap-2">
              <select
                aria-label="Country code"
                className="h-12 rounded-brand-md border border-hairline-strong bg-surface-card px-2 font-body text-body-md text-ink focus:border-primary focus:outline-none"
                value={data.countryDialCode}
                onChange={(event) =>
                  update({ countryDialCode: event.target.value })
                }
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.dialCode}>
                    {country.flag} {country.dialCode}
                  </option>
                ))}
              </select>
              <input
                id="pay-phone"
                type="tel"
                className={`${fieldControlClass} flex-1`}
                value={data.payoutPhone}
                onChange={(event) =>
                  update({ payoutPhone: event.target.value })
                }
                placeholder="781 234 567"
                autoComplete="off"
              />
            </div>
          </div>
        </OptionShell>
      </div>

      <div className="flex items-start gap-3 rounded-brand-lg border border-hairline bg-surface-card px-4 py-3">
        <span className="text-primary" aria-hidden="true">
          🛡️
        </span>
        <p className="font-body text-body-sm text-muted">
          100% secure. Payments go directly to your MoMo account.
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
