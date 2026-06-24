-- CreateEnum
CREATE TYPE "KitchenStage" AS ENUM ('NEW', 'ACCEPTED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'COMPLETED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "kitchenStage" "KitchenStage",
ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill existing orders (ADR-0013 mapping table)
UPDATE "Order"
SET
  "kitchenStage" = 'NEW',
  "paidAt" = COALESCE("updatedAt", "createdAt")
WHERE "status" = 'PAID';

UPDATE "Order"
SET
  "kitchenStage" = 'OUT_FOR_DELIVERY',
  "paidAt" = COALESCE("paidAt", "updatedAt", "createdAt")
WHERE "status" = 'DISPATCHED';

UPDATE "Order"
SET
  "kitchenStage" = 'COMPLETED',
  "paidAt" = COALESCE("paidAt", "updatedAt", "createdAt")
WHERE "status" = 'COMPLETED';
