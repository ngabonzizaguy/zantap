export type BriefingJson = Record<string, unknown>;

export interface BriefingVersion {
  id: string;
  number: number;
  content: BriefingJson;
  publishedAt: Date;
}

export interface BriefingAccessGrant {
  id: string;
  recipientLabel: string;
  recipientEmail?: string;
  shortCode: string;
  expiresAt: Date;
  revokedAt?: Date;
  sessionGeneration: number;
  versionId: string;
  versionNumber: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredBriefingAccessGrant extends BriefingAccessGrant {
  secretLookup: string;
  secretHash: string;
}

export interface BriefingSession {
  id: string;
  grantId: string;
  tokenHash: string;
  generation: number;
  acknowledgedAt?: Date;
  lastSeenAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  networkFingerprint?: string;
  createdAt: Date;
}

export interface BriefingActivity {
  id: string;
  grantId?: string;
  sessionId?: string;
  type: string;
  detail?: BriefingJson;
  at: Date;
}

export interface BriefingWorkspace {
  draft: BriefingJson;
  draftUpdatedAt: Date;
  publishedVersions: BriefingVersion[];
  grants: BriefingAccessGrant[];
  sessions: BriefingSession[];
  activities: BriefingActivity[];
}

export interface BriefingStore {
  reset(): void;
  ensure(defaultContent: BriefingJson): Promise<BriefingWorkspace>;
  saveDraft(content: BriefingJson): Promise<BriefingWorkspace>;
  publishDraft(): Promise<BriefingVersion>;
  getVersion(versionId: string): Promise<BriefingVersion | null>;
  createGrant(input: {
    recipientLabel: string;
    recipientEmail?: string;
    shortCode: string;
    secretLookup: string;
    secretHash: string;
    expiresAt: Date;
    versionId: string;
  }): Promise<BriefingAccessGrant>;
  listGrants(): Promise<BriefingAccessGrant[]>;
  getGrantBySecretLookup(secretLookup: string): Promise<StoredBriefingAccessGrant | null>;
  getGrant(grantId: string): Promise<StoredBriefingAccessGrant | null>;
  updateGrant(
    grantId: string,
    patch: {
      expiresAt?: Date;
      revokedAt?: Date | null;
      versionId?: string;
      secretLookup?: string;
      secretHash?: string;
      incrementGeneration?: boolean;
    }
  ): Promise<BriefingAccessGrant | null>;
  createSession(input: Omit<BriefingSession, "id" | "createdAt" | "lastSeenAt">): Promise<BriefingSession>;
  getSessionByTokenHash(tokenHash: string): Promise<BriefingSession | null>;
  listActiveSessions(grantId: string, at: Date): Promise<BriefingSession[]>;
  updateSession(
    sessionId: string,
    patch: { acknowledgedAt?: Date; lastSeenAt?: Date; revokedAt?: Date | null }
  ): Promise<BriefingSession | null>;
  revokeGrantSessions(grantId: string): Promise<void>;
  recordActivity(input: Omit<BriefingActivity, "id" | "at">): Promise<BriefingActivity>;
}
