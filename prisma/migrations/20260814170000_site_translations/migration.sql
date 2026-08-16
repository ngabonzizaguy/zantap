-- Owner-editable marketing copy overrides (Ops -> Settings -> Languages).
-- Key = dot path into MARKETING_COPY; locale in en/rw/fr/sw.

-- CreateTable
CREATE TABLE "SiteTranslation" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTranslation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteTranslation_locale_key_key" ON "SiteTranslation"("locale", "key");

-- CreateIndex
CREATE INDEX "SiteTranslation_locale_idx" ON "SiteTranslation"("locale");
