-- DropIndex
DROP INDEX "MenuIntakeImportRun_intakeId_startedAt_idx";

-- DropIndex
DROP INDEX "Order_driverId_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "commissionFeeRwf" INTEGER,
ADD COLUMN     "commissionPercentApplied" DECIMAL(5,2),
ADD COLUMN     "vendorPayoutAmountRwf" INTEGER;

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "commissionEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "commissionPercent" DECIMAL(5,2),
ADD COLUMN     "feeReminderEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CommissionSettings" (
    "id" TEXT NOT NULL,
    "globalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "globalDefaultPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minimumOrderTotalRwf" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionSettings_pkey" PRIMARY KEY ("id")
);
