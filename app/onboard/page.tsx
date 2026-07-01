import { OnboardWizard } from "@/components/onboard/OnboardWizard";

// Self-serve onboarding is open by default (ADR-0022/0024). There is no
// provision-secret gate screen anymore; signup is closable server-side via the
// PROVISION_KILL_SWITCH env brake enforced inside provisionVendor.
export default function OnboardPage() {
  return <OnboardWizard />;
}
