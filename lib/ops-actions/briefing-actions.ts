"use server";

import { revalidatePath } from "next/cache";

import {
  createBriefingAccessGrant,
  resetBriefingAccessSecret,
} from "@/lib/briefing/access-service";
import type { BriefingDocument } from "@/lib/briefing/content";
import { DEFAULT_BRIEFING_DOCUMENT } from "@/lib/briefing/content";
import type { BriefingSecretResult } from "@/lib/briefing/ops-types";
import type { BriefingJson, BriefingVersion } from "@/lib/briefing/types";
import { isOpsSessionValid } from "@/lib/ops-auth/session";
import { getStore } from "@/lib/store";

async function assertOps(): Promise<void> {
  if (!(await isOpsSessionValid())) throw new Error("Operator session required");
}

function defaultDocumentJson(): BriefingJson {
  return structuredClone(DEFAULT_BRIEFING_DOCUMENT) as unknown as BriefingJson;
}

function shareResult(grant: BriefingSecretResult["grant"], secret: string): BriefingSecretResult {
  const origin = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") || "https://zantap.app";
  return {
    grant,
    secret,
    shareText: `Private ZanTap Briefing for ${grant.recipientLabel}\n${origin}/briefing\nPIN: ${secret}\nExpires: ${grant.expiresAt.toLocaleString("en-RW", { timeZone: "Africa/Kigali" })}`,
  };
}

export async function createBriefingGrantAction(input: {
  recipientLabel: string;
  recipientEmail?: string;
  expiresAt: string;
  versionId: string;
}): Promise<BriefingSecretResult> {
  await assertOps();
  const created = await createBriefingAccessGrant(getStore().briefing, {
    ...input,
    expiresAt: new Date(input.expiresAt),
  });
  revalidatePath("/ops/briefing");
  return shareResult(created.grant, created.secret);
}

export async function resetBriefingGrantSecretAction(grantId: string): Promise<BriefingSecretResult> {
  await assertOps();
  const reset = await resetBriefingAccessSecret(getStore().briefing, grantId);
  revalidatePath("/ops/briefing");
  return shareResult(reset.grant, reset.secret);
}

export async function updateBriefingGrantAction(input: {
  grantId: string;
  action: "revoke" | "restore" | "extend" | "version";
  expiresAt?: string;
  versionId?: string;
}): Promise<void> {
  await assertOps();
  const store = getStore().briefing;
  const patch =
    input.action === "revoke"
      ? { revokedAt: new Date(), incrementGeneration: true }
      : input.action === "restore"
        ? { revokedAt: null }
        : input.action === "extend"
          ? { expiresAt: new Date(input.expiresAt ?? "") }
          : { versionId: input.versionId };
  const grant = await store.updateGrant(input.grantId, patch);
  if (!grant) throw new Error("Access grant not found");
  if (input.action === "revoke") await store.revokeGrantSessions(input.grantId);
  await store.recordActivity({ grantId: input.grantId, type: `GRANT_${input.action.toUpperCase()}` });
  revalidatePath("/ops/briefing");
}

export async function revokeBriefingSessionAction(sessionId: string): Promise<void> {
  await assertOps();
  const session = await getStore().briefing.updateSession(sessionId, { revokedAt: new Date() });
  if (!session) throw new Error("Viewing session not found");
  await getStore().briefing.recordActivity({
    grantId: session.grantId,
    sessionId,
    type: "SESSION_REVOKED",
  });
  revalidatePath("/ops/briefing");
}

export async function saveBriefingDraftAction(document: BriefingDocument): Promise<void> {
  await assertOps();
  await getStore().briefing.saveDraft(structuredClone(document) as unknown as BriefingJson);
  revalidatePath("/ops/briefing");
}

export async function publishBriefingDraftAction(): Promise<BriefingVersion> {
  await assertOps();
  const store = getStore().briefing;
  await store.ensure(defaultDocumentJson());
  const version = await store.publishDraft();
  await store.recordActivity({
    type: "VERSION_PUBLISHED",
    detail: { versionNumber: version.number },
  });
  revalidatePath("/ops/briefing");
  return version;
}
