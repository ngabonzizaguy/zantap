"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { updateVendorProfile } from "@/lib/actions/vendor-profile";
import {
  countCompletedSteps,
  ONBOARDING_STEPS,
  type OnboardingChecklist,
} from "@/lib/vendor/onboarding";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { resetCoachmarks } from "@/components/vendor/Coachmark";

export interface StorefrontProfile {
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  rating?: number;
}

interface SetupDrawerProps {
  open: boolean;
  onClose: () => void;
  checklist: OnboardingChecklist;
  vendorSlug: string;
  profile: StorefrontProfile;
  onProfileSaved?: (profile: StorefrontProfile) => void;
  onRefresh?: () => void;
}

export function SetupDrawer({
  open,
  onClose,
  checklist,
  vendorSlug,
  profile,
  onProfileSaved,
  onRefresh,
}: SetupDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const { token, hasToken } = useOwnerToken(vendorSlug);
  const [tipsReset, setTipsReset] = useState(false);
  const [taglineDraft, setTaglineDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [deliveryTimeDraft, setDeliveryTimeDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const completed = countCompletedSteps(checklist);
  const total = ONBOARDING_STEPS.length;

  useEffect(() => {
    if (!open) return;

    previousFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    onRefresh?.();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    };
  }, [open, onClose, onRefresh]);

  useEffect(() => {
    if (!open) return;
    setTaglineDraft(profile.tagline ?? "");
    setLocationDraft(profile.location ?? "");
    setDeliveryTimeDraft(profile.deliveryTime ?? "");
    setRatingDraft(
      profile.rating !== undefined && profile.rating !== null
        ? String(profile.rating)
        : ""
    );
    setProfileError(null);
    setProfileSaved(false);
  }, [open, profile]);

  const handleShowTipsAgain = () => {
    resetCoachmarks();
    setTipsReset(true);
    window.setTimeout(() => setTipsReset(false), 2000);
  };

  const handleSaveProfile = async () => {
    if (!token) {
      setProfileError(
        "This device isn't unlocked. Recover access to edit your profile."
      );
      return;
    }

    const ratingTrimmed = ratingDraft.trim();
    let rating: number | undefined;
    if (ratingTrimmed) {
      const parsed = Number.parseFloat(ratingTrimmed);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
        setProfileError("Rating must be a number between 0 and 5.");
        return;
      }
      rating = parsed;
    }

    setProfileSaving(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const updated = await updateVendorProfile(token, vendorSlug, {
        tagline: taglineDraft,
        location: locationDraft,
        deliveryTime: deliveryTimeDraft,
        ...(ratingTrimmed ? { rating } : {}),
      });
      onProfileSaved?.({
        tagline: updated.tagline,
        location: updated.location,
        deliveryTime: updated.deliveryTime,
        rating: updated.rating,
      });
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2000);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save profile.";
      setProfileError(
        message.toLowerCase().includes("owner token")
          ? "This device isn't unlocked. Recover access and try again."
          : message
      );
    } finally {
      setProfileSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close setup guide"
        className="absolute inset-0 bg-canvas-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative z-10 flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface-card shadow-brand-soft"
        )}
      >
        <header className="border-b border-hairline px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id={titleId}
                className="font-display text-display-md text-ink"
              >
                Setup guide
              </h2>
              <p className="mt-1 font-body text-body-sm text-muted">
                {completed} of {total} steps complete — progress updates from
                your live data.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-full border border-hairline text-lg font-bold text-ink hover:bg-canvas-soft"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-pill bg-canvas-soft">
            <div
              className="h-full rounded-pill bg-primary transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <ol className="flex flex-col gap-3">
            {ONBOARDING_STEPS.map((step, index) => {
              const done = checklist[step.id];
              return (
                <li key={step.id}>
                  <Card
                    padding="sm"
                    className={cn(
                      done && "border-primary/30 bg-canvas-soft/60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold",
                          done
                            ? "bg-primary text-on-primary"
                            : "border border-hairline bg-surface-card text-muted"
                        )}
                        aria-hidden
                      >
                        {done ? "✓" : index + 1}
                      </span>
                      <div>
                        <p
                          className={cn(
                            "font-body text-body-md font-medium",
                            done ? "text-muted line-through" : "text-ink"
                          )}
                        >
                          {step.label}
                        </p>
                        {!done ? (
                          <p className="mt-1 font-body text-body-sm text-muted">
                            {step.hint}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Storefront profile
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Shown on your customer menu page.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label="Tagline"
                value={taglineDraft}
                onChange={(event) => setTaglineDraft(event.target.value)}
                placeholder="Premium grills"
                disabled={profileSaving}
              />
              <Input
                label="Location"
                value={locationDraft}
                onChange={(event) => setLocationDraft(event.target.value)}
                placeholder="Kigali, Rwanda"
                disabled={profileSaving}
              />
              <Input
                label="Delivery time"
                value={deliveryTimeDraft}
                onChange={(event) => setDeliveryTimeDraft(event.target.value)}
                placeholder="30–40 min"
                disabled={profileSaving}
              />
              <Input
                label="Rating (optional)"
                type="number"
                inputMode="decimal"
                min={0}
                max={5}
                step={0.1}
                value={ratingDraft}
                onChange={(event) => setRatingDraft(event.target.value)}
                placeholder="4.8"
                disabled={profileSaving}
              />
              <Button
                size="default"
                onClick={() => void handleSaveProfile()}
                disabled={profileSaving || !hasToken}
              >
                {profileSaving ? "Saving…" : "Save profile"}
              </Button>
              {!hasToken ? (
                <p className="font-body text-body-sm text-muted">
                  This device isn&apos;t unlocked yet. Use{" "}
                  <Link
                    href="/onboard?recover=1"
                    className="text-primary underline underline-offset-2"
                  >
                    Recover access
                  </Link>{" "}
                  to edit your store.
                </p>
              ) : null}
              {profileSaved ? (
                <p className="font-body text-body-sm text-primary">
                  Profile saved. Refresh your menu page to see changes.
                </p>
              ) : null}
              {profileError ? (
                <p className="font-body text-body-sm text-error" role="alert">
                  {profileError}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Owner access
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Editing is unlocked automatically on the device you set up your
              store with — there is no code to type. On a new device or after
              clearing your browser, recover access with your storefront URL and
              signup phone number.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-brand-md border px-3 py-2 font-body text-body-sm",
                  hasToken
                    ? "border-primary/40 text-primary"
                    : "border-hairline text-muted"
                )}
              >
                <span aria-hidden="true">{hasToken ? "🔓" : "🔒"}</span>
                <span>
                  {hasToken
                    ? "This device is unlocked."
                    : "This device is not unlocked."}
                </span>
              </div>
              {!hasToken ? (
                <Link
                  href="/onboard?recover=1"
                  className="inline-flex h-10 min-h-10 w-full items-center justify-center rounded-pill bg-primary px-5 font-body text-button font-medium text-on-primary transition-colors hover:bg-primary-active"
                >
                  Recover access
                </Link>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">Tips</h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Coachmarks appear once on key controls. Use the button below to
              show them again.
            </p>
            <Button
              size="default"
              variant="outline"
              className="mt-4 w-full"
              onClick={handleShowTipsAgain}
            >
              Show tips again
            </Button>
            {tipsReset ? (
              <p className="mt-2 font-body text-body-sm text-primary">
                Tips will reappear on the relevant tabs.
              </p>
            ) : null}
          </section>
        </div>
      </aside>
    </div>
  );
}
