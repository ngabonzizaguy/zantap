import { randomUUID } from "node:crypto";

import type {
  BriefingAccessGrant,
  BriefingActivity,
  BriefingJson,
  BriefingSession,
  BriefingStore,
  BriefingVersion,
  BriefingWorkspace,
  StoredBriefingAccessGrant,
} from "@/lib/briefing/types";

const cloneJson = (value: BriefingJson): BriefingJson => structuredClone(value);

export function createInMemoryBriefingStore(): BriefingStore {
  let draft: { content: BriefingJson; updatedAt: Date } | null = null;
  const versions: BriefingVersion[] = [];
  const grants: StoredBriefingAccessGrant[] = [];
  const sessions: BriefingSession[] = [];
  const activities: BriefingActivity[] = [];

  const publicGrant = (grant: StoredBriefingAccessGrant): BriefingAccessGrant => {
    const { secretHash: _hash, secretLookup: _lookup, ...visible } = grant;
    return structuredClone(visible);
  };

  function workspace(): BriefingWorkspace {
    if (!draft) throw new Error("Briefing has not been initialized");
    return {
      draft: cloneJson(draft.content),
      draftUpdatedAt: new Date(draft.updatedAt),
      publishedVersions: versions.map((row) => structuredClone(row)).reverse(),
      grants: grants.map(publicGrant),
      sessions: sessions.map((row) => structuredClone(row)),
      activities: activities.map((row) => structuredClone(row)).reverse(),
    };
  }

  return {
    reset() {
      draft = null;
      versions.length = 0;
      grants.length = 0;
      sessions.length = 0;
      activities.length = 0;
    },
    async ensure(defaultContent) {
      if (!draft) {
        const now = new Date();
        draft = { content: cloneJson(defaultContent), updatedAt: now };
        versions.push({
          id: randomUUID(),
          number: 1,
          content: cloneJson(defaultContent),
          publishedAt: now,
        });
      }
      return workspace();
    },
    async saveDraft(content) {
      draft = { content: cloneJson(content), updatedAt: new Date() };
      return workspace();
    },
    async publishDraft() {
      if (!draft) throw new Error("Briefing has not been initialized");
      const version: BriefingVersion = {
        id: randomUUID(),
        number: (versions.at(-1)?.number ?? 0) + 1,
        content: cloneJson(draft.content),
        publishedAt: new Date(),
      };
      versions.push(version);
      return structuredClone(version);
    },
    async getVersion(versionId) {
      const version = versions.find((row) => row.id === versionId);
      return version ? structuredClone(version) : null;
    },
    async createGrant(input) {
      const version = versions.find((row) => row.id === input.versionId);
      if (!version) throw new Error("Briefing version not found");
      const now = new Date();
      const grant: StoredBriefingAccessGrant = {
        id: randomUUID(),
        ...input,
        versionNumber: version.number,
        sessionGeneration: 0,
        createdAt: now,
        updatedAt: now,
      };
      grants.unshift(grant);
      return publicGrant(grant);
    },
    async listGrants() {
      return grants.map(publicGrant);
    },
    async getGrantBySecretLookup(secretLookup) {
      const grant = grants.find((row) => row.secretLookup === secretLookup);
      return grant ? structuredClone(grant) : null;
    },
    async getGrant(grantId) {
      const grant = grants.find((row) => row.id === grantId);
      return grant ? structuredClone(grant) : null;
    },
    async updateGrant(grantId, patch) {
      const index = grants.findIndex((row) => row.id === grantId);
      if (index === -1) return null;
      const version = patch.versionId
        ? versions.find((row) => row.id === patch.versionId)
        : undefined;
      grants[index] = {
        ...grants[index],
        ...patch,
        ...(version ? { versionId: version.id, versionNumber: version.number } : {}),
        sessionGeneration:
          grants[index].sessionGeneration + (patch.incrementGeneration ? 1 : 0),
        revokedAt:
          patch.revokedAt === null ? undefined : patch.revokedAt ?? grants[index].revokedAt,
        updatedAt: new Date(),
      };
      return publicGrant(grants[index]);
    },
    async createSession(input) {
      const now = new Date();
      const session: BriefingSession = {
        id: randomUUID(),
        ...input,
        createdAt: now,
        lastSeenAt: now,
      };
      sessions.push(session);
      return structuredClone(session);
    },
    async getSessionByTokenHash(tokenHash) {
      const session = sessions.find((row) => row.tokenHash === tokenHash);
      return session ? structuredClone(session) : null;
    },
    async listActiveSessions(grantId, at) {
      return sessions
        .filter((row) => row.grantId === grantId && !row.revokedAt && row.expiresAt > at)
        .map((row) => structuredClone(row));
    },
    async updateSession(sessionId, patch) {
      const index = sessions.findIndex((row) => row.id === sessionId);
      if (index === -1) return null;
      sessions[index] = {
        ...sessions[index],
        ...patch,
        revokedAt: patch.revokedAt === null ? undefined : patch.revokedAt ?? sessions[index].revokedAt,
      };
      return structuredClone(sessions[index]);
    },
    async revokeGrantSessions(grantId) {
      const at = new Date();
      sessions.forEach((session, index) => {
        if (session.grantId === grantId && !session.revokedAt) {
          sessions[index] = { ...session, revokedAt: at };
        }
      });
    },
    async recordActivity(input) {
      const activity: BriefingActivity = { id: randomUUID(), ...input, at: new Date() };
      activities.push(activity);
      return structuredClone(activity);
    },
  };
}
