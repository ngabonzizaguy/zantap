-- AlterTable
ALTER TABLE "MarketingSiteSettings" ADD COLUMN "showKdsLanguageSelector" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MarketingSiteSettings" ADD COLUMN "kdsLanguageRw" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MarketingSiteSettings" ADD COLUMN "kdsLanguageFr" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "MarketingSiteSettings" ADD COLUMN "kdsLanguageSw" BOOLEAN NOT NULL DEFAULT true;
