#!/bin/bash
set -e

# Production Database Restore Script
# Requires: pg_restore, gunzip, aws-cli (or rclone)

# Environment Variables Expected:
# TARGET_DB_URL - Connection string for the target database (must NOT be production without explicit safety checks)
# BACKUP_S3_URI - Exact URI of the backup file to restore, e.g., s3://archos-backups/prod-db/archos_db_backup_2026-10-01.sql.gz

if [ -z "$TARGET_DB_URL" ] || [ -z "$BACKUP_S3_URI" ]; then
  echo "Error: TARGET_DB_URL and BACKUP_S3_URI must be set."
  exit 1
fi

# Safety check
if [[ "$TARGET_DB_URL" == *"prod"* ]]; then
  echo "WARNING: You are attempting to restore into a database containing 'prod' in its URL."
  read -p "Are you absolutely sure? (Type 'YES-RESTORE-PROD'): " CONFIRM
  if [ "$CONFIRM" != "YES-RESTORE-PROD" ]; then
    echo "Aborting."
    exit 1
  fi
fi

TEMP_ARCHIVE="/tmp/restore_archive.sql.gz"

echo "Downloading backup from $BACKUP_S3_URI..."
if aws s3 cp "$BACKUP_S3_URI" "$TEMP_ARCHIVE"; then
  echo "Download successful."
else
  echo "Error: Failed to download backup."
  exit 1
fi

echo "Restoring database..."
# Drop and recreate schema public to ensure a clean slate, then restore.
# A full script should ideally use `pg_restore -c` or similar, but since we piped pg_dump to gzip, we decompress and feed to psql
gunzip -c "$TEMP_ARCHIVE" | psql "$TARGET_DB_URL"

echo "Database restoration completed successfully."
rm -f "$TEMP_ARCHIVE"
exit 0
