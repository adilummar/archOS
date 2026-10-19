-- Add safe template deletion (archival) to ProjectTemplate
-- Preserves existing projects while preventing future selection of deleted templates

ALTER TABLE "ProjectTemplate"
  ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "ProjectTemplate_firmId_isArchived_idx"
  ON "ProjectTemplate"("firmId", "isArchived");
