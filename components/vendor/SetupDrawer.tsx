"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { MenuItem } from "@/lib/types";
import { Button, Card, Input } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { updateVendorProfile, uploadBrandingImage } from "@/lib/actions/vendor-profile";
import {
  countCompletedSteps,
  ONBOARDING_STEPS,
  type OnboardingChecklist,
} from "@/lib/vendor/onboarding";
import {
  countOptionalCompleted,
  deriveOptionalChecklist,
  OPTIONAL_CHECKLIST_ITEMS,
} from "@/lib/vendor/optional-checklist";
import { useOwnerToken } from "@/lib/vendor/useOwnerToken";
import { resetCoachmarks } from "@/components/vendor/Coachmark";
import { StorefrontQr } from "@/components/onboard/StorefrontQr";
import { getStorefrontUrl } from "@/lib/vendor/storefront-url";

export interface StorefrontProfile {
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  rating?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
}

interface SetupDrawerProps {
  open: boolean;
  onClose: () => void;
  checklist: OnboardingChecklist;
  vendorSlug: string;
  profile: StorefrontProfile;
  menu: MenuItem[];
  onProfileSaved?: (profile: StorefrontProfile) => void;
  onRefresh?: () => void;
}

export function SetupDrawer({
  open,
  onClose,
  checklist,
  vendorSlug,
  profile,
  menu,
  onProfileSaved,
  onRefresh,
}: SetupDrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const { token, hasToken } = useOwnerToken(vendorSlug);
  const [tipsReset, setTipsReset] = useState(false);
  const [taglineDraft, setTaglineDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [deliveryTimeDraft, setDeliveryTimeDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState("");
  const [logoUrlDraft, setLogoUrlDraft] = useState("");
  const [coverImageUrlDraft, setCoverImageUrlDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [logoUploadBusy, setLogoUploadBusy] = useState(false);
  const [coverUploadBusy, setCoverUploadBusy] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const completed = countCompletedSteps(checklist);
  const total = ONBOARDING_STEPS.length;

  const optionalChecklist = useMemo(
    () =>
      deriveOptionalChecklist(
        {
          logoUrl: profile.logoUrl,
          coverImageUrl: profile.coverImageUrl,
          description: profile.description,
        },
        menu
      ),
    [profile.logoUrl, profile.coverImageUrl, profile.description, menu]
  );
  const optionalProgress = countOptionalCompleted(optionalChecklist);
  const storefrontUrl = useMemo(
    () => getStorefrontUrl(vendorSlug),
    [vendorSlug]
  );

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
    setLogoUrlDraft(profile.logoUrl ?? "");
    setCoverImageUrlDraft(profile.coverImageUrl ?? "");
    setDescriptionDraft(profile.description ?? "");
    setProfileError(null);
    setProfileSaved(false);
  }, [open, profile]);

  const handleShowTipsAgain = () => {
    resetCoachmarks();
    setTipsReset(true);
    window.setTimeout(() => setTipsReset(false), 2000);
  };

  const applySavedProfile = (saved: StorefrontProfile) => {
    onProfileSaved?.(saved);
    setProfileSaved(true);
    window.setTimeout(() => setProfileSaved(false), 2000);
  };

  const mapOwnerTokenError = (error: unknown): string => {
    const message =
      error instanceof Error ? error.message : "Could not save profile.";
    return message.toLowerCase().includes("owner token")
      ? "This device isn't unlocked. Recover access and try again."
      : message;
  };

  const handleBrandingUpload = async (field: "logo" | "cover", file: File) => {
    if (!token) {
      setProfileError(
        "This device isn't unlocked. Recover access to edit your profile."
      );
      return;
    }

    const setBusy = field === "logo" ? setLogoUploadBusy : setCoverUploadBusy;
    setBusy(true);
    setProfileError(null);
    setProfileSaved(false);

    try {
      const formData = new FormData();
      formData.set("file", file);
      const updated = await uploadBrandingImage(token, vendorSlug, field, formData);
      if (field === "logo") {
        setLogoUrlDraft(updated.logoUrl ?? "");
      } else {
        setCoverImageUrlDraft(updated.coverImageUrl ?? "");
      }
      applySavedProfile({
        tagline: updated.tagline,
        location: updated.location,
        deliveryTime: updated.deliveryTime,
        rating: updated.rating,
        logoUrl: updated.logoUrl,
        coverImageUrl: updated.coverImageUrl,
        description: updated.description,
      });
    } catch (error) {
      setProfileError(mapOwnerTokenError(error));
    } finally {
      setBusy(false);
    }
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

    const logoTrimmed = logoUrlDraft.trim();
    if (logoTrimmed && !/^https?:\/\//i.test(logoTrimmed)) {
      setProfileError("Logo must be a valid image URL (https://…).");
      return;
    }
    const coverTrimmed = coverImageUrlDraft.trim();
    if (coverTrimmed && !/^https?:\/\//i.test(coverTrimmed)) {
      setProfileError("Cover must be a valid image URL (https://…).");
      return;
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
        logoUrl: logoUrlDraft,
        coverImageUrl: coverImageUrlDraft,
        description: descriptionDraft,
      });
      onProfileSaved?.({
        tagline: updated.tagline,
        location: updated.location,
        deliveryTime: updated.deliveryTime,
        rating: updated.rating,
        logoUrl: updated.logoUrl,
        coverImageUrl: updated.coverImageUrl,
        description: updated.description,
      });
      setProfileSaved(true);
      window.setTimeout(() => setProfileSaved(false), 2000);
    } catch (error) {
      setProfileError(mapOwnerTokenError(error));
    } finally {
      setProfileSaving(false);
    }
  };

  const brandingBusy = logoUploadBusy || coverUploadBusy;
  const profileFieldsDisabled = profileSaving || brandingBusy;

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
              Keep improving your storefront
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              You&apos;re live and accepting orders — these optional touches just
              help you grow.
            </p>
            <p className="mt-2 font-body text-body-sm font-medium text-ink">
              {optionalProgress.completed} of {optionalProgress.total} completed
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {OPTIONAL_CHECKLIST_ITEMS.map((item) => {
                const done = optionalChecklist[item.id];
                return (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 rounded-brand-md border border-hairline px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 flex-none items-center justify-center rounded-full text-sm font-bold",
                        done
                          ? "bg-primary text-on-primary"
                          : "border border-hairline bg-surface-card text-muted-soft"
                      )}
                      aria-hidden
                    >
                      {done ? "✓" : ""}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={cn(
                            "font-body text-body-md font-medium",
                            done ? "text-muted line-through" : "text-ink"
                          )}
                        >
                          {item.label}
                        </p>
                        {item.comingSoon ? (
                          <span className="rounded-pill border border-hairline px-2 py-0.5 font-body text-caption text-muted-soft">
                            Soon
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 font-body text-body-sm text-muted">
                        {item.hint}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Storefront profile
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Shown on your customer menu page.
            </p>
            <Link
              href={`/${vendorSlug}?from=kds`}
              className="mt-4 inline-flex h-10 min-h-10 w-full items-center justify-center rounded-brand-lg border border-hairline bg-canvas-soft px-5 font-body text-button font-medium text-ink transition-colors hover:bg-canvas"
            >
              Preview storefront
            </Link>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label="Tagline"
                value={taglineDraft}
                onChange={(event) => setTaglineDraft(event.target.value)}
                placeholder="Premium grills"
                disabled={profileFieldsDisabled}
              />
              <Input
                label="Location"
                value={locationDraft}
                onChange={(event) => setLocationDraft(event.target.value)}
                placeholder="Kigali, Rwanda"
                disabled={profileFieldsDisabled}
              />
              <Input
                label="Delivery time"
                value={deliveryTimeDraft}
                onChange={(event) => setDeliveryTimeDraft(event.target.value)}
                placeholder="30–40 min"
                disabled={profileFieldsDisabled}
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
                disabled={profileFieldsDisabled}
              />
              <div className="flex flex-col gap-2">
                <Input
                  label="Logo URL"
                  type="url"
                  inputMode="url"
                  value={logoUrlDraft}
                  onChange={(event) => setLogoUrlDraft(event.target.value)}
                  placeholder="https://…/logo.png"
                  disabled={profileFieldsDisabled}
                />
                <input
                  ref={logoFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void handleBrandingUpload("logo", file);
                  }}
                />
                <Button
                  size="default"
                  variant="outline"
                  disabled={profileFieldsDisabled || !hasToken}
                  onClick={() => logoFileInputRef.current?.click()}
                >
                  {logoUploadBusy ? "Uploading logo…" : "Upload logo"}
                </Button>
                {logoUrlDraft ? (
                  <div className="overflow-hidden rounded-brand-md border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrlDraft}
                      alt="Logo preview"
                      className="h-20 w-full object-contain object-center bg-canvas-soft p-2"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  label="Cover image URL"
                  type="url"
                  inputMode="url"
                  value={coverImageUrlDraft}
                  onChange={(event) => setCoverImageUrlDraft(event.target.value)}
                  placeholder="https://…/cover.jpg"
                  disabled={profileFieldsDisabled}
                />
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void handleBrandingUpload("cover", file);
                  }}
                />
                <Button
                  size="default"
                  variant="outline"
                  disabled={profileFieldsDisabled || !hasToken}
                  onClick={() => coverFileInputRef.current?.click()}
                >
                  {coverUploadBusy ? "Uploading cover…" : "Upload cover"}
                </Button>
                {coverImageUrlDraft ? (
                  <div className="overflow-hidden rounded-brand-md border border-hairline">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverImageUrlDraft}
                      alt="Cover preview"
                      className="aspect-[3/1] w-full object-cover object-center"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex w-full flex-col gap-1.5">
                <label
                  htmlFor="vendor-description"
                  className="font-body text-body-sm font-medium text-ink"
                >
                  Business description
                </label>
                <textarea
                  id="vendor-description"
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  placeholder="Tell your story — what makes your kitchen special."
                  disabled={profileFieldsDisabled}
                  rows={3}
                  className={cn(
                    "w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 py-3 font-body text-body-md text-ink",
                    "placeholder:text-muted-soft",
                    "focus:border-2 focus:border-ink focus:outline-none",
                    profileFieldsDisabled &&
                      "cursor-not-allowed bg-canvas-soft text-muted-soft"
                  )}
                />
              </div>
              <Button
                size="default"
                onClick={() => void handleSaveProfile()}
                disabled={profileFieldsDisabled || !hasToken}
              >
                {profileSaving ? "Saving…" : "Save profile"}
              </Button>
              {!hasToken ? (
                <p className="font-body text-body-sm text-muted">
                  This device isn&apos;t unlocked yet. Use{" "}
                  <Link
                    href="/onboard?recover=1"
                    className="font-medium text-gold underline underline-offset-2 hover:text-gold/80"
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
                  className="inline-flex h-10 min-h-10 w-full items-center justify-center rounded-brand-lg border border-gold/50 bg-gold/10 px-5 font-body text-button font-medium text-gold transition-colors hover:border-gold hover:bg-gold/20"
                >
                  Recover access
                </Link>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Storefront QR
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Print or download a QR code so customers can open your menu on
              their phone.
            </p>
            <div className="mt-4">
              <StorefrontQr
                url={storefrontUrl}
                slug={vendorSlug}
                showActions
              />
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
