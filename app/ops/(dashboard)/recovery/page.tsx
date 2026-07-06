import { listRecoveryEvents } from "@/lib/operator-client";
import { RecoveryInbox } from "@/components/ops/RecoveryInbox";

export default async function OpsRecoveryPage() {
  const events = await listRecoveryEvents({ limit: 100 });
  return <RecoveryInbox events={events} />;
}
