"use client";

import { useCallback, useEffect, useState } from "react";
import { provisionVendor } from "@/lib/actions/vendor-provision";
import { cacheOwnerToken } from "@/lib/vendor/useOwnerToken";
import { useProvisionSecret } from "@/lib/vendor/useProvisionSecret";
import { Card } from "@/components/ui/primitives";
import { GateStep } from "@/components/onboard/steps/GateStep";
import {
  BusinessStep,
  type BusinessFormValues,
} from "@/components/onboard/steps/BusinessStep";
import {
  FirstDishStep,
  type FirstDishFormValues,
} from "@/components/onboard/steps/FirstDishStep";
import { SuccessStep } from "@/components/onboard/steps/SuccessStep";

type WizardStep = "gate" | "business" | "first-dish" | "success";

const EMPTY_BUSINESS: BusinessFormValues = {
  name: "",
  slug: "",
  phoneNumber: "",
  momoCode: "",
};

const EMPTY_DISH: FirstDishFormValues = {
  name: "",
  priceRwf: "",
};

function provisionErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (
      error.message.includes("provision secret") ||
      error.message === "Invalid or missing provision secret"
    ) {
      return "Invalid setup code. Check with your operator and try again.";
    }
    if (error.message.includes("storefront URL is already taken")) {
      return "This storefront URL was just taken. Go back and choose another.";
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function OnboardWizard() {
  const { secret, setSecret, ready, hasSecret } = useProvisionSecret();
  const [step, setStep] = useState<WizardStep>("gate");
  const [gateInput, setGateInput] = useState("");
  const [business, setBusiness] = useState<BusinessFormValues>(EMPTY_BUSINESS);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [dish, setDish] = useState<FirstDishFormValues>(EMPTY_DISH);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdSlug, setCreatedSlug] = useState("");
  const [createdName, setCreatedName] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (hasSecret) {
      setGateInput((current) => current || secret || "");
      setStep((current) => (current === "gate" ? "business" : current));
    }
  }, [ready, hasSecret, secret]);

  const handleGateContinue = useCallback(() => {
    setSecret(gateInput);
    setStep("business");
  }, [gateInput, setSecret]);

  const handleProvision = useCallback(async () => {
    if (!secret) {
      setSubmitError("Setup code missing. Go back and enter your code.");
      setStep("gate");
      return;
    }

    const priceRwf = Number.parseInt(dish.priceRwf, 10);
    setSubmitting(true);
    setSubmitError(null);

    try {
      const result = await provisionVendor(
        {
          name: business.name,
          slug: business.slug,
          phoneNumber: business.phoneNumber,
          momoCode: business.momoCode,
        },
        {
          name: dish.name,
          priceRwf,
        }
      );
      // Owner token is returned exactly once — cache it (keyed by slug) so the
      // new vendor can immediately edit their menu without ever typing it.
      cacheOwnerToken(result.vendor.slug, result.ownerToken);
      setCreatedSlug(result.vendor.slug);
      setCreatedName(result.vendor.name);
      setStep("success");
    } catch (error) {
      setSubmitError(provisionErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }, [secret, business, dish]);

  const stepNumber =
    step === "gate"
      ? 1
      : step === "business"
        ? 2
        : step === "first-dish"
          ? 3
          : 3;

  const showProgress = step !== "success";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <header className="mb-8 text-center">
          <p className="font-body text-caption uppercase tracking-wider text-muted-soft">
            ZanTap
          </p>
          <h1 className="mt-2 font-display text-display-md text-ink">
            Set up your restaurant
          </h1>
          {showProgress ? (
            <p className="mt-2 font-body text-body-sm text-muted">
              Step {stepNumber} of 3
            </p>
          ) : null}
        </header>

        <Card padding="lg">
          {step === "gate" ? (
            <GateStep
              value={gateInput}
              onChange={setGateInput}
              onContinue={handleGateContinue}
            />
          ) : null}

          {step === "business" ? (
            <BusinessStep
              values={business}
              onChange={setBusiness}
              slugManuallyEdited={slugManuallyEdited}
              onSlugManuallyEdited={() => setSlugManuallyEdited(true)}
              onBack={
                hasSecret
                  ? () => {
                      setGateInput(secret ?? "");
                      setStep("gate");
                    }
                  : undefined
              }
              onContinue={() => setStep("first-dish")}
            />
          ) : null}

          {step === "first-dish" ? (
            <FirstDishStep
              values={dish}
              onChange={setDish}
              onBack={() => setStep("business")}
              onSubmit={() => void handleProvision()}
              submitting={submitting}
              error={submitError}
            />
          ) : null}

          {step === "success" ? (
            <SuccessStep slug={createdSlug} vendorName={createdName} />
          ) : null}
        </Card>
      </div>
    </div>
  );
}
