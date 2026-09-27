-- CreateEnum
CREATE TYPE "VendorPayoutStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "VendorPayout" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "referenceId" TEXT NOT NULL,
    "status" "VendorPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payeeType" TEXT NOT NULL,
    "payeeId" TEXT NOT NULL,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayout_referenceId_key" ON "VendorPayout"("referenceId");

-- CreateIndex
CREATE INDEX "VendorPayout_orderId_createdAt_idx" ON "VendorPayout"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "VendorPayout_vendorId_status_idx" ON "VendorPayout"("vendorId", "status");

-- CreateIndex
CREATE INDEX "VendorPayout_status_idx" ON "VendorPayout"("status");

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayout" ADD CONSTRAINT "VendorPayout_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
