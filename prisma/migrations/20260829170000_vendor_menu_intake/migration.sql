CREATE TYPE "MenuIntakePath" AS ENUM ('SELF_BUILD', 'ASSISTED');
CREATE TYPE "MenuIntakeStatus" AS ENUM ('SUBMITTED', 'IN_REVIEW', 'NEEDS_INFORMATION', 'READY_TO_IMPORT', 'IMPORTING', 'IMPORTED', 'CANCELLED');
CREATE TYPE "MenuIntakeRevisionSource" AS ENUM ('VENDOR', 'OPERATOR');
CREATE TYPE "MenuIntakeAccessKind" AS ENUM ('BROWSER', 'ONE_TIME');
CREATE TYPE "MenuIntakeQuestionStatus" AS ENUM ('UNANSWERED', 'ANSWERED', 'NEEDS_FOLLOW_UP');

CREATE TABLE "MenuIntake" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "status" "MenuIntakeStatus" NOT NULL DEFAULT 'SUBMITTED',
  "path" "MenuIntakePath" NOT NULL,
  "businessName" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "alreadyOnZantap" BOOLEAN NOT NULL DEFAULT false,
  "storefrontHint" TEXT,
  "destinationVendorId" TEXT,
  "currentRevision" INTEGER NOT NULL DEFAULT 1,
  "importedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuIntake_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeRevision" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "source" "MenuIntakeRevisionSource" NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuIntakeRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeAccess" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "kind" "MenuIntakeAccessKind" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuIntakeAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeAttachment" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "revisionId" TEXT,
  "kind" TEXT NOT NULL,
  "dishClientId" TEXT,
  "fileName" TEXT NOT NULL,
  "mime" TEXT NOT NULL,
  "byteLength" INTEGER NOT NULL,
  "blobPath" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuIntakeAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeQuestion" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "revisionId" TEXT,
  "question" TEXT NOT NULL,
  "status" "MenuIntakeQuestionStatus" NOT NULL DEFAULT 'UNANSWERED',
  "answer" TEXT,
  "answeredBy" TEXT,
  "answeredAt" TIMESTAMP(3),
  "deliveryMethod" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuIntakeQuestion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeContactLog" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MenuIntakeContactLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MenuIntakeImportRun" (
  "id" TEXT NOT NULL,
  "intakeId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "destinationSlug" TEXT,
  "results" JSONB,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "MenuIntakeImportRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MenuIntake_reference_key" ON "MenuIntake"("reference");
CREATE INDEX "MenuIntake_status_updatedAt_idx" ON "MenuIntake"("status", "updatedAt");
CREATE INDEX "MenuIntake_phone_idx" ON "MenuIntake"("phone");
CREATE INDEX "MenuIntake_destinationVendorId_idx" ON "MenuIntake"("destinationVendorId");
CREATE UNIQUE INDEX "MenuIntakeRevision_intakeId_sequence_key" ON "MenuIntakeRevision"("intakeId", "sequence");
CREATE INDEX "MenuIntakeRevision_intakeId_createdAt_idx" ON "MenuIntakeRevision"("intakeId", "createdAt");
CREATE UNIQUE INDEX "MenuIntakeAccess_tokenHash_key" ON "MenuIntakeAccess"("tokenHash");
CREATE INDEX "MenuIntakeAccess_intakeId_expiresAt_idx" ON "MenuIntakeAccess"("intakeId", "expiresAt");
CREATE INDEX "MenuIntakeAttachment_intakeId_createdAt_idx" ON "MenuIntakeAttachment"("intakeId", "createdAt");
CREATE INDEX "MenuIntakeAttachment_revisionId_idx" ON "MenuIntakeAttachment"("revisionId");
CREATE INDEX "MenuIntakeQuestion_intakeId_status_createdAt_idx" ON "MenuIntakeQuestion"("intakeId", "status", "createdAt");
CREATE INDEX "MenuIntakeContactLog_intakeId_createdAt_idx" ON "MenuIntakeContactLog"("intakeId", "createdAt");
CREATE INDEX "MenuIntakeImportRun_intakeId_startedAt_idx" ON "MenuIntakeImportRun"("intakeId", "startedAt");
CREATE UNIQUE INDEX "MenuIntakeImportRun_idempotencyKey_key" ON "MenuIntakeImportRun"("idempotencyKey");
CREATE INDEX "MenuIntakeImportRun_status_startedAt_idx" ON "MenuIntakeImportRun"("status", "startedAt");

ALTER TABLE "MenuIntake" ADD CONSTRAINT "MenuIntake_destinationVendorId_fkey" FOREIGN KEY ("destinationVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeRevision" ADD CONSTRAINT "MenuIntakeRevision_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeAccess" ADD CONSTRAINT "MenuIntakeAccess_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeAttachment" ADD CONSTRAINT "MenuIntakeAttachment_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeAttachment" ADD CONSTRAINT "MenuIntakeAttachment_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "MenuIntakeRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeQuestion" ADD CONSTRAINT "MenuIntakeQuestion_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeQuestion" ADD CONSTRAINT "MenuIntakeQuestion_revisionId_fkey" FOREIGN KEY ("revisionId") REFERENCES "MenuIntakeRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeContactLog" ADD CONSTRAINT "MenuIntakeContactLog_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuIntakeImportRun" ADD CONSTRAINT "MenuIntakeImportRun_intakeId_fkey" FOREIGN KEY ("intakeId") REFERENCES "MenuIntake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
