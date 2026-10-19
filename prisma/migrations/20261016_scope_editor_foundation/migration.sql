-- Phase 2-A: Scope Editor Foundation
-- Adds archive support to ProjectStage and Task,
-- and introduces TemplateSubtask for reusable subtask definitions.

-- ─── 1. ProjectStage: add updatedAt, isArchived, archivedAt ─────────────────

ALTER TABLE "ProjectStage"
  ADD COLUMN IF NOT EXISTS "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS "isArchived"  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "archivedAt"  TIMESTAMP(3);

-- ─── 2. Task: add isArchived, archivedAt ────────────────────────────────────
-- Task already has updatedAt @updatedAt (schema line 198); no change there.

ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- ─── 3. TemplateSubtask: new model for reusable subtask definitions ──────────
-- Mirrors Subtask but belongs to a TemplateTask.

CREATE TABLE IF NOT EXISTS "TemplateSubtask" (
  "id"        TEXT         NOT NULL,
  "taskId"    TEXT         NOT NULL,
  "title"     TEXT         NOT NULL,
  "order"     INTEGER      NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

  CONSTRAINT "TemplateSubtask_pkey" PRIMARY KEY ("id")
);

-- FK: TemplateSubtask → TemplateTask (cascade on task delete)
ALTER TABLE "TemplateSubtask"
  ADD CONSTRAINT "TemplateSubtask_taskId_fkey"
  FOREIGN KEY ("taskId") REFERENCES "TemplateTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "TemplateSubtask_taskId_idx" ON "TemplateSubtask"("taskId");

-- ─── 4. Indexes for archive filtering ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS "ProjectStage_projectId_isArchived_idx"
  ON "ProjectStage"("projectId", "isArchived");

CREATE INDEX IF NOT EXISTS "Task_projectId_isArchived_idx"
  ON "Task"("projectId", "isArchived");

-- ─── 5. RLS for TemplateSubtask ─────────────────────────────────────────────

ALTER TABLE "TemplateSubtask" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parent_isolation" ON "TemplateSubtask";

CREATE POLICY "parent_isolation" ON "TemplateSubtask"
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM "TemplateTask" tt
      JOIN "TemplateStage" ts ON tt."stageId" = ts.id
      JOIN "ProjectTemplate" pt ON ts."templateId" = pt.id
      WHERE tt.id = "taskId"
        AND pt."firmId" = current_setting('app.current_firm_id', true)
    )
  );

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'archos_app_role') THEN
    EXECUTE 'GRANT ALL PRIVILEGES ON TABLE "TemplateSubtask" TO archos_app_role';
    EXECUTE 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archos_app_role';
  END IF;
END
$$;
