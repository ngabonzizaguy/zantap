-- CreateTable
CREATE TABLE "BriefingInterest" (
    "id" TEXT NOT NULL,
    "grantId" TEXT,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "interestType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingInterest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingDraft" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "content" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingVersion" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingAccessGrant" (
    "id" TEXT NOT NULL,
    "recipientLabel" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "shortCode" TEXT NOT NULL,
    "secretLookup" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "sessionGeneration" INTEGER NOT NULL DEFAULT 0,
    "versionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingAccessGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingSession" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "networkFingerprint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingActivity" (
    "id" TEXT NOT NULL,
    "grantId" TEXT,
    "sessionId" TEXT,
    "type" TEXT NOT NULL,
    "detail" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BriefingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BriefingInterest_createdAt_idx" ON "BriefingInterest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingVersion_number_key" ON "BriefingVersion"("number");

-- CreateIndex
CREATE INDEX "BriefingVersion_publishedAt_idx" ON "BriefingVersion"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingAccessGrant_shortCode_key" ON "BriefingAccessGrant"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingAccessGrant_secretLookup_key" ON "BriefingAccessGrant"("secretLookup");

-- CreateIndex
CREATE INDEX "BriefingAccessGrant_expiresAt_revokedAt_idx" ON "BriefingAccessGrant"("expiresAt", "revokedAt");

-- CreateIndex
CREATE INDEX "BriefingAccessGrant_versionId_idx" ON "BriefingAccessGrant"("versionId");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingSession_tokenHash_key" ON "BriefingSession"("tokenHash");

-- CreateIndex
CREATE INDEX "BriefingSession_grantId_revokedAt_lastSeenAt_idx" ON "BriefingSession"("grantId", "revokedAt", "lastSeenAt");

-- CreateIndex
CREATE INDEX "BriefingSession_expiresAt_idx" ON "BriefingSession"("expiresAt");

-- CreateIndex
CREATE INDEX "BriefingActivity_grantId_at_idx" ON "BriefingActivity"("grantId", "at");

-- CreateIndex
CREATE INDEX "BriefingActivity_sessionId_at_idx" ON "BriefingActivity"("sessionId", "at");

-- CreateIndex
CREATE INDEX "BriefingActivity_type_at_idx" ON "BriefingActivity"("type", "at");

-- AddForeignKey
ALTER TABLE "BriefingInterest" ADD CONSTRAINT "BriefingInterest_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "BriefingAccessGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingAccessGrant" ADD CONSTRAINT "BriefingAccessGrant_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "BriefingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingSession" ADD CONSTRAINT "BriefingSession_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "BriefingAccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingActivity" ADD CONSTRAINT "BriefingActivity_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "BriefingAccessGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingActivity" ADD CONSTRAINT "BriefingActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "BriefingSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense in depth for Supabase's exposed public schema. ZanTap accesses these
-- tables only through the server-side Prisma connection; no Data API policies
-- are intentionally granted.
ALTER TABLE "BriefingInterest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BriefingDraft" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BriefingVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BriefingAccessGrant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BriefingSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BriefingActivity" ENABLE ROW LEVEL SECURITY;
