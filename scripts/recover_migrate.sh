#!/bin/bash
set -e

echo "=== STEP 7: Clearing failed migration record ==="
cd ~/archOS
npx prisma migrate resolve --rolled-back 20261001000002_rls_policies

echo "=== STEP 8: Re-applying migrations ==="
npx prisma migrate deploy

echo "=== STEP 9: Verifying RLS is active ==="
sudo -u postgres psql -d venueza_prod -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'archos' ORDER BY tablename;"

echo "=== STEP 10: Build ==="
npm run build

echo "=== STEP 11: Restart application ==="
pm2 restart archOS

echo "=== RECOVERY COMPLETE ==="
