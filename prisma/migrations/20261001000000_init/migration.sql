-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "logo" TEXT,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gstin" TEXT,
    "website" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'starter',
    "priorityPeriodDays" INTEGER NOT NULL DEFAULT 7,
    "minimumTaskLeadTimeDays" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "onboardingState" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "enabledFeatures" TEXT[] DEFAULT ARRAY['DASHBOARD', 'PROJECTS', 'TASKS', 'STAFF', 'ATTENDANCE']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "designation" TEXT,
    "avatarInitials" TEXT,
    "avatarColor" TEXT,
    "costRatePerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "discontinuedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "phone" TEXT,
    "email" TEXT NOT NULL,
    "address" TEXT,
    "gstin" TEXT,
    "portalEnabled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "clientId" TEXT,
    "teamLeadId" TEXT,
    "name" TEXT NOT NULL,
    "clientName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "projectValue" DOUBLE PRECISION,
    "feeAgreed" DOUBLE PRECISION,
    "feeStructure" TEXT,
    "description" TEXT,
    "fileRequestWindowDays" INTEGER NOT NULL DEFAULT 7,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "templateId" TEXT,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectStaff" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ProjectStaff_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "ProjectStage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isClientApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "clientApprovalStatus" TEXT,
    "clientApprovalNote" TEXT,
    "clientApprovedAt" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "plannedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "description" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "stageId" TEXT,
    "assigneeId" TEXT,
    "assignerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "dueDate" TIMESTAMP(3),
    
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "approvalStatus" TEXT,
    "approvalNote" TEXT,
    "approvedById" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subtask" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeLog" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phase" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'working',
    "currentProjectId" TEXT,
    "currentTaskId" TEXT,
    "totalWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalBreakMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTimeSegment" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,
    "taskCompletedOnSwitch" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TaskTimeSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreakRecord" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "durationMinutes" INTEGER,

    CONSTRAINT "BreakRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTemplate" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "feeStructure" TEXT NOT NULL DEFAULT 'per_stage',
    "defaultFileRequestWindowDays" INTEGER NOT NULL DEFAULT 7,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateStage" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "defaultDurationDays" INTEGER NOT NULL DEFAULT 7,
    "description" TEXT,
    "isClientApprovalRequired" BOOLEAN NOT NULL DEFAULT false,
    "isPaymentMilestone" BOOLEAN NOT NULL DEFAULT false,
    "paymentPercentage" DOUBLE PRECISION,
    "drawingTypesExpected" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateTask" (
    "id" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskReviewCycle" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "remark" TEXT NOT NULL,
    "statusRequested" TEXT NOT NULL,
    "previousDueDate" TIMESTAMP(3),
    "requestedDueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskReviewCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignmentOverride" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "teamLeadId" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "requestedDueDate" TIMESTAMP(3) NOT NULL,
    "requiredLeadTimeDays" INTEGER NOT NULL,
    "actualLeadTimeDays" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAssignmentOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAdmin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Firm_slug_key" ON "Firm"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_firmId_idx" ON "User"("firmId");

-- CreateIndex
CREATE INDEX "Client_firmId_idx" ON "Client"("firmId");

-- CreateIndex
CREATE INDEX "Project_firmId_idx" ON "Project"("firmId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "ProjectStage_projectId_idx" ON "ProjectStage"("projectId");

-- CreateIndex
CREATE INDEX "Task_firmId_idx" ON "Task"("firmId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Subtask_taskId_idx" ON "Subtask"("taskId");

-- CreateIndex
CREATE INDEX "TimeLog_firmId_idx" ON "TimeLog"("firmId");

-- CreateIndex
CREATE INDEX "TimeLog_userId_idx" ON "TimeLog"("userId");

-- CreateIndex
CREATE INDEX "TimeLog_projectId_idx" ON "TimeLog"("projectId");

-- CreateIndex
CREATE INDEX "ActivityLog_firmId_idx" ON "ActivityLog"("firmId");

-- CreateIndex
CREATE INDEX "ActivityLog_projectId_idx" ON "ActivityLog"("projectId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "AttendanceSession_firmId_idx" ON "AttendanceSession"("firmId");

-- CreateIndex
CREATE INDEX "AttendanceSession_userId_idx" ON "AttendanceSession"("userId");

-- CreateIndex
CREATE INDEX "AttendanceSession_date_idx" ON "AttendanceSession"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_userId_date_key" ON "AttendanceSession"("userId", "date");

-- CreateIndex
CREATE INDEX "TaskTimeSegment_sessionId_idx" ON "TaskTimeSegment"("sessionId");

-- CreateIndex
CREATE INDEX "TaskTimeSegment_taskId_idx" ON "TaskTimeSegment"("taskId");

-- CreateIndex
CREATE INDEX "BreakRecord_sessionId_idx" ON "BreakRecord"("sessionId");

-- CreateIndex
CREATE INDEX "ProjectTemplate_firmId_idx" ON "ProjectTemplate"("firmId");

-- CreateIndex
CREATE INDEX "TemplateStage_templateId_idx" ON "TemplateStage"("templateId");

-- CreateIndex
CREATE INDEX "TemplateTask_stageId_idx" ON "TemplateTask"("stageId");

-- CreateIndex
CREATE INDEX "TaskReviewCycle_taskId_idx" ON "TaskReviewCycle"("taskId");

-- CreateIndex
CREATE INDEX "TaskReviewCycle_reviewerId_idx" ON "TaskReviewCycle"("reviewerId");

-- CreateIndex
CREATE INDEX "TaskAssignmentOverride_firmId_idx" ON "TaskAssignmentOverride"("firmId");

-- CreateIndex
CREATE INDEX "TaskAssignmentOverride_teamLeadId_idx" ON "TaskAssignmentOverride"("teamLeadId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAdmin_email_key" ON "PlatformAdmin"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProjectTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStaff" ADD CONSTRAINT "ProjectStaff_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStaff" ADD CONSTRAINT "ProjectStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectStage" ADD CONSTRAINT "ProjectStage_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProjectStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignerId_fkey" FOREIGN KEY ("assignerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeLog" ADD CONSTRAINT "TimeLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTimeSegment" ADD CONSTRAINT "TaskTimeSegment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreakRecord" ADD CONSTRAINT "BreakRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectTemplate" ADD CONSTRAINT "ProjectTemplate_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateStage" ADD CONSTRAINT "TemplateStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ProjectTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateTask" ADD CONSTRAINT "TemplateTask_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "TemplateStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReviewCycle" ADD CONSTRAINT "TaskReviewCycle_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskReviewCycle" ADD CONSTRAINT "TaskReviewCycle_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignmentOverride" ADD CONSTRAINT "TaskAssignmentOverride_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignmentOverride" ADD CONSTRAINT "TaskAssignmentOverride_teamLeadId_fkey" FOREIGN KEY ("teamLeadId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignmentOverride" ADD CONSTRAINT "TaskAssignmentOverride_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

