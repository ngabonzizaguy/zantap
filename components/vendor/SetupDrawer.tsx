"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { MenuItem, PayoutMethod } from "@/lib/types";
import { Button, Card, Input, Select } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { splitPhoneForDisplay } from "@/lib/format";
import { checkSlugAvailable } from "@/lib/actions/vendor-provision";
import { updateVendorProfile, uploadBrandingImage } from "@/lib/actions/vendor-profile";
import { getDisplayHostPrefix } from "@/lib/base-url";
import {
  countCompletedSteps,
  ONBOARDING_STEPS,
  type OnboardingChecklist,
} from "@/lib/vendor/onboarding";
import {
  BUSINESS_CATEGORIES,
  DIAL_CODE_SELECT_OPTIONS,
} from "@/lib/vendor/onboard-options";
import {
  countOptionalCompleted,
  deriveOptionalChecklist,
  OPTIONAL_CHECKLIST_ITEMS,
} from "@/lib/vendor/optional-checklist";
import {
  getOnboardingDestination,
  getOptionalDestination,
} from "@/lib/vendor/setup-destinations";
import { isValidVendorSlug, normalizeVendorSlug } from "@/lib/vendor/slug";
import {
  transferOwnerTokenCache,
  useOwnerToken,
} from "@/lib/vendor/useOwnerToken";
import { DriversPanel } from "@/components/vendor/DriversPanel";
import { StorefrontQr } from "@/components/onboard/StorefrontQr";
import { getStorefrontUrl } from "@/lib/base-url";

export interface StorefrontProfile {
  tagline?: string;
  location?: string;
  deliveryTime?: string;
  rating?: number;
  logoUrl?: string;
  coverImageUrl?: string;
  description?: string;
}

export interface VendorBusinessProfile {
  name: string;
  slug: string;
  phoneNumber: string;
  businessCategory?: string;
}

export interface VendorPaymentProfile {
  payoutMethod: PayoutMethod;
  momoCode: string;
}

type SlugAvailability = "idle" | "checking" | "available" | "taken" | "invalid";

const SLUG_DEBOUNCE_MS = 400;

function slugStatusMessage(status: SlugAvailability): string | null {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "available":
      return "Available!";
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
      return "text-muted";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

interface SetupDrawerProps {
  open: boolean;
  onClose: () => void;
  checklist: OnboardingChecklist;
  vendorSlug: string;
  business: VendorBusinessProfile;
  payments: VendorPaymentProfile;
  profile: StorefrontProfile;
  menu: MenuItem[];
  drivers?: import("@/lib/types").Driver[];
  onProfileSaved?: (profile: StorefrontProfile) => void;
  onBusinessSaved?: (business: VendorBusinessProfile) => void;
  onPaymentsSaved?: (payments: VendorPaymentProfile) => void;
  onRefresh?: () => void;
  onNavigateTab?: (tab: import("@/components/vendor/Tabs").KdsTab) => void;
  /** Opens the kitchen directly from the "Open the kitchen" step. */
  onOpenKitchen?: () => void;
  onDriversChange?: (drivers: import("@/lib/types").Driver[]) => void;
}

export function SetupDrawer({
  open,
  onClose,
  checklist,
  vendorSlug,
  business,
  payments,
  profile,
  menu,
  drivers,
  onProfileSaved,
  onBusinessSaved,
  onPaymentsSaved,
  onRefresh,
  onNavigateTab,
  onOpenKitchen,
  onDriversChange,
}: SetupDrawerProps) {
  const [driversExpanded, setDriversExpanded] = useState(false);
  const router = useRouter();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const { token, hasToken } = useOwnerToken(vendorSlug);
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

  const [nameDraft, setNameDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [slugStatus, setSlugStatus] = useState<SlugAvailability>("idle");
  const [phoneDialCodeDraft, setPhoneDialCodeDraft] = useState("+250");
  const [phoneLocalDraft, setPhoneLocalDraft] = useState("");
  const [categoryDraft, setCategoryDraft] = useState("");
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessSaved, setBusinessSaved] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [payoutMethodDraft, setPayoutMethodDraft] =
    useState<PayoutMethod>("MERCHANT_CODE");
  const [merchantCodeDraft, setMerchantCodeDraft] = useState("");
  const [payoutPhoneDraft, setPayoutPhoneDraft] = useState("");
  const [payoutSameAsBusiness, setPayoutSameAsBusiness] = useState(true);
  const [paymentsSaving, setPaymentsSaving] = useState(false);
  const [paymentsSaved, setPaymentsSaved] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

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
    () => getStorefrontUrl(slugDraft || vendorSlug),
    [slugDraft, vendorSlug]
  );
  const normalizedSlugDraft = normalizeVendorSlug(slugDraft);
  const hostPrefix = getDisplayHostPrefix();

  // Instant idle/available/invalid/checking feedback while typing ("adjust
  // state during render"); the debounced availability probe stays in the effect.
  const [prevSlugKey, setPrevSlugKey] = useState({ open, slugDraft, vendorSlug });
  if (
    prevSlugKey.open !== open ||
    prevSlugKey.slugDraft !== slugDraft ||
    prevSlugKey.vendorSlug !== vendorSlug
  ) {
    setPrevSlugKey({ open, slugDraft, vendorSlug });
    if (open) {
      if (!normalizedSlugDraft) {
        setSlugStatus("idle");
      } else if (normalizedSlugDraft === normalizeVendorSlug(vendorSlug)) {
        setSlugStatus("available");
      } else if (!isValidVendorSlug(slugDraft)) {
        setSlugStatus("invalid");
      } else {
        setSlugStatus("checking");
      }
    }
  }

  useEffect(() => {
    if (!open) return;
    if (!normalizedSlugDraft) return;
    if (normalizedSlugDraft === normalizeVendorSlug(vendorSlug)) return;
    if (!isValidVendorSlug(slugDraft)) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void checkSlugAvailable(normalizedSlugDraft).then((available) => {
        if (!cancelled) setSlugStatus(available ? "available" : "taken");
      });
    }, SLUG_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, normalizedSlugDraft, slugDraft, vendorSlug]);

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

  // Re-seed drafts when the drawer opens or saved data changes ("adjust state
  // during render" — no effect, no extra paint).
  const [prevDraftKey, setPrevDraftKey] = useState({
    open,
    profile,
    business,
    payments,
  });
  if (
    prevDraftKey.open !== open ||
    prevDraftKey.profile !== profile ||
    prevDraftKey.business !== business ||
    prevDraftKey.payments !== payments
  ) {
    setPrevDraftKey({ open, profile, business, payments });
    if (open) {
      seedDrafts();
    }
  }

  function seedDrafts() {
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

    setNameDraft(business.name);
    setSlugDraft(business.slug);
    const { dialCode, local } = splitPhoneForDisplay(business.phoneNumber);
    setPhoneDialCodeDraft(dialCode);
    setPhoneLocalDraft(local);
    setCategoryDraft(business.businessCategory ?? BUSINESS_CATEGORIES[0]);
    setBusinessError(null);
    setBusinessSaved(false);

    setPayoutMethodDraft(payments.payoutMethod);
    if (payments.payoutMethod === "MERCHANT_CODE") {
      setMerchantCodeDraft(payments.momoCode);
      setPayoutPhoneDraft("");
      setPayoutSameAsBusiness(true);
    } else {
      setMerchantCodeDraft("");
      setPayoutPhoneDraft(payments.momoCode);
      const payoutLocal = splitPhoneForDisplay(payments.momoCode).local;
      setPayoutSameAsBusiness(payoutLocal === local);
    }
    setPaymentsError(null);
    setPaymentsSaved(false);
  }

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

  const handleSaveBusiness = async () => {
    if (!token) {
      setBusinessError(
        "This device isn't unlocked. Recover access to edit your profile."
      );
      return;
    }

    if (!nameDraft.trim()) {
      setBusinessError("Business name is required.");
      return;
    }
    if (slugStatus !== "available") {
      setBusinessError("Choose an available storefront URL before saving.");
      return;
    }
    if (phoneLocalDraft.trim().length < 6) {
      setBusinessError("A valid phone number is required.");
      return;
    }

    setBusinessSaving(true);
    setBusinessError(null);
    setBusinessSaved(false);

    try {
      const phoneNumber = `${phoneDialCodeDraft} ${phoneLocalDraft}`.trim();
      const updated = await updateVendorProfile(token, vendorSlug, {
        name: nameDraft,
        slug: slugDraft,
        phoneNumber,
        businessCategory: categoryDraft,
      });
      const savedBusiness: VendorBusinessProfile = {
        name: updated.name,
        slug: updated.slug,
        phoneNumber: updated.phoneNumber,
        businessCategory: updated.businessCategory,
      };
      onBusinessSaved?.(savedBusiness);

      const slugChanged = updated.slug !== vendorSlug;
      if (slugChanged) {
        transferOwnerTokenCache(vendorSlug, updated.slug);
        router.replace(`/vendor/${updated.slug}?tab=drivers`);
        return;
      }

      setBusinessSaved(true);
      window.setTimeout(() => setBusinessSaved(false), 2000);
    } catch (error) {
      setBusinessError(mapOwnerTokenError(error));
    } finally {
      setBusinessSaving(false);
    }
  };

  const handleSavePayments = async () => {
    if (!token) {
      setPaymentsError(
        "This device isn't unlocked. Recover access to edit your profile."
      );
      return;
    }

    const payoutLocal = payoutSameAsBusiness
      ? phoneLocalDraft.trim()
      : payoutPhoneDraft.trim();
    const momoCode =
      payoutMethodDraft === "MERCHANT_CODE"
        ? merchantCodeDraft.trim()
        : payoutSameAsBusiness
          ? `${phoneDialCodeDraft} ${phoneLocalDraft}`.trim()
          : `${phoneDialCodeDraft} ${payoutPhoneDraft}`.trim();

    if (payoutMethodDraft === "MERCHANT_CODE" && !/^\d{6}$/.test(momoCode)) {
      setPaymentsError("MoMo merchant code must be exactly 6 digits.");
      return;
    }
    if (payoutMethodDraft === "PHONE" && payoutLocal.length < 6) {
      setPaymentsError("A valid MoMo payout phone number is required.");
      return;
    }

    setPaymentsSaving(true);
    setPaymentsError(null);
    setPaymentsSaved(false);

    try {
      const updated = await updateVendorProfile(token, vendorSlug, {
        payoutMethod: payoutMethodDraft,
        momoCode,
      });
      onPaymentsSaved?.({
        payoutMethod: updated.payoutMethod,
        momoCode: updated.momoCode,
      });
      setPaymentsSaved(true);
      window.setTimeout(() => setPaymentsSaved(false), 2000);
    } catch (error) {
      setPaymentsError(mapOwnerTokenError(error));
    } finally {
      setPaymentsSaving(false);
    }
  };

  const brandingBusy = logoUploadBusy || coverUploadBusy;
  const profileFieldsDisabled =
    profileSaving || brandingBusy || businessSaving || paymentsSaving;
  const businessFieldsDisabled = businessSaving || paymentsSaving || brandingBusy;
  const paymentsFieldsDisabled = paymentsSaving || businessSaving || brandingBusy;
  const slugMessage = slugStatusMessage(slugStatus);
  const merchantCodeValid = /^\d{6}$/.test(merchantCodeDraft.trim());
  const payoutPhoneLocal = payoutSameAsBusiness
    ? phoneLocalDraft.trim()
    : payoutPhoneDraft.trim();
  const payoutPhoneValid = payoutPhoneLocal.length >= 6;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close setup guide"
        className="zt-overlay-enter absolute inset-0 bg-canvas-deep/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "zt-drawer-enter relative z-10 flex h-full w-full max-w-md flex-col border-l border-hairline bg-surface-card shadow-brand-soft"
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
              const destination = getOnboardingDestination(step.id);
              const handleStepClick = () => {
                if (destination.kind === "open-kitchen") {
                  onOpenKitchen?.();
                  return;
                }
                if (destination.kind === "anchor") {
                  document.getElementById(destination.anchorId)?.scrollIntoView({ behavior: "smooth" });
                  return;
                }
                if (!onNavigateTab) return;
                onNavigateTab(destination.tab);
                onClose();
              };
              const clickable = destination.kind === "open-kitchen"
                ? !!onOpenKitchen
                : !!onNavigateTab;
              return (
                <li key={step.id}>
                  <Card
                    padding="sm"
                    className={cn(
                      done && "border-primary/30 bg-canvas-soft/60",
                      clickable && "cursor-pointer hover:border-primary/30"
                    )}
                    {...(clickable
                      ? {
                          onClick: handleStepClick,
                          role: "button",
                          tabIndex: 0,
                          onKeyDown: (event: React.KeyboardEvent) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleStepClick();
                            }
                          },
                        }
                      : {})}
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
                const destination = getOptionalDestination(item.id);
                const clickable = !item.comingSoon && destination !== null;
                const handleOptionalClick = () => {
                  if (!destination) return;
                  if (destination.kind === "tab") {
                    onNavigateTab?.(destination.tab);
                    onClose();
                    return;
                  }
                  if (destination.kind !== "anchor") return;
                  const target = panelRef.current?.querySelector<HTMLElement>(
                    `#${destination.anchorId}`
                  );
                  if (!target) return;
                  target.scrollIntoView({ behavior: "smooth", block: "center" });
                  const field =
                    target instanceof HTMLTextAreaElement ||
                    target instanceof HTMLInputElement
                      ? target
                      : target.querySelector<HTMLElement>("input, textarea");
                  field?.focus({ preventScroll: true });
                };
                return (
                  <li
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 rounded-brand-md border border-hairline px-3 py-2.5",
                      clickable && "cursor-pointer hover:border-primary/30"
                    )}
                    {...(clickable
                      ? {
                          onClick: handleOptionalClick,
                          role: "button",
                          tabIndex: 0,
                          onKeyDown: (event: React.KeyboardEvent) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              handleOptionalClick();
                            }
                          },
                        }
                      : {})}
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
              Business settings
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Your storefront URL, contact number, and category.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Input
                label="Business name"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder="Inka Steakhouse"
                maxLength={80}
                disabled={businessFieldsDisabled}
              />
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="setup-slug"
                  className="font-body text-body-sm font-medium text-ink"
                >
                  Storefront URL
                </label>
                <div className="flex items-stretch overflow-hidden rounded-brand-md border border-hairline-strong bg-surface-card focus-within:border-2 focus-within:border-ink">
                  {hostPrefix ? (
                    <span className="flex items-center whitespace-nowrap border-r border-hairline-strong bg-canvas-soft px-3 font-body text-body-sm text-muted">
                      {hostPrefix}
                    </span>
                  ) : null}
                  <input
                    id="setup-slug"
                    className="h-12 min-w-0 flex-1 bg-transparent px-3 font-body text-body-md text-ink placeholder:text-muted-soft focus:outline-none disabled:cursor-not-allowed disabled:text-muted-soft"
                    value={slugDraft}
                    onChange={(event) => setSlugDraft(event.target.value)}
                    placeholder="inka-steakhouse"
                    autoComplete="off"
                    spellCheck={false}
                    disabled={businessFieldsDisabled}
                  />
                  {slugStatus === "available" ? (
                    <span
                      className="flex items-center pr-3 text-success"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  ) : null}
                </div>
                {slugMessage ? (
                  <p
                    className={`font-body text-caption ${slugStatusClass(slugStatus)}`}
                    role="status"
                  >
                    {slugMessage}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="setup-phone"
                  className="font-body text-body-sm font-medium text-ink"
                >
                  Phone number
                </label>
                <div className="flex items-stretch gap-2">
                  <Select
                    ariaLabel="Country code"
                    value={phoneDialCodeDraft}
                    onChange={setPhoneDialCodeDraft}
                    options={DIAL_CODE_SELECT_OPTIONS}
                    className="shrink-0"
                    triggerClassName="h-12 w-[6.75rem] px-2"
                    disabled={businessFieldsDisabled}
                  />
                  <input
                    id="setup-phone"
                    type="tel"
                    className={cn(
                      "h-12 min-w-0 flex-1 rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-ink focus:outline-none",
                      businessFieldsDisabled &&
                        "cursor-not-allowed bg-canvas-soft text-muted-soft"
                    )}
                    value={phoneLocalDraft}
                    onChange={(event) => setPhoneLocalDraft(event.target.value)}
                    placeholder="781 234 567"
                    autoComplete="tel-national"
                    disabled={businessFieldsDisabled}
                  />
                </div>
                <p className="font-body text-caption text-muted">
                  Used for customer contact, account recovery, and your
                  storefront call button.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="setup-category"
                  className="font-body text-body-sm font-medium text-ink"
                >
                  Business category
                </label>
                <select
                  id="setup-category"
                  className={cn(
                    "h-12 w-full rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink focus:border-2 focus:border-ink focus:outline-none",
                    businessFieldsDisabled &&
                      "cursor-not-allowed bg-canvas-soft text-muted-soft"
                  )}
                  value={categoryDraft}
                  onChange={(event) => setCategoryDraft(event.target.value)}
                  disabled={businessFieldsDisabled}
                >
                  {BUSINESS_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="default"
                onClick={() => void handleSaveBusiness()}
                disabled={businessFieldsDisabled || !hasToken}
              >
                {businessSaving ? "Saving…" : "Save business"}
              </Button>
              {businessSaved ? (
                <p className="font-body text-body-sm text-primary">
                  Business settings saved.
                </p>
              ) : null}
              {businessError ? (
                <p className="font-body text-body-sm text-error" role="alert">
                  {businessError}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Payment settings
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Where MoMo payments land for your storefront.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethodDraft("MERCHANT_CODE")}
                  disabled={paymentsFieldsDisabled}
                  className={cn(
                    "rounded-brand-lg border px-4 py-3 text-left transition-colors",
                    payoutMethodDraft === "MERCHANT_CODE"
                      ? "border-primary bg-primary/5"
                      : "border-hairline bg-surface-card"
                  )}
                >
                  <span className="font-body text-body-md font-medium text-ink">
                    MoMo merchant code
                  </span>
                  <span className="mt-0.5 block font-body text-body-sm text-muted">
                    Receive payments to your MoMo Pay merchant code.
                  </span>
                </button>
                {payoutMethodDraft === "MERCHANT_CODE" ? (
                  <Input
                    label="Merchant code"
                    value={merchantCodeDraft}
                    onChange={(event) =>
                      setMerchantCodeDraft(event.target.value)
                    }
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    disabled={paymentsFieldsDisabled}
                  />
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutMethodDraft("PHONE")}
                  disabled={paymentsFieldsDisabled}
                  className={cn(
                    "rounded-brand-lg border px-4 py-3 text-left transition-colors",
                    payoutMethodDraft === "PHONE"
                      ? "border-primary bg-primary/5"
                      : "border-hairline bg-surface-card"
                  )}
                >
                  <span className="font-body text-body-md font-medium text-ink">
                    Receive to phone number
                  </span>
                  <span className="mt-0.5 block font-body text-body-sm text-muted">
                    Receive payments to your MoMo registered phone.
                  </span>
                </button>
                {payoutMethodDraft === "PHONE" ? (
                  <div className="flex flex-col gap-3 rounded-brand-lg border border-hairline px-4 py-3">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={payoutSameAsBusiness}
                        onChange={(event) =>
                          setPayoutSameAsBusiness(event.target.checked)
                        }
                        disabled={paymentsFieldsDisabled}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-hairline-strong accent-primary"
                      />
                      <span className="font-body text-body-sm text-ink">
                        Payment number is the same as my business number
                      </span>
                    </label>
                    {payoutSameAsBusiness ? (
                      <p className="rounded-brand-md border border-hairline bg-canvas-soft px-3 py-2 font-body text-body-sm text-ink">
                        {phoneDialCodeDraft} {phoneLocalDraft.trim() || "—"}
                      </p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="setup-payout-phone"
                          className="font-body text-body-sm font-medium text-ink"
                        >
                          Payout phone number
                        </label>
                        <div className="flex items-stretch gap-2">
                          <Select
                            ariaLabel="Country code"
                            value={phoneDialCodeDraft}
                            onChange={setPhoneDialCodeDraft}
                            options={DIAL_CODE_SELECT_OPTIONS}
                            className="shrink-0"
                            triggerClassName="h-12 w-[6.75rem] px-2"
                            disabled={paymentsFieldsDisabled}
                          />
                          <input
                            id="setup-payout-phone"
                            type="tel"
                            className={cn(
                              "h-12 min-w-0 flex-1 rounded-brand-md border border-hairline-strong bg-surface-card px-4 font-body text-body-md text-ink placeholder:text-muted-soft focus:border-2 focus:border-ink focus:outline-none",
                              paymentsFieldsDisabled &&
                                "cursor-not-allowed bg-canvas-soft text-muted-soft"
                            )}
                            value={payoutPhoneDraft}
                            onChange={(event) =>
                              setPayoutPhoneDraft(event.target.value)
                            }
                            placeholder="781 234 567"
                            disabled={paymentsFieldsDisabled}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <Button
                size="default"
                onClick={() => void handleSavePayments()}
                disabled={
                  paymentsFieldsDisabled ||
                  !hasToken ||
                  (payoutMethodDraft === "MERCHANT_CODE"
                    ? !merchantCodeValid
                    : !payoutPhoneValid)
                }
              >
                {paymentsSaving ? "Saving…" : "Save payments"}
              </Button>
              {paymentsSaved ? (
                <p className="font-body text-body-sm text-primary">
                  Payment settings saved.
                </p>
              ) : null}
              {paymentsError ? (
                <p className="font-body text-body-sm text-error" role="alert">
                  {paymentsError}
                </p>
              ) : null}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-display-sm text-ink">
              Storefront profile
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Shown on your customer menu page.
            </p>
            <Link
              href={`/${slugDraft || vendorSlug}?from=kds`}
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
              <div id="setup-logo-editor" className="flex flex-col gap-2">
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
              <div id="setup-cover-editor" className="flex flex-col gap-2">
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
              Manage drivers
            </h3>
            <p className="mt-1 font-body text-body-sm text-muted">
              Add delivery drivers here, then assign them from the Orders tab.
            </p>
            <button
              type="button"
              onClick={() => setDriversExpanded((prev) => !prev)}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-brand-lg border border-hairline bg-canvas-soft px-5 font-body text-button font-medium text-ink transition-colors hover:bg-canvas"
            >
              {driversExpanded ? "Hide drivers" : "Show drivers"}
            </button>
            {driversExpanded && drivers && onDriversChange ? (
              <div className="mt-4">
                <DriversPanel
                  vendorSlug={vendorSlug}
                  drivers={drivers}
                  onDriversChange={onDriversChange}
                />
              </div>
            ) : null}
          </section>

          {onNavigateTab ? (
            <section className="mt-8">
              <h3 className="font-display text-display-sm text-ink">
                Inventory
              </h3>
              <p className="mt-1 font-body text-body-sm text-muted">
                Track ingredients, drinks, packaging, and other supplies separately from your menu.
              </p>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab("inventory");
                  onClose();
                }}
                className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-brand-lg border border-hairline bg-canvas-soft px-5 font-body text-button font-medium text-ink transition-colors hover:bg-canvas"
              >
                Open inventory
              </button>
            </section>
          ) : null}

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
                slug={slugDraft || vendorSlug}
                showActions
              />
            </div>
          </section>

        </div>
      </aside>
    </div>
  );
}
