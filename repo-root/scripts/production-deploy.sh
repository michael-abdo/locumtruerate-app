#!/bin/bash

# =============================================================================
# LocumTrueRate.com Production Deployment Script
# =============================================================================
# This script ensures proper production environment configuration
# and deploys the application with security best practices.

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're running in production
check_production_environment() {
    log_info "Checking production environment configuration..."
    
    if [[ "${NODE_ENV:-}" != "production" ]]; then
        log_error "NODE_ENV must be set to 'production' for deployment"
        log_info "Run: export NODE_ENV=production"
        exit 1
    fi
    
    if [[ "${NEXT_PUBLIC_APP_ENV:-}" != "production" ]]; then
        log_error "NEXT_PUBLIC_APP_ENV must be set to 'production'"
        exit 1
    fi
    
    log_success "Environment variables correctly set for production"
}

# Validate critical environment variables
validate_production_config() {
    log_info "Validating production configuration..."
    
    local required_vars=(
        "DATABASE_URL"
        "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
        "CLERK_SECRET_KEY"
        "JWT_SECRET"
        "NEXTAUTH_SECRET"
        "STRIPE_SECRET_KEY"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    )
    
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    log_success "All required environment variables are set"
}

# Check for placeholder values that shouldn't be in production
check_placeholder_values() {
    log_info "Checking for placeholder values in production..."
    
    local placeholder_patterns=(
        "placeholder"
        "CHANGE_ME"
        "YOUR_"
        "test_"
        "dev_"
        "sk_test_"
        "pk_test_"
    )
    
    local found_placeholders=false
    
    for pattern in "${placeholder_patterns[@]}"; do
        if env | grep -q "$pattern"; then
            if [[ "$found_placeholders" == false ]]; then
                log_error "Found placeholder values in environment:"
                found_placeholders=true
            fi
            env | grep "$pattern" | sed 's/=.*/=***REDACTED***/'
        fi
    done
    
    if [[ "$found_placeholders" == true ]]; then
        log_error "Placeholder values found. Replace with production values before deploying."
        exit 1
    fi
    
    log_success "No placeholder values found"
}

# Verify debug logging is disabled
check_debug_logging() {
    log_info "Verifying debug logging configuration..."
    
    if [[ "${ENABLE_DEBUG_LOGS:-false}" == "true" ]]; then
        log_error "ENABLE_DEBUG_LOGS is set to 'true' in production"
        log_error "This poses a security risk and should be disabled"
        exit 1
    fi
    
    if [[ "${ENABLE_PROFILING:-false}" == "true" ]]; then
        log_warning "ENABLE_PROFILING is enabled in production"
        log_warning "Consider disabling for optimal performance"
    fi
    
    local log_level="${LOG_LEVEL:-WARN}"
    if [[ "$log_level" == "DEBUG" || "$log_level" == "INFO" ]]; then
        log_warning "LOG_LEVEL is set to '$log_level' - consider using 'WARN' or 'ERROR' for production"
    fi
    
    log_success "Debug logging configuration verified"
}

# Security checks
run_security_checks() {
    log_info "Running security checks..."
    
    # Check for exposed secrets in code
    if command -v grep >/dev/null 2>&1; then
        log_info "Scanning for potential exposed secrets..."
        
        local secret_patterns=(
            "api[_-]?key"
            "secret[_-]?key"
            "password"
            "token"
            "credential"
        )
        
        local found_secrets=false
        for pattern in "${secret_patterns[@]}"; do
            if find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -il "$pattern" | grep -v node_modules | grep -v .git >/dev/null 2>&1; then
                if [[ "$found_secrets" == false ]]; then
                    log_warning "Found potential hardcoded secrets in code files:"
                    found_secrets=true
                fi
                find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "$pattern" | grep -v node_modules | grep -v .git || true
            fi
        done
        
        if [[ "$found_secrets" == false ]]; then
            log_success "No obvious hardcoded secrets found"
        fi
    fi
    
    # Check SSL/HTTPS configuration
    if [[ "${NEXTAUTH_URL:-}" != https://* ]]; then
        log_error "NEXTAUTH_URL must use HTTPS in production"
        exit 1
    fi
    
    if [[ "${NEXT_PUBLIC_API_URL:-}" != https://* ]]; then
        log_error "NEXT_PUBLIC_API_URL must use HTTPS in production"
        exit 1
    fi
    
    log_success "Security checks completed"
}

# Build the application
build_application() {
    log_info "Building application for production..."
    
    # Install dependencies
    log_info "Installing dependencies..."
    npm ci --production=false
    
    # Build the application
    log_info "Building Next.js application..."
    npm run build
    
    # Verify build output
    if [[ ! -d ".next" ]]; then
        log_error "Build failed - .next directory not found"
        exit 1
    fi
    
    log_success "Application built successfully"
}

# Run tests
run_tests() {
    log_info "Running production-ready tests..."
    
    # Type checking
    log_info "Running TypeScript type checking..."
    npm run type-check
    
    # Linting
    log_info "Running ESLint..."
    npm run lint
    
    # Unit tests
    log_info "Running unit tests..."
    npm run test
    
    log_success "All tests passed"
}

# Generate deployment metadata
generate_deployment_metadata() {
    log_info "Generating deployment metadata..."
    
    local deployment_id=$(date +%Y%m%d_%H%M%S)_$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local commit_sha=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Export for use by the application
    export DEPLOYMENT_ID="$deployment_id"
    export DEPLOYMENT_COMMIT_SHA="$commit_sha"
    export DEPLOYMENT_TIMESTAMP="$timestamp"
    export DEPLOYMENT_ENVIRONMENT="production"
    
    log_success "Deployment metadata generated:"
    log_info "  ID: $deployment_id"
    log_info "  Commit: $commit_sha"
    log_info "  Timestamp: $timestamp"
}

# Main deployment function
main() {
    log_info "Starting LocumTrueRate.com production deployment..."
    log_info "=========================================="
    
    # Pre-deployment checks
    check_production_environment
    validate_production_config
    check_placeholder_values
    check_debug_logging
    run_security_checks
    
    # Build and test
    build_application
    run_tests
    
    # Generate metadata
    generate_deployment_metadata
    
    log_success "=========================================="
    log_success "Production deployment preparation completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Deploy the .next build directory to your production environment"
    log_info "2. Ensure all environment variables are set in production"
    log_info "3. Run database migrations if needed"
    log_info "4. Verify production application startup"
    log_info "5. Run smoke tests against production endpoints"
    log_info ""
    log_warning "Remember to:"
    log_warning "- Monitor application logs after deployment"
    log_warning "- Check error tracking (Sentry) for issues"
    log_warning "- Verify all critical user flows work correctly"
    log_warning "- Monitor performance metrics"
}

# Run the deployment
main "$@"