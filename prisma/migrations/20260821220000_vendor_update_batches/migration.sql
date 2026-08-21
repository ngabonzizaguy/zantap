-- Candidate #26 Issue 02: automatic public Vendor update batches.
ALTER TABLE "Vendor"
ADD COLUMN "updatesEnabled" BOOLEAN NOT NULL DEFAULT true;

CREATE TYPE "VendorUpdateType" AS ENUM (
  'NEW_DISH',
  'DISH_IMAGE',
  'PRICE_CHANGE',
  'DISH_RESTORED',
  'PROFILE_CHANGE'
);

CREATE TABLE "VendorUpdateBatch" (
  "id" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "menuVisitCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "VendorUpdateBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VendorUpdateEntry" (
  "id" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "type" "VendorUpdateType" NOT NULL,
  "subjectId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "imageUrl" TEXT,
  "oldPriceRwf" INTEGER,
  "currentPriceRwf" INTEGER,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VendorUpdateEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VendorUpdateBatch_vendorId_publishedAt_idx"
ON "VendorUpdateBatch"("vendorId", "publishedAt");
CREATE INDEX "VendorUpdateBatch_vendorId_expiresAt_idx"
ON "VendorUpdateBatch"("vendorId", "expiresAt");
CREATE INDEX "VendorUpdateEntry_batchId_idx"
ON "VendorUpdateEntry"("batchId");
CREATE UNIQUE INDEX "VendorUpdateEntry_batchId_type_subjectId_key"
ON "VendorUpdateEntry"("batchId", "type", "subjectId");

ALTER TABLE "VendorUpdateBatch"
ADD CONSTRAINT "VendorUpdateBatch_vendorId_fkey"
FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VendorUpdateEntry"
ADD CONSTRAINT "VendorUpdateEntry_batchId_fkey"
FOREIGN KEY ("batchId") REFERENCES "VendorUpdateBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
