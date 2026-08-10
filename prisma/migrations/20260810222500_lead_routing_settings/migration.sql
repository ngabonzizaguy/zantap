-- CreateTable
CREATE TABLE "LeadRoutingSettings" (
    "id" TEXT NOT NULL,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappPhone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadRoutingSettings_pkey" PRIMARY KEY ("id")
);
