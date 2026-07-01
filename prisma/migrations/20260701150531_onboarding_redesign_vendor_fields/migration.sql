-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('MERCHANT_CODE', 'PHONE');

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "businessCategory" TEXT,
ADD COLUMN     "coverImageUrl" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "ownerTokenHash" TEXT,
ADD COLUMN     "payoutMethod" "PayoutMethod" NOT NULL DEFAULT 'MERCHANT_CODE';

-- CreateTable
CREATE TABLE "VendorRecoveryEvent" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "context" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorRecoveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorRecoveryEvent_vendorId_idx" ON "VendorRecoveryEvent"("vendorId");

-- AddForeignKey
ALTER TABLE "VendorRecoveryEvent" ADD CONSTRAINT "VendorRecoveryEvent_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
