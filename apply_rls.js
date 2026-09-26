const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statements = [
    "CREATE ROLE archos_app_role NOLOGIN",
    "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO archos_app_role",
    "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO archos_app_role",
    
    // Enable RLS
    "ALTER TABLE \\\"Firm\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"User\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"Client\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"Project\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"ProjectStaff\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"ProjectStage\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"Task\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"Subtask\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TimeLog\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"ActivityLog\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"AttendanceSession\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TaskTimeSegment\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"BreakRecord\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"ProjectTemplate\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TemplateStage\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TemplateTask\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TaskReviewCycle\\\" ENABLE ROW LEVEL SECURITY",
    "ALTER TABLE \\\"TaskAssignmentOverride\\\" ENABLE ROW LEVEL SECURITY",
    
    // Drop existing policies
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"Firm\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"User\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"Client\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"Project\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"Task\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"TimeLog\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"ActivityLog\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"AttendanceSession\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"ProjectTemplate\\\"",
    "DROP POLICY IF EXISTS \\\"firm_isolation\\\" ON \\\"TaskAssignmentOverride\\\"",
    
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"ProjectStaff\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"ProjectStage\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"Subtask\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"TaskTimeSegment\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"BreakRecord\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"TemplateStage\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"TemplateTask\\\"",
    "DROP POLICY IF EXISTS \\\"parent_isolation\\\" ON \\\"TaskReviewCycle\\\"",

    // Create firm isolation policies
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"Firm\\\" FOR ALL USING (id = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"User\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"Client\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"Project\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"Task\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"TimeLog\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"ActivityLog\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"AttendanceSession\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"ProjectTemplate\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",
    "CREATE POLICY \\\"firm_isolation\\\" ON \\\"TaskAssignmentOverride\\\" FOR ALL USING (\\\"firmId\\\" = current_setting('app.current_firm_id', true))",

    // Create parent derived isolation policies
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"ProjectStaff\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"Project\\\" WHERE id = \\\"projectId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"ProjectStage\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"Project\\\" WHERE id = \\\"projectId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"Subtask\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"Task\\\" WHERE id = \\\"taskId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"TaskTimeSegment\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"AttendanceSession\\\" WHERE id = \\\"sessionId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"BreakRecord\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"AttendanceSession\\\" WHERE id = \\\"sessionId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"TemplateStage\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"ProjectTemplate\\\" WHERE id = \\\"templateId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"TemplateTask\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"TemplateStage\\\" ts JOIN \\\"ProjectTemplate\\\" pt ON ts.\\\"templateId\\\" = pt.id WHERE ts.id = \\\"stageId\\\" AND pt.\\\"firmId\\\" = current_setting('app.current_firm_id', true)))",
    "CREATE POLICY \\\"parent_isolation\\\" ON \\\"TaskReviewCycle\\\" FOR ALL USING (EXISTS (SELECT 1 FROM \\\"Task\\\" WHERE id = \\\"taskId\\\" AND \\\"firmId\\\" = current_setting('app.current_firm_id', true)))"
  ];
  
  for (const s of statements) {
    try {
      await prisma.$executeRawUnsafe(s);
    } catch(e) {
      if (s.includes('CREATE ROLE') && e.message.includes('already exists')) continue;
      console.error('Failed statement:', s);
      console.error(e);
      process.exit(1);
    }
  }
  console.log('Successfully enabled RLS on all tables!');
}

main().finally(() => prisma.$disconnect());
