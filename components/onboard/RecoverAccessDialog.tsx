"use client";

import Link from "next/link";
import { useState } from "react";
import { recoverOwnerToken } from "@/lib/actions/vendor-provision";
import { getDisplayHostPrefix } from "@/lib/base-url";
import { cacheOwnerToken } from "@/lib/vendor/useOwnerToken";
import { normalizeVendorSlug } from "@/lib/vendor/slug";
import { Button } from "@/components/ui/primitives";

interface RecoverAccessDialogProps {
  open: boolean;
  onClose: () => void;
}

const fieldLabelClass = "font-body text-body-sm font-medium text-ink";
const fieldControlClass =
  "h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none";

const MISS_MESSAGE =
  "We couldn't match that storefront and phone. Check both and try again.";

export function RecoverAccessDialog({ open, onClose }: RecoverAccessDialogProps) {
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveredSlug, setRecoveredSlug] = useState<string | null>(null);

  if (!open) return null;

  const normalizedSlug = normalizeVendorSlug(slug);
  const canSubmit =
    normalizedSlug.length > 0 && phone.trim().length >= 6 && !submitting;
  const hostPrefix = getDisplayHostPrefix();

  const handleClose = () => {
    setSlug("");
    setPhone("");
    setError(null);
    setRecoveredSlug(null);
    setSubmitting(false);
    onClose();
  };

  const handleRecover = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await recoverOwnerToken(normalizedSlug, phone);
      if (result.ok) {
        // Owner token is returned once — cache it (keyed by slug) so the vendor
        // resumes editing on this device with zero typing (ADR-0022).
        cacheOwnerToken(normalizedSlug, result.ownerToken);
        setRecoveredSlug(normalizedSlug);
      } else {
        setError(MISS_MESSAGE);
      }
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message.includes("Too many")
          ? "Too many attempts. Please wait a minute and try again."
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close recover access"
        className="absolute inset-0 bg-canvas/90 backdrop-blur-sm"
        onClick={handleClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="recover-title"
        className="relative z-10 w-full max-w-md rounded-t-brand-xl border border-hairline bg-surface-card p-6 shadow-brand-soft sm:rounded-brand-xl"
      >
        {recoveredSlug ? (
          <div className="flex flex-col gap-5 text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-brand-xl bg-primary text-2xl"
              aria-hidden="true"
            >
              ✓
            </span>
            <div>
              <h2
                id="recover-title"
                className="font-display text-display-sm text-ink"
              >
                Access recovered
              </h2>
              <p className="mt-2 font-body text-body-md text-muted">
                Your store is unlocked on this device. No code to enter.
              </p>
            </div>
            <Link
              href={`/vendor/${recoveredSlug}?tab=drivers`}
              className="inline-flex h-12 w-full items-center justify-center rounded-brand-lg bg-primary px-6 font-body text-button font-medium text-on-primary transition-colors hover:bg-primary-active"
            >
              Open Kitchen Dashboard →
            </Link>
            <button
              type="button"
              onClick={handleClose}
              className="font-body text-body-sm text-muted hover:text-ink"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h2
                id="recover-title"
                className="font-display text-display-sm text-ink"
              >
                Recover access
              </h2>
              <p className="mt-2 font-body text-body-md text-muted">
                Enter your storefront URL and the phone number you signed up
                with. We&apos;ll unlock editing on this device.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="recover-slug" className={fieldLabelClass}>
                Storefront URL
              </label>
              <div className="flex items-stretch overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card focus-within:border-primary">
                <span className="flex items-center whitespace-nowrap border-r border-hairline-strong bg-surface-strong px-3 font-body text-body-sm text-muted">
                  {hostPrefix}
                </span>
                <input
                  id="recover-slug"
                  className="h-12 min-w-0 flex-1 bg-transparent px-3 font-body text-body-md text-ink placeholder:text-muted-soft focus:outline-none"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="inka-steakhouse"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="recover-phone" className={fieldLabelClass}>
                Signup phone number
              </label>
              <input
                id="recover-phone"
                type="tel"
                className={fieldControlClass}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+250 781 234 567"
                autoComplete="tel"
              />
            </div>

            {error ? (
              <p className="font-body text-body-sm text-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-3">
              <Button
                type="button"
                size="default"
                radius="lg"
                className="w-full"
                disabled={!canSubmit}
                onClick={() => void handleRecover()}
              >
                {submitting ? "Recovering…" : "Recover access"}
              </Button>
              <button
                type="button"
                onClick={handleClose}
                className="font-body text-body-sm text-muted hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
