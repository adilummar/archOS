CREATE UNIQUE INDEX "TaskTimeSegment_sessionId_active_idx" ON "TaskTimeSegment"("sessionId") WHERE "endTime" IS NULL;
