"use client";

import { useCallback, useEffect, useState } from "react";
import { provisionVendor } from "@/lib/actions/vendor-provision";
import { updateMenuItem, uploadMenuImage } from "@/lib/actions/vendor-menu";
import { cacheOwnerToken } from "@/lib/vendor/useOwnerToken";
import { getStorefrontUrl } from "@/lib/base-url";
import {
  BUSINESS_CATEGORIES,
  DEFAULT_COUNTRY,
  DEFAULT_MENU_CATEGORY,
  MENU_CATEGORIES,
} from "@/lib/vendor/onboard-options";
import { WizardProgress } from "@/components/onboard/WizardProgress";
import { RecoverAccessDialog } from "@/components/onboard/RecoverAccessDialog";
import { SplashStep } from "@/components/onboard/steps/SplashStep";
import { BusinessStep } from "@/components/onboard/steps/BusinessStep";
import { PaymentsStep } from "@/components/onboard/steps/PaymentsStep";
import { QuickMenuStep } from "@/components/onboard/steps/QuickMenuStep";
import { ReviewStep } from "@/components/onboard/steps/ReviewStep";
import { LiveStep } from "@/components/onboard/steps/LiveStep";
import type { WizardData, WizardStep } from "@/components/onboard/types";

const EMPTY_DATA: WizardData = {
  name: "",
  slug: "",
  countryDialCode: DEFAULT_COUNTRY.dialCode,
  phoneLocal: "",
  businessCategory: BUSINESS_CATEGORIES[0],
  payoutMethod: "MERCHANT_CODE",
  merchantCode: "",
  payoutPhone: "",
  payoutSameAsBusiness: true,
  dishName: "",
  dishPriceRwf: "",
  dishCategory: MENU_CATEGORIES[0],
  dishPhoto: null,
};

/** Steps that render the "Step N of 6" progress header, in order. */
const PROGRESS_STEPS: WizardStep[] = [
  "business",
  "payments",
  "menu",
  "review",
];

function provisionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("already taken")) {
      return "This storefront URL was just taken. Go back and choose another.";
    }
    if (error.message.toLowerCase().includes("temporarily closed")) {
      return "Signups are paused right now. Please try again later.";
    }
    if (error.message.toLowerCase().includes("too many")) {
      return "Too many attempts. Please wait a minute and try again.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function OnboardWizard() {
  const [step, setStep] = useState<WizardStep>("splash");
  const [data, setData] = useState<WizardData>(EMPTY_DATA);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [created, setCreated] = useState<{
    slug: string;
    name: string;
  } | null>(null);

  const update = useCallback((patch: Partial<WizardData>) => {
    setData((current) => ({ ...current, ...patch }));
  }, []);

  // Deep link from the KDS Setup drawer (/onboard?recover=1) opens recovery
  // directly. Read from the URL (client-only) to avoid a Suspense boundary.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("recover") === "1") {
      setRecoverOpen(true);
    }
  }, []);

  const handleGoLive = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);

    const payoutLocal = data.payoutSameAsBusiness
      ? data.phoneLocal.trim()
      : data.payoutPhone.trim();
    const momoCode =
      data.payoutMethod === "MERCHANT_CODE"
        ? data.merchantCode.trim()
        : `${data.countryDialCode} ${payoutLocal}`.trim();
    const priceRwf = Number.parseInt(data.dishPriceRwf, 10);

    try {
      const result = await provisionVendor(
        {
          name: data.name,
          slug: data.slug,
          phoneNumber: `${data.countryDialCode} ${data.phoneLocal}`.trim(),
          momoCode,
          businessCategory: data.businessCategory,
          payoutMethod: data.payoutMethod,
        },
        { name: data.dishName, priceRwf }
      );

      // Owner token is returned exactly once — cache it (keyed by slug) so the
      // new vendor edits their store with zero typing (ADR-0022).
      cacheOwnerToken(result.vendor.slug, result.ownerToken);

      // Post-provision finalize (decision 7): the starter item is created with
      // the default category and no photo. Persist the chosen category and the
      // optional first-dish photo now, keyed to the new item and owner token.
      // Non-fatal: the store is already live if these fail.
      if (result.menuItem) {
        const itemId = result.menuItem.id;
        if (
          data.dishCategory &&
          data.dishCategory !== DEFAULT_MENU_CATEGORY
        ) {
          try {
            await updateMenuItem(result.ownerToken, result.vendor.slug, itemId, {
              category: data.dishCategory,
            });
          } catch {
            // leave as default category — vendor can fix it in KDS
          }
        }
        if (data.dishPhoto) {
          try {
            const formData = new FormData();
            formData.append("file", data.dishPhoto);
            await uploadMenuImage(
              result.ownerToken,
              result.vendor.slug,
              itemId,
              formData
            );
          } catch {
            // non-fatal — photo can be added from the KDS menu tab
          }
        }
      }

      setCreated({ slug: result.vendor.slug, name: result.vendor.name });
      setStep("live");
    } catch (error) {
      setSubmitError(provisionErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [data]);

  const progressCurrent = PROGRESS_STEPS.indexOf(step) + 1;
  const showProgress = progressCurrent > 0;
  const storefrontPath = created ? `/${created.slug}` : "/";
  const storefrontPreviewPath = created ? `/${created.slug}?from=kds` : "/";
  const storefrontUrl = created ? getStorefrontUrl(created.slug) : storefrontPath;

  return (
    <div className="kds-dark min-h-screen bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
        {showProgress ? (
          <WizardProgress
            current={progressCurrent}
            onBack={() => {
              const index = PROGRESS_STEPS.indexOf(step);
              setSubmitError(null);
              if (index <= 0) {
                setStep("splash");
              } else {
                setStep(PROGRESS_STEPS[index - 1]);
              }
            }}
          />
        ) : null}

        {step === "splash" ? (
          <SplashStep
            onGetStarted={() => setStep("business")}
            onRecoverAccess={() => setRecoverOpen(true)}
          />
        ) : null}

        {step === "business" ? (
          <BusinessStep
            data={data}
            update={update}
            slugManuallyEdited={slugManuallyEdited}
            onSlugManuallyEdited={() => setSlugManuallyEdited(true)}
            onContinue={() => setStep("payments")}
          />
        ) : null}

        {step === "payments" ? (
          <PaymentsStep
            data={data}
            update={update}
            onContinue={() => setStep("menu")}
          />
        ) : null}

        {step === "menu" ? (
          <QuickMenuStep
            data={data}
            update={update}
            onContinue={() => setStep("review")}
          />
        ) : null}

        {step === "review" ? (
          <ReviewStep
            data={data}
            onEdit={(target) => {
              setSubmitError(null);
              setStep(target);
            }}
            onGoLive={() => void handleGoLive()}
            submitting={submitting}
            error={submitError}
          />
        ) : null}

        {step === "live" && created ? (
          <LiveStep
            vendorName={created.name}
            slug={created.slug}
            storefrontUrl={storefrontUrl}
            storefrontPreviewPath={storefrontPreviewPath}
          />
        ) : null}
      </div>

      <RecoverAccessDialog
        open={recoverOpen}
        onClose={() => setRecoverOpen(false)}
      />
    </div>
  );
}
