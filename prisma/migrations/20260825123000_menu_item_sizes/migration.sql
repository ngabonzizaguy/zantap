-- Ordered dynamic size options. Existing rows stay single-price with NULL.
ALTER TABLE "MenuItem" ADD COLUMN "sizeOptions" JSONB;

-- Snapshot the selected option identity and label on each historical line.
ALTER TABLE "OrderItem"
ADD COLUMN "sizeOptionId" TEXT,
ADD COLUMN "sizeLabel" TEXT;
