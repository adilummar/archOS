CREATE UNIQUE INDEX "BreakRecord_sessionId_active_idx" ON "BreakRecord"("sessionId") WHERE "endTime" IS NULL;
