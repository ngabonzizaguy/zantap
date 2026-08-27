import "server-only";

import { Prisma, type PrismaClient } from "@prisma/client";

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

const jsonInput = (value: BriefingJson): Prisma.InputJsonValue =>
  value as Prisma.InputJsonValue;
const jsonOutput = (value: Prisma.JsonValue): BriefingJson =>
  value as BriefingJson;

const mapVersion = (row: {
  id: string;
  number: number;
  content: Prisma.JsonValue;
  publishedAt: Date;
}): BriefingVersion => ({ ...row, content: jsonOutput(row.content) });

const mapSession = (row: {
  id: string;
  grantId: string;
  tokenHash: string;
  generation: number;
  acknowledgedAt: Date | null;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  userAgent: string | null;
  networkFingerprint: string | null;
  createdAt: Date;
}): BriefingSession => ({
  ...row,
  acknowledgedAt: row.acknowledgedAt ?? undefined,
  revokedAt: row.revokedAt ?? undefined,
  userAgent: row.userAgent ?? undefined,
  networkFingerprint: row.networkFingerprint ?? undefined,
});

function mapGrant(row: {
  id: string;
  recipientLabel: string;
  recipientEmail: string | null;
  shortCode: string;
  expiresAt: Date;
  revokedAt: Date | null;
  sessionGeneration: number;
  versionId: string;
  version: { number: number };
  createdAt: Date;
  updatedAt: Date;
}): BriefingAccessGrant {
  return {
    ...row,
    recipientEmail: row.recipientEmail ?? undefined,
    revokedAt: row.revokedAt ?? undefined,
    versionNumber: row.version.number,
  };
}

export function createPrismaBriefingStore(client: PrismaClient): BriefingStore {
  async function workspace(): Promise<BriefingWorkspace> {
    const [draft, publishedVersions, grantRows, sessionRows, activityRows] =
      await Promise.all([
        client.briefingDraft.findUniqueOrThrow({ where: { id: "default" } }),
        client.briefingVersion.findMany({ orderBy: { number: "desc" } }),
        client.briefingAccessGrant.findMany({
          include: { version: { select: { number: true } } },
          orderBy: { createdAt: "desc" },
        }),
        client.briefingSession.findMany({ orderBy: { lastSeenAt: "desc" }, take: 200 }),
        client.briefingActivity.findMany({ orderBy: { at: "desc" }, take: 500 }),
      ]);
    return {
      draft: jsonOutput(draft.content),
      draftUpdatedAt: draft.updatedAt,
      publishedVersions: publishedVersions.map(mapVersion),
      grants: grantRows.map(mapGrant),
      sessions: sessionRows.map(mapSession),
      activities: activityRows.map((row) => ({
        id: row.id,
        grantId: row.grantId ?? undefined,
        sessionId: row.sessionId ?? undefined,
        type: row.type,
        detail: row.detail ? jsonOutput(row.detail) : undefined,
        at: row.at,
      })),
    };
  }

  return {
    reset() {},
    async ensure(defaultContent) {
      await client.$transaction(async (tx) => {
        await tx.briefingDraft.upsert({
          where: { id: "default" },
          create: { id: "default", content: jsonInput(defaultContent) },
          update: {},
        });
        const count = await tx.briefingVersion.count();
        if (count === 0) {
          await tx.briefingVersion.create({
            data: { number: 1, content: jsonInput(defaultContent) },
          });
        }
      });
      return workspace();
    },
    async saveDraft(content) {
      await client.briefingDraft.upsert({
        where: { id: "default" },
        create: { id: "default", content: jsonInput(content) },
        update: { content: jsonInput(content) },
      });
      return workspace();
    },
    async publishDraft() {
      return client.$transaction(async (tx) => {
        const [draft, latest] = await Promise.all([
          tx.briefingDraft.findUniqueOrThrow({ where: { id: "default" } }),
          tx.briefingVersion.findFirst({ orderBy: { number: "desc" } }),
        ]);
        return mapVersion(
          await tx.briefingVersion.create({
            data: {
              number: (latest?.number ?? 0) + 1,
              content: jsonInput(jsonOutput(draft.content)),
            },
          })
        );
      });
    },
    async getVersion(versionId) {
      const row = await client.briefingVersion.findUnique({ where: { id: versionId } });
      return row ? mapVersion(row) : null;
    },
    async createGrant(input) {
      return mapGrant(
        await client.briefingAccessGrant.create({
          data: {
            ...input,
            recipientEmail: input.recipientEmail ?? null,
          },
          include: { version: { select: { number: true } } },
        })
      );
    },
    async listGrants() {
      const rows = await client.briefingAccessGrant.findMany({
        include: { version: { select: { number: true } } },
        orderBy: { createdAt: "desc" },
      });
      return rows.map(mapGrant);
    },
    async getGrantBySecretLookup(secretLookup) {
      const row = await client.briefingAccessGrant.findUnique({
        where: { secretLookup },
        include: { version: { select: { number: true } } },
      });
      return row ? ({ ...mapGrant(row), secretLookup: row.secretLookup, secretHash: row.secretHash } satisfies StoredBriefingAccessGrant) : null;
    },
    async getGrant(grantId) {
      const row = await client.briefingAccessGrant.findUnique({
        where: { id: grantId },
        include: { version: { select: { number: true } } },
      });
      return row ? ({ ...mapGrant(row), secretLookup: row.secretLookup, secretHash: row.secretHash } satisfies StoredBriefingAccessGrant) : null;
    },
    async updateGrant(grantId, patch) {
      try {
        return mapGrant(
          await client.briefingAccessGrant.update({
            where: { id: grantId },
            data: {
              expiresAt: patch.expiresAt,
              revokedAt: patch.revokedAt,
              versionId: patch.versionId,
              secretLookup: patch.secretLookup,
              secretHash: patch.secretHash,
              sessionGeneration: patch.incrementGeneration ? { increment: 1 } : undefined,
            },
            include: { version: { select: { number: true } } },
          })
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
        throw error;
      }
    },
    async createSession(input) {
      return mapSession(await client.briefingSession.create({ data: input }));
    },
    async getSessionByTokenHash(tokenHash) {
      const row = await client.briefingSession.findUnique({ where: { tokenHash } });
      return row ? mapSession(row) : null;
    },
    async listActiveSessions(grantId, at) {
      return (
        await client.briefingSession.findMany({
          where: { grantId, revokedAt: null, expiresAt: { gt: at } },
          orderBy: { lastSeenAt: "desc" },
        })
      ).map(mapSession);
    },
    async updateSession(sessionId, patch) {
      try {
        return mapSession(
          await client.briefingSession.update({ where: { id: sessionId }, data: patch })
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return null;
        throw error;
      }
    },
    async revokeGrantSessions(grantId) {
      await client.briefingSession.updateMany({
        where: { grantId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
    async recordActivity(input) {
      const row = await client.briefingActivity.create({
        data: { ...input, detail: input.detail ? jsonInput(input.detail) : undefined },
      });
      return {
        id: row.id,
        grantId: row.grantId ?? undefined,
        sessionId: row.sessionId ?? undefined,
        type: row.type,
        detail: row.detail ? jsonOutput(row.detail) : undefined,
        at: row.at,
      } satisfies BriefingActivity;
    },
  };
}
