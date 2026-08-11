import { LeadRoutingSettingsForm } from "@/components/ops/LeadRoutingSettingsForm";
import { listLeadRoutingRecipients } from "@/lib/operator-client";

export default async function OpsSettingsPage() {
  const recipients = await listLeadRoutingRecipients();
  return <LeadRoutingSettingsForm recipients={recipients} />;
}
