-- Operator console (ADR-0039): audit log + recovery review fields

ALTER TABLE "VendorRecoveryEvent" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "VendorRecoveryEvent" ADD COLUMN "reviewNote" TEXT;

CREATE TABLE "OperatorAction" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "operatorId" TEXT NOT NULL DEFAULT 'platform',
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperatorAction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OperatorAction_vendorId_idx" ON "OperatorAction"("vendorId");
CREATE INDEX "OperatorAction_at_idx" ON "OperatorAction"("at");

ALTER TABLE "OperatorAction" ADD CONSTRAINT "OperatorAction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
