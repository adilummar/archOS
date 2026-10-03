#!/bin/bash
set -e

echo "Setting up production database..."

# Create database and owners
sudo -u postgres psql -c "CREATE DATABASE archos_db;" || true
sudo -u postgres psql -c "CREATE USER archos_platform WITH ENCRYPTED PASSWORD 'platform_secret' CREATEDB BYPASSRLS;" || true
sudo -u postgres psql -c "CREATE USER archos_app WITH ENCRYPTED PASSWORD 'app_secret';" || true

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE archos_db TO archos_platform;"
sudo -u postgres psql -c "ALTER DATABASE archos_db OWNER TO archos_platform;"

# Set up schema privileges
sudo -u postgres psql -d archos_db -c "GRANT ALL ON SCHEMA public TO archos_platform;"
sudo -u postgres psql -d archos_db -c "GRANT USAGE ON SCHEMA public TO archos_app;"

echo "Running Prisma Migrations..."
export DATABASE_URL="postgresql://archos_platform:platform_secret@localhost:5432/archos_db?schema=public"
npx prisma migrate deploy

echo "Granting app user access to the app role..."
sudo -u postgres psql -d archos_db -c "GRANT archos_app_role TO archos_app;"

echo "Database setup complete."
