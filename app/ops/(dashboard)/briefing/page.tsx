import { BriefingOpsManager } from "@/components/ops/BriefingOpsManager";
import { DEFAULT_BRIEFING_DOCUMENT } from "@/lib/briefing/content";
import type { BriefingJson } from "@/lib/briefing/types";
import { getStore } from "@/lib/store";

export default async function OpsBriefingPage() {
  const store = getStore();
  const [workspace, interests] = await Promise.all([
    store.briefing.ensure(structuredClone(DEFAULT_BRIEFING_DOCUMENT) as unknown as BriefingJson),
    store.listBriefingInterests(),
  ]);
  return <BriefingOpsManager workspace={workspace} interests={interests} />;
}
