-- Ops deletion is reversible for 30 days before permanent purge.
ALTER TABLE "MenuIntake" ADD COLUMN "deletedAt" TIMESTAMP(3);

CREATE INDEX "MenuIntake_deletedAt_updatedAt_idx"
ON "MenuIntake"("deletedAt", "updatedAt");
