#!/bin/bash
set -e

# Production Database Backup Script
# Requires: pg_dump, gzip, aws-cli (or rclone) configured with R2/S3

# Environment Variables Expected:
# BACKUP_DB_URL - Connection string for the database (use a read-only role if possible)
# S3_DESTINATION - e.g., s3://archos-backups/prod-db/

if [ -z "$BACKUP_DB_URL" ] || [ -z "$S3_DESTINATION" ]; then
  echo "Error: BACKUP_DB_URL and S3_DESTINATION must be set."
  exit 1
fi

TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILENAME="archos_db_backup_$TIMESTAMP.sql.gz"
BACKUP_DIR="/tmp/archos_backups"

mkdir -p "$BACKUP_DIR"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

echo "Starting database backup at $TIMESTAMP..."

# Dump and compress
if pg_dump "$BACKUP_DB_URL" | gzip > "$BACKUP_PATH"; then
  echo "Database successfully dumped and compressed to $BACKUP_PATH"
else
  echo "Error: pg_dump failed."
  exit 1
fi

echo "Uploading to remote storage ($S3_DESTINATION)..."

# Upload to S3/R2
if aws s3 cp "$BACKUP_PATH" "$S3_DESTINATION$BACKUP_FILENAME"; then
  echo "Upload successful."
else
  echo "Error: Failed to upload backup to remote storage."
  exit 1
fi

# Cleanup local backup
rm -f "$BACKUP_PATH"

# Enforce retention (e.g., remove backups older than 30 days on remote)
# Note: In production, bucket lifecycle rules are highly recommended instead of script-based deletion.
echo "Backup process completed successfully."
exit 0
