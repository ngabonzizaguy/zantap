-- CreateTable
CREATE TABLE "MenuImage" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "blobPath" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuImage_menuItemId_idx" ON "MenuImage"("menuItemId");

-- AddForeignKey
ALTER TABLE "MenuImage" ADD CONSTRAINT "MenuImage_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy imageUrl values to primary MenuImage rows
INSERT INTO "MenuImage" ("id", "menuItemId", "url", "blobPath", "sortOrder", "isPrimary", "createdAt")
SELECT
    'mig_' || "id",
    "id",
    "imageUrl",
    NULL,
    0,
    true,
    NOW()
FROM "MenuItem"
WHERE "imageUrl" IS NOT NULL AND TRIM("imageUrl") <> '';
