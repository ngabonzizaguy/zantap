-- AlterTable
ALTER TABLE "MenuItem" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "MenuItem_vendorId_archivedAt_idx" ON "MenuItem"("vendorId", "archivedAt");
