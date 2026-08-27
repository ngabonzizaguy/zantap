import { createHash, randomBytes } from "node:crypto";

import {
  generateBriefingSecret,
  hashBriefingSecret,
  lookupBriefingSecret,
  verifyBriefingSecret,
} from "@/lib/briefing/access-secret";
import type {
  BriefingAccessGrant,
  BriefingSession,
  BriefingStore,
  BriefingVersion,
} from "@/lib/briefing/types";

export const BRIEFING_MAX_ACTIVE_SESSIONS = 2;

export interface CreateBriefingAccessGrantInput {
  recipientLabel: string;
  recipientEmail?: string;
  expiresAt: Date;
  versionId: string;
}

export type BriefingUnlockResult =
  | {
      ok: true;
      token: string;
      grant: BriefingAccessGrant;
      session: BriefingSession;
      version: BriefingVersion;
    }
  | {
      ok: false;
      code: "INVALID" | "EXPIRED" | "REVOKED" | "SESSION_LIMIT" | "VERSION_MISSING";
    };

function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("base64url");
}

export async function createBriefingAccessGrant(
  store: BriefingStore,
  input: CreateBriefingAccessGrantInput
): Promise<{ grant: BriefingAccessGrant; secret: string }> {
  const recipientLabel = input.recipientLabel.trim().slice(0, 120);
  if (!recipientLabel) throw new Error("Recipient label is required");
  if (!Number.isFinite(input.expiresAt.getTime()) || input.expiresAt <= new Date()) {
    throw new Error("Expiry must be in the future");
  }
  if (!(await store.getVersion(input.versionId))) {
    throw new Error("Briefing version not found");
  }

  const secret = generateBriefingSecret();
  const grant = await store.createGrant({
    recipientLabel,
    recipientEmail: input.recipientEmail?.trim() || undefined,
    shortCode: randomBytes(3).toString("hex").toUpperCase(),
    secretLookup: lookupBriefingSecret(secret),
    secretHash: await hashBriefingSecret(secret),
    expiresAt: input.expiresAt,
    versionId: input.versionId,
  });
  await store.recordActivity({
    grantId: grant.id,
    type: "GRANT_CREATED",
    detail: { expiresAt: grant.expiresAt.toISOString(), versionNumber: grant.versionNumber },
  });
  return { grant, secret };
}

export async function unlockBriefingAccess(
  store: BriefingStore,
  secret: string,
  context: {
    now?: Date;
    userAgent?: string;
    networkFingerprint?: string;
  } = {}
): Promise<BriefingUnlockResult> {
  const now = context.now ?? new Date();
  const stored = await store.getGrantBySecretLookup(lookupBriefingSecret(secret));
  if (!stored || !(await verifyBriefingSecret(secret, stored.secretHash))) {
    await store.recordActivity({ type: "UNLOCK_FAILED" });
    return { ok: false, code: "INVALID" };
  }
  if (stored.revokedAt) return { ok: false, code: "REVOKED" };
  if (stored.expiresAt <= now) return { ok: false, code: "EXPIRED" };
  if ((await store.listActiveSessions(stored.id, now)).length >= BRIEFING_MAX_ACTIVE_SESSIONS) {
    await store.recordActivity({ grantId: stored.id, type: "SESSION_LIMIT_DENIED" });
    return { ok: false, code: "SESSION_LIMIT" };
  }
  const version = await store.getVersion(stored.versionId);
  if (!version) return { ok: false, code: "VERSION_MISSING" };

  const token = randomBytes(32).toString("base64url");
  const session = await store.createSession({
    grantId: stored.id,
    tokenHash: tokenHash(token),
    generation: stored.sessionGeneration,
    expiresAt: stored.expiresAt,
    userAgent: context.userAgent?.slice(0, 240),
    networkFingerprint: context.networkFingerprint,
  });
  await store.recordActivity({
    grantId: stored.id,
    sessionId: session.id,
    type: "UNLOCK_SUCCEEDED",
  });
  return { ok: true, token, grant: stored, session, version };
}

export async function validateBriefingAccessSession(
  store: BriefingStore,
  token: string,
  now = new Date()
): Promise<{ grant: BriefingAccessGrant; session: BriefingSession; version: BriefingVersion } | null> {
  if (!token) return null;
  const session = await store.getSessionByTokenHash(tokenHash(token));
  if (!session || session.revokedAt || session.expiresAt <= now) return null;
  const grant = await store.getGrant(session.grantId);
  if (
    !grant ||
    grant.revokedAt ||
    grant.expiresAt <= now ||
    grant.sessionGeneration !== session.generation
  ) {
    return null;
  }
  const version = await store.getVersion(grant.versionId);
  if (!version) return null;
  await store.updateSession(session.id, { lastSeenAt: now });
  return { grant, session: { ...session, lastSeenAt: now }, version };
}

export async function resetBriefingAccessSecret(
  store: BriefingStore,
  grantId: string
): Promise<{ grant: BriefingAccessGrant; secret: string }> {
  const secret = generateBriefingSecret();
  const grant = await store.updateGrant(grantId, {
    secretLookup: lookupBriefingSecret(secret),
    secretHash: await hashBriefingSecret(secret),
    incrementGeneration: true,
    revokedAt: null,
  });
  if (!grant) throw new Error("Access grant not found");
  await store.revokeGrantSessions(grantId);
  await store.recordActivity({ grantId, type: "GRANT_SECRET_RESET" });
  return { grant, secret };
}
