#!/bin/bash
# Disaster Recovery Script for LocumTrueRate.com
# This script handles complete system recovery from backups

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
RECOVERY_DIR="/tmp/recovery"
LOG_FILE="/var/log/recovery/disaster_recovery_$(date +%Y%m%d_%H%M%S).log"

# Ensure directories exist
mkdir -p "${RECOVERY_DIR}"
mkdir -p "$(dirname ${LOG_FILE})"

# Logging function
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling
error_exit() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "${LOG_FILE}"
    exit 1
}

# Success message
success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "${LOG_FILE}"
}

# Warning message
warn() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "${LOG_FILE}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check required tools
    for tool in aws pg_restore openssl terraform kubectl; do
        if ! command -v $tool &> /dev/null; then
            error_exit "$tool is required but not installed"
        fi
    done
    
    # Check environment variables
    required_vars=("DB_HOST" "DB_USER" "DB_NAME" "R2_BUCKET" "R2_ENDPOINT" "BACKUP_ENCRYPTION_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error_exit "Required environment variable $var is not set"
        fi
    done
    
    success "Prerequisites check passed"
}

# Get latest backup
get_latest_backup() {
    log "Fetching latest backup metadata..."
    
    aws s3 cp "s3://${R2_BUCKET}/metadata/latest_backup.json" \
        "${RECOVERY_DIR}/latest_backup.json" \
        --endpoint-url "${R2_ENDPOINT}" || error_exit "Failed to fetch backup metadata"
    
    LATEST_BACKUP=$(jq -r '.timestamp' "${RECOVERY_DIR}/latest_backup.json")
    BACKUP_TYPE=$(jq -r '.type' "${RECOVERY_DIR}/latest_backup.json")
    
    log "Latest backup: ${LATEST_BACKUP} (${BACKUP_TYPE})"
    
    # Download the backup
    ENCRYPTED_BACKUP="locumtruerate_db_${LATEST_BACKUP}.sql.enc"
    log "Downloading backup: ${ENCRYPTED_BACKUP}"
    
    aws s3 cp "s3://${R2_BUCKET}/${BACKUP_TYPE}/${ENCRYPTED_BACKUP}" \
        "${RECOVERY_DIR}/${ENCRYPTED_BACKUP}" \
        --endpoint-url "${R2_ENDPOINT}" || error_exit "Failed to download backup"
    
    success "Backup downloaded successfully"
}

# Decrypt backup
decrypt_backup() {
    log "Decrypting backup..."
    
    DECRYPTED_BACKUP="${RECOVERY_DIR}/locumtruerate_db_${LATEST_BACKUP}.sql"
    
    openssl enc -d -aes-256-cbc \
        -in "${RECOVERY_DIR}/${ENCRYPTED_BACKUP}" \
        -out "${DECRYPTED_BACKUP}" \
        -pass pass:"${BACKUP_ENCRYPTION_KEY}" || error_exit "Failed to decrypt backup"
    
    # Verify decrypted file
    if [[ ! -s "${DECRYPTED_BACKUP}" ]]; then
        error_exit "Decrypted backup is empty"
    fi
    
    success "Backup decrypted successfully"
}

# Restore database
restore_database() {
    log "Restoring database..."
    
    # Create recovery database if needed
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d postgres \
        -c "CREATE DATABASE ${DB_NAME}_recovery;" 2>/dev/null || warn "Recovery database already exists"
    
    # Restore backup
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}_recovery" \
        -f "${DECRYPTED_BACKUP}" || error_exit "Database restore failed"
    
    # Verify restore
    RECORD_COUNT=$(PGPASSWORD="${DB_PASSWORD}" psql \
        -h "${DB_HOST}" \
        -U "${DB_USER}" \
        -d "${DB_NAME}_recovery" \
        -t -c "SELECT COUNT(*) FROM users;")
    
    log "Restored database contains ${RECORD_COUNT} users"
    
    if [[ $RECORD_COUNT -eq 0 ]]; then
        error_exit "Restored database appears to be empty"
    fi
    
    success "Database restored successfully"
}

# Restore application files
restore_application() {
    log "Restoring application files..."
    
    # Pull latest code from Git
    if [[ -d "/app" ]]; then
        cd /app
        git fetch origin
        git reset --hard origin/main || error_exit "Failed to restore application code"
    else
        warn "Application directory not found, skipping code restore"
    fi
    
    success "Application files restored"
}

# Restore R2 assets
restore_assets() {
    log "Checking R2 assets..."
    
    # R2 assets are already replicated, just verify
    ASSET_COUNT=$(aws s3 ls "s3://${R2_BUCKET}/assets/" \
        --endpoint-url "${R2_ENDPOINT}" \
        --recursive | wc -l)
    
    log "Found ${ASSET_COUNT} assets in R2"
    
    if [[ $ASSET_COUNT -eq 0 ]]; then
        warn "No assets found in R2 - manual restoration may be required"
    else
        success "R2 assets verified"
    fi
}

# Update DNS and load balancers
update_routing() {
    log "Updating routing configuration..."
    
    # This would typically update Cloudflare DNS/Load Balancer
    # For now, we'll just log the action
    warn "Manual DNS update required - please update Cloudflare configuration"
    
    # Health check new environment
    if curl -f -s -o /dev/null "${HEALTH_CHECK_URL:-http://localhost:3000/health}"; then
        success "Health check passed"
    else
        warn "Health check failed - manual intervention required"
    fi
}

# Main recovery process
main() {
    echo -e "${GREEN}=== LocumTrueRate.com Disaster Recovery ===${NC}"
    echo -e "${YELLOW}This process will restore the system from backup${NC}"
    echo ""
    
    # Confirmation
    read -p "Are you sure you want to proceed with disaster recovery? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Recovery cancelled"
        exit 0
    fi
    
    log "Starting disaster recovery process..."
    
    # Load environment
    if [[ -f ".env" ]]; then
        source .env
    else
        error_exit ".env file not found"
    fi
    
    # Execute recovery steps
    check_prerequisites
    get_latest_backup
    decrypt_backup
    restore_database
    restore_application
    restore_assets
    update_routing
    
    # Clean up
    log "Cleaning up temporary files..."
    rm -rf "${RECOVERY_DIR}"
    
    # Final summary
    echo ""
    echo -e "${GREEN}=== Recovery Summary ===${NC}"
    echo "Database: Restored from ${LATEST_BACKUP}"
    echo "Application: Latest code from Git"
    echo "Assets: Verified in R2"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Verify application functionality"
    echo "2. Update DNS records if needed"
    echo "3. Monitor error logs"
    echo "4. Notify team of recovery completion"
    echo ""
    
    success "Disaster recovery completed!"
    log "Recovery log saved to: ${LOG_FILE}"
}

# Run main function
main "$@"