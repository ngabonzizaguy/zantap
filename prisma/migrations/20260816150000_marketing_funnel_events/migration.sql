CREATE TABLE "MarketingFunnelEvent" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "target" TEXT,
    "locale" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrerHost" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketingFunnelEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MarketingFunnelEvent_createdAt_idx" ON "MarketingFunnelEvent"("createdAt");
CREATE INDEX "MarketingFunnelEvent_event_createdAt_idx" ON "MarketingFunnelEvent"("event", "createdAt");
CREATE INDEX "MarketingFunnelEvent_sessionId_createdAt_idx" ON "MarketingFunnelEvent"("sessionId", "createdAt");
