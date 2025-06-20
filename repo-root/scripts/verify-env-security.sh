#!/bin/bash

# Environment Security Verification Script for LocumTrueRate Healthcare Application
# This script verifies that sensitive environment files are properly handled

echo "🔒 LocumTrueRate Environment Security Verification"
echo "================================================="

# Check if .env files are properly ignored
echo ""
echo "1. Checking .env file ignore status..."

# Find all .env files
env_files=$(find . -name ".env*" -not -name ".env.example" -not -path "./node_modules/*")

if [ -z "$env_files" ]; then
    echo "✅ No .env files found (good - they should be in .gitignore)"
else
    echo "📁 Found .env files:"
    echo "$env_files"
    echo ""
    
    # Check if any are tracked by git
    tracked_env_files=""
    for file in $env_files; do
        if git ls-files --error-unmatch "$file" >/dev/null 2>&1; then
            tracked_env_files="$tracked_env_files $file"
        fi
    done
    
    if [ -z "$tracked_env_files" ]; then
        echo "✅ All .env files are properly ignored by git"
    else
        echo "❌ WARNING: These .env files are tracked by git:"
        echo "$tracked_env_files"
        echo "   Run: git rm --cached <file> to untrack them"
    fi
fi

# Verify .gitignore contains proper patterns
echo ""
echo "2. Checking .gitignore for environment patterns..."

required_patterns=(".env" ".env.*" "*.key" "*.pem" ".secrets")
missing_patterns=""

for pattern in "${required_patterns[@]}"; do
    if ! grep -q "$pattern" .gitignore; then
        missing_patterns="$missing_patterns $pattern"
    fi
done

if [ -z "$missing_patterns" ]; then
    echo "✅ All required security patterns found in .gitignore"
else
    echo "❌ Missing patterns in .gitignore:"
    echo "$missing_patterns"
fi

# Check for hardcoded secrets in tracked files
echo ""
echo "3. Scanning for potential hardcoded secrets..."

# Common secret patterns
secret_patterns=(
    "password.*=.*['\"][^'\"]{6,}['\"]"
    "secret.*=.*['\"][^'\"]{10,}['\"]"
    "key.*=.*['\"][^'\"]{10,}['\"]"
    "token.*=.*['\"][^'\"]{10,}['\"]"
    "api[_-]key.*=.*['\"][^'\"]{10,}['\"]"
)

found_secrets=false
for pattern in "${secret_patterns[@]}"; do
    results=$(git grep -i -E "$pattern" -- '*.ts' '*.tsx' '*.js' '*.jsx' '*.json' '*.yml' '*.yaml' 2>/dev/null || true)
    if [ ! -z "$results" ]; then
        if [ "$found_secrets" = false ]; then
            echo "⚠️  Potential hardcoded secrets found:"
            found_secrets=true
        fi
        echo "$results"
    fi
done

if [ "$found_secrets" = false ]; then
    echo "✅ No obvious hardcoded secrets found in tracked files"
fi

# Check environment variable usage
echo ""
echo "4. Checking environment variable security..."

# Look for proper environment variable usage
env_usage=$(git grep -E "process\.env\.[A-Z_]+" -- '*.ts' '*.tsx' '*.js' '*.jsx' | head -10)
if [ ! -z "$env_usage" ]; then
    echo "✅ Environment variables are being used properly"
    echo "   Sample usage (first 10 lines):"
    echo "$env_usage" | sed 's/^/   /'
else
    echo "⚠️  No environment variable usage found - this may indicate hardcoded values"
fi

# Check for placeholder values in .env files
echo ""
echo "5. Checking for placeholder values..."

if [ -f "apps/web/.env" ]; then
    placeholder_count=$(grep -c "placeholder\|CHANGE_ME\|YOUR_" apps/web/.env 2>/dev/null || echo "0")
    if [ "$placeholder_count" -gt 0 ]; then
        echo "⚠️  Found $placeholder_count placeholder values in apps/web/.env"
        echo "   Make sure to replace with real values in production"
    else
        echo "✅ No obvious placeholder values found"
    fi
else
    echo "✅ No .env file found in apps/web/ (will use environment variables)"
fi

# HIPAA compliance check
echo ""
echo "6. HIPAA compliance environment check..."

hipaa_vars=(
    "DATABASE_URL"
    "ENCRYPTION_KEY"
    "JWT_SECRET"
    "SENTRY_DSN"
    "CLERK_SECRET_KEY"
)

echo "   Required HIPAA-compliant environment variables:"
for var in "${hipaa_vars[@]}"; do
    if git grep -q "$var" -- '*.ts' '*.tsx' '*.js' '*.jsx' 2>/dev/null; then
        echo "   ✅ $var - referenced in code"
    else
        echo "   ❓ $var - not found in code"
    fi
done

# Final recommendations
echo ""
echo "🏥 HIPAA Compliance Recommendations:"
echo "=====================================."
echo "1. Use strong, unique secrets for all environment variables"
echo "2. Implement secret rotation policies"
echo "3. Use encrypted secret management (AWS Secrets Manager, etc.)"
echo "4. Regular audit of environment variable usage"
echo "5. Implement monitoring for secret exposure"
echo "6. Document all environment variables for compliance"

echo ""
echo "✅ Environment security verification complete!"
echo ""

# Exit with error code if any issues found
if [ ! -z "$tracked_env_files" ] || [ ! -z "$missing_patterns" ] || [ "$found_secrets" = true ]; then
    echo "❌ Issues found - please review the warnings above"
    exit 1
else
    echo "🎉 All environment security checks passed!"
    exit 0
fi