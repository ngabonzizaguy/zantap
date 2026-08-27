import type { BriefingAccessGrant } from "@/lib/briefing/types";

export interface BriefingSecretResult {
  grant: BriefingAccessGrant;
  secret: string;
  shareText: string;
}
