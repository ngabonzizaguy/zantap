import { LeadInbox } from "@/components/ops/LeadInbox";
import { listLeads } from "@/lib/operator-client";

export default async function OpsLeadsPage() {
  const leads = await listLeads();
  return <LeadInbox leads={leads} />;
}
