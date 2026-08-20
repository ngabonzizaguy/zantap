-- Real vendor Inventory is intentionally separate from sellable MenuItem stock.
CREATE TYPE "InventoryCategory" AS ENUM ('INGREDIENTS', 'DRINKS', 'PACKAGING', 'CLEANING', 'OTHER');

CREATE TYPE "InventoryAdjustmentType" AS ENUM ('RECEIVED', 'USED', 'WASTED', 'CORRECTION');

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "lowStockThreshold" DECIMAL(15,3) NOT NULL,
    "category" "InventoryCategory" NOT NULL,
    "unitCostRwf" INTEGER,
    "note" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "InventoryAdjustmentType" NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "oldQuantity" DECIMAL(15,3) NOT NULL,
    "newQuantity" DECIMAL(15,3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryItem_vendorId_archivedAt_idx" ON "InventoryItem"("vendorId", "archivedAt");
CREATE INDEX "InventoryItem_vendorId_category_archivedAt_idx" ON "InventoryItem"("vendorId", "category", "archivedAt");
CREATE UNIQUE INDEX "InventoryAdjustment_inventoryItemId_sequence_key" ON "InventoryAdjustment"("inventoryItemId", "sequence");

ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
