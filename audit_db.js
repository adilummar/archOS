const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const rls = await p.$queryRawUnsafe("SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename");
  console.log('RLS_STATUS:', JSON.stringify(rls, null, 2));

  const policies = await p.$queryRawUnsafe("SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public'");
  console.log('POLICIES:', JSON.stringify(policies, null, 2));

  const funcs = await p.$queryRawUnsafe("SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'");
  console.log('FUNCTIONS:', JSON.stringify(funcs, null, 2));

  const pwCols = await p.$queryRawUnsafe("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND (column_name ILIKE '%password%' OR column_name ILIKE '%hash%' OR column_name ILIKE '%secret%' OR column_name ILIKE '%token%')");
  console.log('AUTH_COLS:', JSON.stringify(pwCols, null, 2));

  const userCols = await p.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'User' ORDER BY ordinal_position");
  console.log('USER_COLS:', JSON.stringify(userCols, null, 2));

  const firmCols = await p.$queryRawUnsafe("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Firm' ORDER BY ordinal_position");
  console.log('FIRM_COLS:', JSON.stringify(firmCols, null, 2));

  await p.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
