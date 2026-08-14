import { ProspectInbox } from "@/components/ops/ProspectInbox";
import { listProspects, listVendors } from "@/lib/operator-client";

export default async function OpsProspectsPage() {
  const [prospects, vendors] = await Promise.all([
    listProspects(),
    listVendors(),
  ]);
  return <ProspectInbox prospects={prospects} vendors={vendors} />;
}
