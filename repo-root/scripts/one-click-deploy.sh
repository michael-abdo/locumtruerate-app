#!/bin/bash

# ============================================================================
# LocumTrueRate One-Click Cloudflare Pages Deployment Script
# ============================================================================
# Comprehensive deployment script with automatic environment detection,
# error handling, and clear status updates
#
# Usage:
#   ./scripts/one-click-deploy.sh [staging|production]
#   Default: staging
# ============================================================================

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# ====================
# Configuration
# ====================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${1:-staging}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="${PROJECT_ROOT}/deployment_${DEPLOYMENT_ENV}_${TIMESTAMP}.log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ====================
# Logging Functions
# ====================

# Function to log to both console and file
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_header() {
    log ""
    log "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
    log "${PURPLE}║ ${1}${NC}"
    log "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
    log ""
}

log_step() {
    log "${CYAN}▶ ${1}${NC}"
}

log_info() {
    log "${BLUE}ℹ️  ${1}${NC}"
}

log_success() {
    log "${GREEN}✅ ${1}${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  ${1}${NC}"
}

log_error() {
    log "${RED}❌ ${1}${NC}"
}

# Function to handle errors
handle_error() {
    local exit_code=$?
    log_error "Deployment failed at line $1"
    log_error "Exit code: $exit_code"
    log ""
    log_error "Check the log file for details: $LOG_FILE"
    
    # Cleanup on error
    cleanup_on_error
    
    exit $exit_code
}

# Trap errors
trap 'handle_error ${LINENO}' ERR

# ====================
# Utility Functions
# ====================

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait with spinner
wait_with_spinner() {
    local pid=$1
    local message=$2
    local spinstr='|/-\'
    
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c] %s" "$spinstr" "$message" >&2
        spinstr=$temp${spinstr%"$temp"}
        sleep 0.1
        printf "\r" >&2
    done
    printf "    \r" >&2
}

# Function to cleanup on error
cleanup_on_error() {
    log_warning "Cleaning up after error..."
    
    # Remove any temporary files
    rm -f "${PROJECT_ROOT}/.deploy_temp_*" 2>/dev/null || true
    
    # Reset any git changes if needed
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warning "Uncommitted changes detected. Please review manually."
    fi
}

# Function to validate URL accessibility
check_url_accessibility() {
    local url=$1
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --head --fail "$url" >/dev/null 2>&1; then
            return 0
        fi
        
        log_info "Waiting for deployment to propagate... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    return 1
}

# ====================
# Pre-flight Checks
# ====================

preflight_checks() {
    log_header "Pre-flight Checks"
    
    # Check current directory
    if [[ ! -f "${PROJECT_ROOT}/package.json" ]]; then
        log_error "Not in project root directory"
        exit 1
    fi
    
    log_step "Checking required tools..."
    
    # Check Node.js
    if ! command_exists node; then
        log_error "Node.js is not installed"
        exit 1
    fi
    log_success "Node.js: $(node --version)"
    
    # Check pnpm
    if ! command_exists pnpm; then
        log_error "pnpm is not installed. Installing..."
        npm install -g pnpm
    fi
    log_success "pnpm: $(pnpm --version)"
    
    # Check git
    if ! command_exists git; then
        log_error "git is not installed"
        exit 1
    fi
    log_success "git: $(git --version | head -1)"
    
    # Check for required environment variables
    log_step "Checking environment variables..."
    
    local required_vars=("CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ACCOUNT_ID")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        log ""
        log_info "Please set these environment variables:"
        log_info "  export CLOUDFLARE_API_TOKEN='your-api-token'"
        log_info "  export CLOUDFLARE_ACCOUNT_ID='your-account-id'"
        exit 1
    fi
    
    log_success "All required environment variables are set"
    
    # Check deployment environment
    if [[ "$DEPLOYMENT_ENV" != "staging" && "$DEPLOYMENT_ENV" != "production" ]]; then
        log_error "Invalid deployment environment: $DEPLOYMENT_ENV"
        log_info "Valid options: staging, production"
        exit 1
    fi
    
    log_success "Deployment environment: $DEPLOYMENT_ENV"
    
    # Check git status
    log_step "Checking git status..."
    
    local branch=$(git rev-parse --abbrev-ref HEAD)
    log_info "Current branch: $branch"
    
    if [[ -n "$(git status --porcelain)" ]]; then
        log_warning "You have uncommitted changes"
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Verify configuration files
    log_step "Checking configuration files..."
    
    local config_file
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        config_file="cloudflare-pages.config.json"
    else
        config_file="cloudflare-pages.${DEPLOYMENT_ENV}.json"
    fi
    
    if [[ ! -f "${PROJECT_ROOT}/${config_file}" ]]; then
        log_error "Configuration file not found: $config_file"
        exit 1
    fi
    
    log_success "Configuration file found: $config_file"
    
    # Validate Cloudflare setup
    log_step "Validating Cloudflare setup..."
    
    if [[ -f "${PROJECT_ROOT}/scripts/validate-cloudflare-setup.js" ]]; then
        node "${PROJECT_ROOT}/scripts/validate-cloudflare-setup.js" >> "$LOG_FILE" 2>&1 || {
            log_warning "Cloudflare setup validation had issues. Check log for details."
        }
    fi
    
    log_success "Pre-flight checks completed"
}

# ====================
# Build Process
# ====================

build_application() {
    log_header "Building Application"
    
    # Install dependencies
    log_step "Installing dependencies..."
    
    if ! pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1; then
        log_error "Failed to install dependencies"
        exit 1
    fi
    
    log_success "Dependencies installed"
    
    # Run tests (optional for staging)
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        log_step "Running tests..."
        
        if ! pnpm turbo run test --filter=!mobile >> "$LOG_FILE" 2>&1; then
            log_error "Tests failed. Fix issues before deploying to production."
            exit 1
        fi
        
        log_success "All tests passed"
        
        # Run linting
        log_step "Running linting..."
        
        if ! pnpm turbo run lint >> "$LOG_FILE" 2>&1; then
            log_warning "Linting issues found. Consider fixing before deployment."
        else
            log_success "Linting passed"
        fi
        
        # Run type checking
        log_step "Running type checking..."
        
        if ! pnpm turbo run type-check >> "$LOG_FILE" 2>&1; then
            log_warning "Type checking issues found. Consider fixing before deployment."
        else
            log_success "Type checking passed"
        fi
    fi
    
    # Build all packages
    log_step "Building packages..."
    
    # Set environment for build
    export NODE_ENV=$DEPLOYMENT_ENV
    export NEXT_PUBLIC_APP_ENV=$DEPLOYMENT_ENV
    
    if ! pnpm turbo run build --filter=!mobile >> "$LOG_FILE" 2>&1; then
        log_error "Build failed. Check log for details."
        exit 1
    fi
    
    log_success "Build completed successfully"
    
    # Verify build output
    log_step "Verifying build output..."
    
    if [[ ! -d "${PROJECT_ROOT}/apps/web/out" ]] && [[ ! -d "${PROJECT_ROOT}/apps/web/.next" ]]; then
        log_error "Build output not found"
        exit 1
    fi
    
    log_success "Build output verified"
}

# ====================
# Security Validation
# ====================

security_validation() {
    log_header "Security Validation"
    
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        # Run security scanner if available
        if [[ -f "${PROJECT_ROOT}/packages/security/dist/scanner.js" ]]; then
            log_step "Running security scan..."
            
            if ! node "${PROJECT_ROOT}/packages/security/dist/scanner.js" --target apps/web/out >> "$LOG_FILE" 2>&1; then
                log_warning "Security scan found issues. Review before deployment."
            else
                log_success "Security scan passed"
            fi
        fi
        
        # Validate secrets
        if [[ -f "${PROJECT_ROOT}/packages/secrets/dist/cli.js" ]]; then
            log_step "Validating secrets configuration..."
            
            if ! node "${PROJECT_ROOT}/packages/secrets/dist/cli.js" validate --env production >> "$LOG_FILE" 2>&1; then
                log_warning "Secrets validation had warnings"
            else
                log_success "Secrets validated"
            fi
        fi
    fi
    
    # Check for exposed secrets in code
    log_step "Checking for exposed secrets..."
    
    local secret_patterns=("api_key" "secret_key" "password" "token")
    local found_secrets=false
    
    for pattern in "${secret_patterns[@]}"; do
        if grep -r "$pattern" --include="*.js" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git "${PROJECT_ROOT}" 2>/dev/null | grep -v "process.env" | grep -v "import.meta.env" >/dev/null; then
            found_secrets=true
            break
        fi
    done
    
    if [[ "$found_secrets" == "true" ]]; then
        log_warning "Potential exposed secrets found in code. Review before deployment."
    else
        log_success "No obvious exposed secrets found"
    fi
}

# ====================
# Deployment
# ====================

deploy_to_cloudflare() {
    log_header "Deploying to Cloudflare Pages"
    
    local config_file
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        config_file="cloudflare-pages.config.json"
    else
        config_file="cloudflare-pages.${DEPLOYMENT_ENV}.json"
    fi
    
    log_info "Using configuration: $config_file"
    
    # Check if project exists
    log_step "Checking Cloudflare Pages project..."
    
    local project_name=$(jq -r '.projectName' "${PROJECT_ROOT}/${config_file}")
    
    # Deploy using the Cloudflare Pages CLI
    log_step "Deploying to Cloudflare Pages ($DEPLOYMENT_ENV)..."
    
    cd "$PROJECT_ROOT"
    
    if [[ -f "${PROJECT_ROOT}/packages/cloudflare-pages/bin/deploy.js" ]]; then
        # Use custom deployment tool
        if ! node "${PROJECT_ROOT}/packages/cloudflare-pages/bin/deploy.js" deploy --config "$config_file" >> "$LOG_FILE" 2>&1; then
            log_error "Deployment failed"
            exit 1
        fi
    else
        # Fallback to wrangler if custom tool not available
        log_warning "Custom deployment tool not found, using wrangler..."
        
        if ! command_exists wrangler; then
            log_info "Installing wrangler..."
            npm install -g wrangler
        fi
        
        local build_output=$(jq -r '.buildOutput // "apps/web/out"' "${PROJECT_ROOT}/${config_file}")
        
        if ! wrangler pages deploy "$build_output" --project-name="$project_name" >> "$LOG_FILE" 2>&1; then
            log_error "Deployment failed"
            exit 1
        fi
    fi
    
    log_success "Deployment completed successfully!"
}

# ====================
# Post-Deployment
# ====================

post_deployment_checks() {
    log_header "Post-Deployment Verification"
    
    # Get deployment URLs
    local site_url
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        site_url="https://locumtruerate.com"
    else
        site_url="https://${DEPLOYMENT_ENV}.locumtruerate.com"
    fi
    
    log_step "Waiting for deployment to propagate..."
    sleep 15
    
    # Check site accessibility
    log_step "Checking site accessibility..."
    
    if check_url_accessibility "$site_url"; then
        log_success "Site is accessible at $site_url"
    else
        log_warning "Site accessibility check failed. It may still be propagating."
    fi
    
    # Check security headers
    log_step "Verifying security headers..."
    
    local headers=$(curl -s -I "$site_url" 2>/dev/null || echo "")
    
    if echo "$headers" | grep -q "content-security-policy"; then
        log_success "CSP header present"
    else
        log_warning "CSP header not found"
    fi
    
    if echo "$headers" | grep -q "x-frame-options"; then
        log_success "X-Frame-Options header present"
    else
        log_warning "X-Frame-Options header not found"
    fi
    
    if [[ "$DEPLOYMENT_ENV" == "production" ]] && echo "$headers" | grep -q "strict-transport-security"; then
        log_success "HSTS header present"
    fi
    
    # Generate deployment report
    log_step "Generating deployment report..."
    
    local report_file="${PROJECT_ROOT}/deployment_report_${DEPLOYMENT_ENV}_${TIMESTAMP}.txt"
    
    cat > "$report_file" << EOF
LocumTrueRate Deployment Report
==============================

Environment: $DEPLOYMENT_ENV
Timestamp: $(date)
Git Branch: $(git rev-parse --abbrev-ref HEAD)
Git Commit: $(git rev-parse --short HEAD)

Deployment URL: $site_url

Status: SUCCESS

Next Steps:
1. Test all critical user flows
2. Monitor error logs and metrics
3. Verify API endpoints are working
4. Check analytics and monitoring

For production deployments:
- Update DNS records if needed
- Configure custom domain in Cloudflare
- Set up SSL certificates
- Enable DDoS protection
- Configure rate limiting

EOF
    
    log_success "Deployment report saved: $report_file"
}

# ====================
# Cleanup Function
# ====================

cleanup_unnecessary_files() {
    log_header "Cleanup Recommendations"
    
    log_info "The following files can be safely removed to streamline deployment:"
    log ""
    
    # List backup duplicates
    if [[ -d "${PROJECT_ROOT}/.backup-duplicates" ]]; then
        log_warning "Backup duplicates directory:"
        log_info "  rm -rf .backup-duplicates/"
    fi
    
    # List redundant scripts
    local redundant_scripts=(
        "scripts/production-deploy.sh"  # Replaced by this one-click script
    )
    
    for script in "${redundant_scripts[@]}"; do
        if [[ -f "${PROJECT_ROOT}/${script}" ]]; then
            log_warning "Redundant script:"
            log_info "  rm $script"
        fi
    done
    
    # Old deployment logs
    local old_logs=$(find "$PROJECT_ROOT" -name "deployment_*.log" -mtime +7 2>/dev/null | wc -l)
    if [[ $old_logs -gt 0 ]]; then
        log_warning "Old deployment logs (>7 days):"
        log_info "  find . -name 'deployment_*.log' -mtime +7 -delete"
    fi
    
    log ""
    log_info "Run these commands after verifying the deployment is successful."
}

# ====================
# Main Deployment Flow
# ====================

main() {
    # Start deployment
    log "═══════════════════════════════════════════════════════════════"
    log "🚀 LocumTrueRate One-Click Deployment"
    log "═══════════════════════════════════════════════════════════════"
    log "Environment: ${YELLOW}${DEPLOYMENT_ENV}${NC}"
    log "Timestamp: $(date)"
    log "Log file: $LOG_FILE"
    log "═══════════════════════════════════════════════════════════════"
    
    # Confirm deployment
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        log_warning "You are about to deploy to PRODUCTION!"
        read -p "Are you sure you want to continue? (yes/no) " -r
        echo
        if [[ ! $REPLY == "yes" ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Run deployment steps
    preflight_checks
    build_application
    security_validation
    deploy_to_cloudflare
    post_deployment_checks
    cleanup_unnecessary_files
    
    # Success summary
    log ""
    log_header "🎉 Deployment Successful!"
    
    local site_url
    if [[ "$DEPLOYMENT_ENV" == "production" ]]; then
        site_url="https://locumtruerate.com"
    else
        site_url="https://${DEPLOYMENT_ENV}.locumtruerate.com"
    fi
    
    log "${GREEN}Your site is live at: ${BLUE}${site_url}${NC}"
    log ""
    log "📊 ${CYAN}Next steps:${NC}"
    log "  1. Test all critical features"
    log "  2. Monitor deployment metrics"
    log "  3. Check error tracking (Sentry)"
    log "  4. Verify analytics are working"
    
    if [[ "$DEPLOYMENT_ENV" == "staging" ]]; then
        log ""
        log "  ${YELLOW}Ready to deploy to production?${NC}"
        log "  Run: ${CYAN}./scripts/one-click-deploy.sh production${NC}"
    fi
    
    log ""
    log "📝 Deployment log: ${LOG_FILE}"
    log "📋 Deployment report: deployment_report_${DEPLOYMENT_ENV}_${TIMESTAMP}.txt"
    log ""
    log "═══════════════════════════════════════════════════════════════"
}

# Run main function
main "$@"