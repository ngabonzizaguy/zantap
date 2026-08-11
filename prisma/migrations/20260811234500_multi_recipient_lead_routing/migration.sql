-- Replace the single WhatsApp setting with independently managed recipients.
CREATE TABLE "LeadRoutingRecipient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadRoutingRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LeadRoutingAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadRoutingAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LeadRoutingRecipient_phone_key"
ON "LeadRoutingRecipient"("phone");

CREATE INDEX "LeadRoutingRecipient_enabled_archivedAt_idx"
ON "LeadRoutingRecipient"("enabled", "archivedAt");

CREATE UNIQUE INDEX "LeadRoutingAssignment_leadId_key"
ON "LeadRoutingAssignment"("leadId");

CREATE INDEX "LeadRoutingAssignment_recipientId_assignedAt_idx"
ON "LeadRoutingAssignment"("recipientId", "assignedAt");

ALTER TABLE "LeadRoutingAssignment"
ADD CONSTRAINT "LeadRoutingAssignment_leadId_fkey"
FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LeadRoutingAssignment"
ADD CONSTRAINT "LeadRoutingAssignment_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "LeadRoutingRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Preserve any recipient configured by the deployed single-recipient build.
INSERT INTO "LeadRoutingRecipient" (
    "id",
    "name",
    "phone",
    "enabled",
    "updatedAt"
)
SELECT
    'legacy-default',
    'Primary operator',
    "whatsappPhone",
    "whatsappEnabled",
    CURRENT_TIMESTAMP
FROM "LeadRoutingSettings"
WHERE "id" = 'default' AND "whatsappPhone" IS NOT NULL
ON CONFLICT ("phone") DO NOTHING;

ALTER TABLE "LeadRoutingSettings"
ADD COLUMN "lastRecipientId" TEXT;

ALTER TABLE "LeadRoutingSettings"
DROP COLUMN "whatsappEnabled",
DROP COLUMN "whatsappPhone";
