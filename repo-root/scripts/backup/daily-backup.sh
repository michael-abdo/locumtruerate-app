#!/bin/bash
# Daily Backup Script for LocumTrueRate.com
# This script performs automated daily backups of the database and uploads to R2

set -euo pipefail

# Load environment variables
source .env

# Configuration
BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_BACKUP_NAME="locumtruerate_db_${TIMESTAMP}.sql"
ENCRYPTED_BACKUP_NAME="${DB_BACKUP_NAME}.enc"
LOG_FILE="/var/log/backup/daily_backup_${TIMESTAMP}.log"

# R2 Configuration
R2_BUCKET="locumtruerate-backups"
R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname ${LOG_FILE})"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    # Send alert to monitoring
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"🚨 Backup Failed: $1\"}" || true
    exit 1
}

# Success notification
success_notify() {
    log "SUCCESS: $1"
    # Send success metric
    curl -X POST "${MONITORING_ENDPOINT}/metrics" \
        -H 'Content-Type: application/json' \
        -d "{\"metric\":\"backup.success\",\"value\":1,\"tags\":{\"type\":\"$1\"}}" || true
}

log "Starting daily backup process..."

# Step 1: Database Backup
log "Backing up PostgreSQL database..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
    -h "${DB_HOST}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    -p "${DB_PORT}" \
    --no-owner \
    --no-privileges \
    --if-exists \
    --clean \
    --create \
    -f "${BACKUP_DIR}/${DB_BACKUP_NAME}" || error_exit "Database backup failed"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${DB_BACKUP_NAME}" | cut -f1)
log "Database backup completed. Size: ${BACKUP_SIZE}"

# Step 2: Encrypt backup
log "Encrypting backup..."
openssl enc -aes-256-cbc \
    -salt \
    -in "${BACKUP_DIR}/${DB_BACKUP_NAME}" \
    -out "${BACKUP_DIR}/${ENCRYPTED_BACKUP_NAME}" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}" || error_exit "Encryption failed"

# Remove unencrypted backup
rm -f "${BACKUP_DIR}/${DB_BACKUP_NAME}"

# Step 3: Upload to R2
log "Uploading to Cloudflare R2..."

# Daily backup
aws s3 cp "${BACKUP_DIR}/${ENCRYPTED_BACKUP_NAME}" \
    "s3://${R2_BUCKET}/daily/${ENCRYPTED_BACKUP_NAME}" \
    --endpoint-url "${R2_ENDPOINT}" || error_exit "R2 upload failed"

# Weekly backup (every Sunday)
if [[ $(date +%u) -eq 7 ]]; then
    log "Creating weekly backup..."
    aws s3 cp "${BACKUP_DIR}/${ENCRYPTED_BACKUP_NAME}" \
        "s3://${R2_BUCKET}/weekly/week_$(date +%Y_%U)_${ENCRYPTED_BACKUP_NAME}" \
        --endpoint-url "${R2_ENDPOINT}" || error_exit "Weekly backup upload failed"
fi

# Monthly backup (first day of month)
if [[ $(date +%d) -eq 01 ]]; then
    log "Creating monthly backup..."
    aws s3 cp "${BACKUP_DIR}/${ENCRYPTED_BACKUP_NAME}" \
        "s3://${R2_BUCKET}/monthly/month_$(date +%Y_%m)_${ENCRYPTED_BACKUP_NAME}" \
        --endpoint-url "${R2_ENDPOINT}" || error_exit "Monthly backup upload failed"
fi

# Step 4: Clean up old backups
log "Cleaning up old backups..."

# Remove local backup
rm -f "${BACKUP_DIR}/${ENCRYPTED_BACKUP_NAME}"

# Remove R2 backups older than retention policy
# Daily: Keep 7 days
aws s3 ls "s3://${R2_BUCKET}/daily/" --endpoint-url "${R2_ENDPOINT}" | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "7 days ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                log "Deleting old daily backup: $fileName"
                aws s3 rm "s3://${R2_BUCKET}/daily/$fileName" --endpoint-url "${R2_ENDPOINT}"
            fi
        fi
    done

# Weekly: Keep 4 weeks
aws s3 ls "s3://${R2_BUCKET}/weekly/" --endpoint-url "${R2_ENDPOINT}" | \
    while read -r line; do
        createDate=$(echo $line | awk '{print $1" "$2}')
        createDate=$(date -d "$createDate" +%s)
        olderThan=$(date -d "4 weeks ago" +%s)
        if [[ $createDate -lt $olderThan ]]; then
            fileName=$(echo $line | awk '{print $4}')
            if [[ $fileName != "" ]]; then
                log "Deleting old weekly backup: $fileName"
                aws s3 rm "s3://${R2_BUCKET}/weekly/$fileName" --endpoint-url "${R2_ENDPOINT}"
            fi
        fi
    done

# Step 5: Validate backup
log "Validating backup integrity..."
REMOTE_SIZE=$(aws s3 ls "s3://${R2_BUCKET}/daily/${ENCRYPTED_BACKUP_NAME}" \
    --endpoint-url "${R2_ENDPOINT}" | awk '{print $3}')

if [[ -z "$REMOTE_SIZE" ]] || [[ "$REMOTE_SIZE" -eq 0 ]]; then
    error_exit "Backup validation failed - file not found or empty"
fi

# Step 6: Update backup metadata
log "Updating backup metadata..."
echo "{
    \"timestamp\": \"${TIMESTAMP}\",
    \"size\": \"${BACKUP_SIZE}\",
    \"encrypted_size\": \"${REMOTE_SIZE}\",
    \"type\": \"daily\",
    \"status\": \"success\"
}" | aws s3 cp - "s3://${R2_BUCKET}/metadata/latest_backup.json" \
    --endpoint-url "${R2_ENDPOINT}" \
    --content-type "application/json"

# Success
success_notify "daily_backup"
log "Daily backup completed successfully!"

# Clean up log files older than 30 days
find /var/log/backup -name "daily_backup_*.log" -mtime +30 -delete

exit 0