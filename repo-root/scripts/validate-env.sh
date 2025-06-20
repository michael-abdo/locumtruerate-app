#!/bin/bash

# Environment Variable Validation Script for LocumTrueRate.com
# This script validates that all required environment variables are properly set for production

set -e

echo "🔍 LocumTrueRate.com Environment Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
CHECKS=0

# Function to check if a variable is set and not empty
check_required() {
    local var_name="$1"
    local description="$2"
    local is_secret="${3:-false}"
    
    CHECKS=$((CHECKS + 1))
    
    if [ -z "${!var_name}" ]; then
        echo -e "${RED}❌ MISSING: ${var_name}${NC} - ${description}"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    # Check for placeholder values
    if [[ "${!var_name}" == *"placeholder"* ]] || [[ "${!var_name}" == *"CHANGE_ME"* ]] || [[ "${!var_name}" == *"YOUR_"* ]]; then
        echo -e "${YELLOW}⚠️  PLACEHOLDER: ${var_name}${NC} - Still contains placeholder value"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
    
    if [ "$is_secret" = "true" ]; then
        echo -e "${GREEN}✅ ${var_name}${NC} - Set (***hidden***)"
    else
        # Truncate long values for display
        local display_value="${!var_name}"
        if [ ${#display_value} -gt 50 ]; then
            display_value="${display_value:0:47}..."
        fi
        echo -e "${GREEN}✅ ${var_name}${NC} - ${display_value}"
    fi
    return 0
}

# Function to check optional variables
check_optional() {
    local var_name="$1"
    local description="$2"
    
    CHECKS=$((CHECKS + 1))
    
    if [ -z "${!var_name}" ]; then
        echo -e "${BLUE}ℹ️  OPTIONAL: ${var_name}${NC} - ${description} (not set)"
    else
        echo -e "${GREEN}✅ ${var_name}${NC} - Set"
    fi
}

# Function to validate URL format
validate_url() {
    local var_name="$1"
    local url="${!var_name}"
    
    if [[ ! "$url" =~ ^https?:// ]]; then
        echo -e "${RED}❌ INVALID URL: ${var_name}${NC} - Must start with http:// or https://"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    return 0
}

# Function to validate database URL
validate_database_url() {
    local url="$DATABASE_URL"
    
    if [[ ! "$url" =~ ^postgresql:// ]] && [[ ! "$url" =~ ^postgres:// ]]; then
        echo -e "${RED}❌ INVALID DATABASE_URL${NC} - Must be a PostgreSQL connection string"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    
    if [[ ! "$url" =~ sslmode=require ]]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL${NC} - Missing sslmode=require (recommended for production)"
        WARNINGS=$((WARNINGS + 1))
    fi
    
    return 0
}

# Function to validate encryption key length
validate_encryption_key() {
    local var_name="$1"
    local key="${!var_name}"
    local min_length="${2:-32}"
    
    if [ ${#key} -lt $min_length ]; then
        echo -e "${RED}❌ WEAK KEY: ${var_name}${NC} - Must be at least ${min_length} characters"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
    return 0
}

echo -e "${BLUE}🏥 CORE APPLICATION VARIABLES${NC}"
echo "================================="

# Core Application
check_required "DATABASE_URL" "Primary database connection" "true"
validate_database_url

check_required "DATABASE_ENCRYPTION_KEY" "Database field-level encryption key" "true"
validate_encryption_key "DATABASE_ENCRYPTION_KEY" 32

check_required "NEXTAUTH_URL" "Application base URL"
validate_url "NEXTAUTH_URL"

check_required "NEXT_PUBLIC_API_URL" "Public API URL"
validate_url "NEXT_PUBLIC_API_URL"

echo ""
echo -e "${BLUE}🔐 AUTHENTICATION & SECURITY${NC}"
echo "=============================="

# Clerk Authentication
check_required "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "Clerk publishable key"
check_required "CLERK_SECRET_KEY" "Clerk secret key" "true"
check_required "CLERK_WEBHOOK_SECRET" "Clerk webhook secret" "true"

# Security Keys
check_required "JWT_SECRET" "JWT signing secret" "true"
validate_encryption_key "JWT_SECRET" 32

check_required "NEXTAUTH_SECRET" "NextAuth encryption secret" "true"
validate_encryption_key "NEXTAUTH_SECRET" 32

check_required "RATE_LIMIT_SECRET" "Rate limiting secret" "true"

echo ""
echo -e "${BLUE}📊 MONITORING & ERROR TRACKING${NC}"
echo "==============================="

# Sentry
check_required "SENTRY_DSN" "Sentry error tracking DSN" "true"
check_optional "SENTRY_AUTH_TOKEN" "Sentry authentication token for releases"
check_optional "SENTRY_ORG" "Sentry organization"
check_optional "SENTRY_PROJECT" "Sentry project name"

echo ""
echo -e "${BLUE}💳 PAYMENT PROCESSING${NC}"
echo "====================="

# Stripe (optional but recommended for job board)
check_optional "STRIPE_SECRET_KEY" "Stripe secret key"
check_optional "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" "Stripe publishable key"
check_optional "STRIPE_WEBHOOK_SECRET" "Stripe webhook secret"

echo ""
echo -e "${BLUE}📧 EMAIL SERVICE${NC}"
echo "================"

# Email Service (at least one required)
has_sendgrid=false
has_aws_ses=false

if [ ! -z "$SENDGRID_API_KEY" ]; then
    check_required "SENDGRID_API_KEY" "SendGrid API key" "true"
    has_sendgrid=true
fi

if [ ! -z "$AWS_SES_ACCESS_KEY_ID" ]; then
    check_required "AWS_SES_ACCESS_KEY_ID" "AWS SES access key" "true"
    check_required "AWS_SES_SECRET_ACCESS_KEY" "AWS SES secret key" "true"
    check_required "AWS_SES_REGION" "AWS SES region"
    has_aws_ses=true
fi

if [ "$has_sendgrid" = false ] && [ "$has_aws_ses" = false ]; then
    echo -e "${YELLOW}⚠️  NO EMAIL SERVICE${NC} - Either SendGrid or AWS SES should be configured"
    WARNINGS=$((WARNINGS + 1))
fi

check_required "EMAIL_FROM" "From email address"
check_required "EMAIL_SUPPORT" "Support email address"

echo ""
echo -e "${BLUE}📁 FILE STORAGE${NC}"
echo "==============="

# AWS S3 (optional but recommended)
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    check_required "AWS_ACCESS_KEY_ID" "AWS access key" "true"
    check_required "AWS_SECRET_ACCESS_KEY" "AWS secret key" "true"
    check_required "AWS_REGION" "AWS region"
    check_required "AWS_S3_BUCKET_RESUMES" "S3 bucket for resumes"
    check_required "AWS_S3_BUCKET_DOCUMENTS" "S3 bucket for documents"
    check_required "AWS_S3_BUCKET_IMAGES" "S3 bucket for images"
fi

echo ""
echo -e "${BLUE}🏥 HIPAA COMPLIANCE${NC}"
echo "==================="

# HIPAA Compliance (required for healthcare)
check_required "AUDIT_LOG_RETENTION_DAYS" "Audit log retention period"
check_required "AUDIT_LOG_ENCRYPTION_KEY" "Audit log encryption key" "true"
validate_encryption_key "AUDIT_LOG_ENCRYPTION_KEY" 32

check_required "PHI_RETENTION_DAYS" "PHI data retention period"
check_required "COMPLIANCE_REPORT_EMAIL" "Compliance reporting email"
check_required "HIPAA_OFFICER_EMAIL" "HIPAA officer email"

echo ""
echo -e "${BLUE}🚩 ENVIRONMENT CONFIGURATION${NC}"
echo "============================="

# Environment Settings
check_required "NODE_ENV" "Node.js environment"
check_required "NEXT_PUBLIC_APP_ENV" "Application environment"

# Validate NODE_ENV
if [ "$NODE_ENV" != "production" ] && [ "$NODE_ENV" != "development" ] && [ "$NODE_ENV" != "test" ]; then
    echo -e "${RED}❌ INVALID NODE_ENV${NC} - Must be 'production', 'development', or 'test'"
    ERRORS=$((ERRORS + 1))
fi

# Production-specific checks
if [ "$NODE_ENV" = "production" ]; then
    echo ""
    echo -e "${BLUE}🚀 PRODUCTION-SPECIFIC CHECKS${NC}"
    echo "============================="
    
    # Check for development/test values in production
    if [[ "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" == *"test"* ]]; then
        echo -e "${RED}❌ PRODUCTION ERROR${NC} - Using test Clerk key in production"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [[ "$STRIPE_SECRET_KEY" == *"test"* ]]; then
        echo -e "${RED}❌ PRODUCTION ERROR${NC} - Using test Stripe key in production"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [[ "$NEXTAUTH_URL" == *"localhost"* ]]; then
        echo -e "${RED}❌ PRODUCTION ERROR${NC} - NEXTAUTH_URL points to localhost"
        ERRORS=$((ERRORS + 1))
    fi
    
    if [ "$ENABLE_DEBUG_LOGS" = "true" ]; then
        echo -e "${YELLOW}⚠️  PRODUCTION WARNING${NC} - Debug logs are enabled (may impact performance)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

echo ""
echo "=================================="
echo -e "${BLUE}📋 VALIDATION SUMMARY${NC}"
echo "=================================="

echo -e "Total Checks: ${CHECKS}"
echo -e "Errors: ${ERRORS}"
echo -e "Warnings: ${WARNINGS}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo -e "${GREEN}✅ Environment is ready for production deployment${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  WARNINGS FOUND${NC}"
    echo -e "${YELLOW}📝 Please review warnings above${NC}"
    echo -e "${GREEN}✅ Environment can be deployed but should address warnings${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ VALIDATION FAILED${NC}"
    echo -e "${RED}🚨 Cannot deploy with ${ERRORS} error(s)${NC}"
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. Fix all errors marked with ❌"
    echo "2. Review and address warnings marked with ⚠️"
    echo "3. Run this script again to validate"
    echo "4. Consult docs/environment-variables.md for details"
    exit 1
fi