"use client";

import { Button, Input } from "@/components/ui/primitives";

interface GateStepProps {
  value: string;
  onChange: (value: string) => void;
  onContinue: () => void;
}

export function GateStep({ value, onChange, onContinue }: GateStepProps) {
  const canContinue = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-display-sm text-ink">
          Enter your setup code
        </h2>
        <p className="mt-2 font-body text-body-md text-muted">
          Enter the setup code from ZanTap to create your restaurant account.
        </p>
      </div>

      <Input
        label="Setup code"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="From your ZanTap operator"
      />

      <Button
        type="button"
        className="w-full"
        disabled={!canContinue}
        onClick={onContinue}
      >
        Continue
      </Button>
    </div>
  );
}
