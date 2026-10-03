#!/bin/bash
set -e

echo "=== STEP 1: Creating archos_app_role ==="
sudo -u postgres psql -d venueza_prod -c "CREATE ROLE archos_app_role;" || echo "Role may already exist, continuing..."

echo "=== STEP 2: Granting schema usage ==="
sudo -u postgres psql -d venueza_prod -c "GRANT USAGE ON SCHEMA archos TO archos_app_role;"

echo "=== STEP 3: Granting table privileges ==="
sudo -u postgres psql -d venueza_prod -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA archos TO archos_app_role;"

echo "=== STEP 4: Granting sequence privileges ==="
sudo -u postgres psql -d venueza_prod -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA archos TO archos_app_role;"

echo "=== STEP 5: Granting role to venueza user ==="
sudo -u postgres psql -d venueza_prod -c "GRANT archos_app_role TO venueza;"

echo "=== STEP 6: Verifying role exists ==="
sudo -u postgres psql -d venueza_prod -c "SELECT rolname, rolcanlogin, rolbypassrls FROM pg_roles WHERE rolname = 'archos_app_role';"

echo "=== Role bootstrap COMPLETE ==="
