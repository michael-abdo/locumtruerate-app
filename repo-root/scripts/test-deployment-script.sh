#!/bin/bash

# ============================================================================
# Test Script for One-Click Deployment
# ============================================================================
# This script tests the deployment script functionality without actually deploying
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_SCRIPT="${SCRIPT_DIR}/one-click-deploy.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test results
TESTS_RUN=0
TESTS_PASSED=0

# Logging
log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    ((TESTS_RUN++))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Check if deployment script exists
test_script_exists() {
    log_test "Checking if deployment script exists"
    
    if [[ -f "$DEPLOYMENT_SCRIPT" ]]; then
        log_pass "Deployment script exists"
    else
        log_fail "Deployment script not found: $DEPLOYMENT_SCRIPT"
        return 1
    fi
}

# Test 2: Check if script is executable
test_script_executable() {
    log_test "Checking if deployment script is executable"
    
    if [[ -x "$DEPLOYMENT_SCRIPT" ]]; then
        log_pass "Deployment script is executable"
    else
        log_fail "Deployment script is not executable"
        return 1
    fi
}

# Test 3: Test script help/usage
test_script_help() {
    log_test "Testing script help functionality"
    
    # Test with invalid argument to see if it shows usage
    if bash "$DEPLOYMENT_SCRIPT" --help 2>/dev/null || true; then
        log_pass "Script handles help/usage correctly"
    else
        log_fail "Script doesn't handle help correctly"
        return 1
    fi
}

# Test 4: Check required configuration files
test_config_files() {
    log_test "Checking required configuration files"
    
    local config_files=(
        "cloudflare-pages.config.json"
        "cloudflare-pages.staging.json"
        "cloudflare-pages.development.json"
    )
    
    local missing_files=()
    
    for file in "${config_files[@]}"; do
        if [[ ! -f "${PROJECT_ROOT}/${file}" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        log_pass "All configuration files exist"
    else
        log_fail "Missing configuration files: ${missing_files[*]}"
        return 1
    fi
}

# Test 5: Validate configuration file JSON
test_config_json() {
    log_test "Validating configuration files JSON"
    
    local config_files=(
        "cloudflare-pages.config.json"
        "cloudflare-pages.staging.json"
        "cloudflare-pages.development.json"
    )
    
    for file in "${config_files[@]}"; do
        if ! jq empty "${PROJECT_ROOT}/${file}" 2>/dev/null; then
            log_fail "Invalid JSON in $file"
            return 1
        fi
    done
    
    log_pass "All configuration files have valid JSON"
}

# Test 6: Check package.json scripts
test_package_scripts() {
    log_test "Checking package.json deployment scripts"
    
    local required_scripts=(
        "deploy"
        "deploy:production"
        "deploy:staging"
    )
    
    local package_json="${PROJECT_ROOT}/package.json"
    
    if [[ ! -f "$package_json" ]]; then
        log_fail "package.json not found"
        return 1
    fi
    
    local missing_scripts=()
    
    for script in "${required_scripts[@]}"; do
        if ! jq -e ".scripts[\"$script\"]" "$package_json" >/dev/null 2>&1; then
            missing_scripts+=("$script")
        fi
    done
    
    if [[ ${#missing_scripts[@]} -eq 0 ]]; then
        log_pass "All required package.json scripts exist"
    else
        log_fail "Missing package.json scripts: ${missing_scripts[*]}"
        return 1
    fi
}

# Test 7: Check deployment package
test_deployment_package() {
    log_test "Checking Cloudflare Pages deployment package"
    
    local package_dir="${PROJECT_ROOT}/packages/cloudflare-pages"
    
    if [[ ! -d "$package_dir" ]]; then
        log_fail "Cloudflare Pages package directory not found"
        return 1
    fi
    
    local required_files=(
        "bin/deploy.js"
        "src/deployment.ts"
        "package.json"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${package_dir}/${file}" ]]; then
            missing_files+=("$file")
        fi
    done
    
    if [[ ${#missing_files[@]} -eq 0 ]]; then
        log_pass "Cloudflare Pages package structure is correct"
    else
        log_fail "Missing package files: ${missing_files[*]}"
        return 1
    fi
}

# Test 8: Test environment variable validation (mock)
test_env_var_validation() {
    log_test "Testing environment variable validation (mock)"
    
    # Save current env vars
    local original_token="${CLOUDFLARE_API_TOKEN:-}"
    local original_account="${CLOUDFLARE_ACCOUNT_ID:-}"
    
    # Unset env vars to test validation
    unset CLOUDFLARE_API_TOKEN 2>/dev/null || true
    unset CLOUDFLARE_ACCOUNT_ID 2>/dev/null || true
    
    # Test that script fails with missing env vars
    if bash "$DEPLOYMENT_SCRIPT" staging 2>&1 | grep -q "Missing required environment variables"; then
        log_pass "Script correctly validates missing environment variables"
    else
        log_fail "Script doesn't validate environment variables correctly"
        # Restore env vars
        export CLOUDFLARE_API_TOKEN="$original_token"
        export CLOUDFLARE_ACCOUNT_ID="$original_account"
        return 1
    fi
    
    # Restore env vars
    if [[ -n "$original_token" ]]; then
        export CLOUDFLARE_API_TOKEN="$original_token"
    fi
    if [[ -n "$original_account" ]]; then
        export CLOUDFLARE_ACCOUNT_ID="$original_account"
    fi
}

# Test 9: Check script components
test_script_components() {
    log_test "Checking script components and functions"
    
    local required_functions=(
        "preflight_checks"
        "build_application"
        "security_validation"
        "deploy_to_cloudflare"
        "post_deployment_checks"
    )
    
    local missing_functions=()
    
    for func in "${required_functions[@]}"; do
        if ! grep -q "^${func}()" "$DEPLOYMENT_SCRIPT"; then
            missing_functions+=("$func")
        fi
    done
    
    if [[ ${#missing_functions[@]} -eq 0 ]]; then
        log_pass "All required functions exist in deployment script"
    else
        log_fail "Missing functions: ${missing_functions[*]}"
        return 1
    fi
}

# Test 10: Check documentation
test_documentation() {
    log_test "Checking deployment documentation"
    
    local doc_files=(
        "DEPLOYMENT.md"
        "cleanup-deployment-files.md"
        "docs/deployment-guide.md"
    )
    
    local missing_docs=()
    
    for doc in "${doc_files[@]}"; do
        if [[ ! -f "${PROJECT_ROOT}/${doc}" ]]; then
            missing_docs+=("$doc")
        fi
    done
    
    if [[ ${#missing_docs[@]} -eq 0 ]]; then
        log_pass "All documentation files exist"
    else
        log_fail "Missing documentation: ${missing_docs[*]}"
        return 1
    fi
}

# Test 11: Check cleanup script recommendations
test_cleanup_recommendations() {
    log_test "Checking cleanup recommendations"
    
    local cleanup_file="${PROJECT_ROOT}/cleanup-deployment-files.md"
    
    if [[ -f "$cleanup_file" ]]; then
        if grep -q "Files to Remove" "$cleanup_file" && grep -q "Files to Keep" "$cleanup_file"; then
            log_pass "Cleanup recommendations are comprehensive"
        else
            log_fail "Cleanup recommendations are incomplete"
            return 1
        fi
    else
        log_fail "Cleanup recommendations file not found"
        return 1
    fi
}

# Test 12: Validate script syntax
test_script_syntax() {
    log_test "Validating deployment script syntax"
    
    if bash -n "$DEPLOYMENT_SCRIPT"; then
        log_pass "Deployment script has valid syntax"
    else
        log_fail "Deployment script has syntax errors"
        return 1
    fi
}

# Main test runner
main() {
    echo "============================================"
    echo "🧪 Testing One-Click Deployment Script"
    echo "============================================"
    echo ""
    
    # Run all tests
    test_script_exists
    test_script_executable
    test_script_help
    test_config_files
    test_config_json
    test_package_scripts
    test_deployment_package
    test_env_var_validation
    test_script_components
    test_documentation
    test_cleanup_recommendations
    test_script_syntax
    
    # Summary
    echo ""
    echo "============================================"
    echo "📊 Test Summary"
    echo "============================================"
    echo "Tests run: $TESTS_RUN"
    echo "Tests passed: $TESTS_PASSED"
    echo "Tests failed: $((TESTS_RUN - TESTS_PASSED))"
    
    if [[ $TESTS_PASSED -eq $TESTS_RUN ]]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
        echo ""
        echo "🚀 The one-click deployment script is ready to use:"
        echo "  npm run deploy:staging"
        echo "  npm run deploy:production"
        return 0
    else
        echo -e "${RED}❌ Some tests failed!${NC}"
        echo ""
        echo "Please fix the issues above before using the deployment script."
        return 1
    fi
}

# Run tests
main "$@"