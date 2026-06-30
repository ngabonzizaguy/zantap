import { isProvisionEnabled } from "@/lib/vendor/is-provision-enabled";
import { OnboardWizard } from "@/components/onboard/OnboardWizard";
import { OperatorContact } from "@/components/onboard/OperatorContact";

export default function OnboardPage() {
  if (!isProvisionEnabled()) {
    return <OperatorContact />;
  }

  return <OnboardWizard />;
}
