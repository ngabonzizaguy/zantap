-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN "featureWhatsappNotify" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN "featureStockTracking" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vendor" ADD COLUMN "featureProfitInsights" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "stockCount" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN "lowStockThreshold" INTEGER;
ALTER TABLE "MenuItem" ADD COLUMN "costPriceRwf" INTEGER;

-- CreateEnum
CREATE TYPE "ProspectStatus" AS ENUM ('FOUND', 'CONTACTED', 'IN_TALKS', 'CONVERTED', 'DECLINED', 'UNREACHABLE');

-- CreateEnum
CREATE TYPE "ProspectChannel" AS ENUM ('WHATSAPP', 'PHONE', 'INSTAGRAM', 'GOOGLE_MAPS', 'EMAIL', 'IN_PERSON', 'OTHER');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "area" TEXT,
    "source" TEXT,
    "mapsUrl" TEXT,
    "instagramHandle" TEXT,
    "notes" TEXT,
    "status" "ProspectStatus" NOT NULL DEFAULT 'FOUND',
    "nextFollowUpAt" TIMESTAMP(3),
    "convertedVendorId" TEXT,
    "convertedLeadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectInteraction" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" "ProspectChannel" NOT NULL,
    "note" TEXT,

    CONSTRAINT "ProspectInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingSiteSettings" (
    "id" TEXT NOT NULL,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "socialX" TEXT,
    "socialTiktok" TEXT,
    "socialInstagram" TEXT,
    "socialFacebook" TEXT,
    "socialLinkedin" TEXT,
    "socialYoutube" TEXT,
    "socialWhatsapp" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingSiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorExpense" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amountRwf" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT,
    "spentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prospect_status_nextFollowUpAt_idx" ON "Prospect"("status", "nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Prospect_nextFollowUpAt_idx" ON "Prospect"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Prospect_createdAt_idx" ON "Prospect"("createdAt");

-- CreateIndex
CREATE INDEX "ProspectInteraction_prospectId_at_idx" ON "ProspectInteraction"("prospectId", "at");

-- CreateIndex
CREATE INDEX "VendorExpense_vendorId_spentAt_idx" ON "VendorExpense"("vendorId", "spentAt");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_convertedVendorId_fkey" FOREIGN KEY ("convertedVendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_convertedLeadId_fkey" FOREIGN KEY ("convertedLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectInteraction" ADD CONSTRAINT "ProspectInteraction_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorExpense" ADD CONSTRAINT "VendorExpense_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
