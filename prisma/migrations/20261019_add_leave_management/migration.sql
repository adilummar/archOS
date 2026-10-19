-- Migration: 20261019_add_leave_management
-- Adds leave management with RLS tenant isolation and firm attendance policy settings

-- 1. Extend Firm with Attendance & Leave Policy Settings
ALTER TABLE "Firm"
  ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN IF NOT EXISTS "officeStartTime" TEXT NOT NULL DEFAULT '09:15',
  ADD COLUMN IF NOT EXISTS "annualLeaveQuota" INTEGER NOT NULL DEFAULT 21,
  ADD COLUMN IF NOT EXISTS "workweekDays" INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}';

-- 2. Create LeaveRequest Table
CREATE TABLE IF NOT EXISTS "LeaveRequest" (
  "id" TEXT NOT NULL,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'annual',
  "startDate" TEXT NOT NULL,
  "endDate" TEXT NOT NULL,
  "days" INTEGER NOT NULL,
  "reason" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionNote" TEXT,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveRequest_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS "LeaveRequest_firmId_idx" ON "LeaveRequest"("firmId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE INDEX IF NOT EXISTS "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX IF NOT EXISTS "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "LeaveRequest_firmId_status_idx" ON "LeaveRequest"("firmId", "status");

-- 4. Enable Row-Level Security (RLS) with Read and Write Policy
ALTER TABLE "LeaveRequest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "firm_isolation" ON "LeaveRequest";
CREATE POLICY "firm_isolation" ON "LeaveRequest"
  FOR ALL
  USING ("firmId" = current_setting('app.current_firm_id', true))
  WITH CHECK ("firmId" = current_setting('app.current_firm_id', true));

-- 5. Grant Permissions to archos_app_role
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'archos_app_role') THEN
    EXECUTE 'GRANT ALL PRIVILEGES ON TABLE "LeaveRequest" TO archos_app_role';
  END IF;
END $$;
