"use client";

import { useState } from "react";
import { Button, Input, Modal } from "@/components/ui/primitives";

interface WriteSecretPromptProps {
  open: boolean;
  onSave: (secret: string) => void;
  onClose: () => void;
}

export function WriteSecretPrompt({
  open,
  onSave,
  onClose,
}: WriteSecretPromptProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter the write secret from your operator");
      return;
    }
    onSave(trimmed);
    setValue("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vendor write access"
    >
      <p className="mb-4 font-body text-body-sm text-muted">
        Menu edits are protected. Enter the write secret shared by your
        operator — it is stored on this device only.
      </p>
      <Input
        label="Write secret"
        type="password"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setError(null);
        }}
        error={error ?? undefined}
      />
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Button size="kds" className="flex-1" onClick={handleSave}>
          Save secret
        </Button>
        <Button
          size="kds"
          variant="outline"
          className="flex-1"
          onClick={onClose}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
}
