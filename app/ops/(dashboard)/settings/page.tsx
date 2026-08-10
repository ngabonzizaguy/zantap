import { LeadRoutingSettingsForm } from "@/components/ops/LeadRoutingSettingsForm";
import { getLeadRoutingSettings } from "@/lib/operator-client";

export default async function OpsSettingsPage() {
  const settings = await getLeadRoutingSettings();
  return <LeadRoutingSettingsForm settings={settings} />;
}
