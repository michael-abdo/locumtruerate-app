#!/bin/bash

# LocumTrueRate Security Scanning Script
set -e

echo "🛡️ Starting LocumTrueRate Security Assessment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORT_DIR="${PWD}/security-reports"
ZAP_PORT=${ZAP_PORT:-8080}
TARGET_URL=${TARGET_URL:-"http://localhost:3000"}
ENABLE_ZAP=${ENABLE_ZAP:-false}
ENABLE_SNYK=${ENABLE_SNYK:-true}

# Create reports directory
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}📋 Security Scan Configuration:${NC}"
echo "  Target URL: $TARGET_URL"
echo "  Reports Directory: $REPORT_DIR"
echo "  ZAP Enabled: $ENABLE_ZAP"
echo "  Snyk Enabled: $ENABLE_SNYK"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is available
    fi
}

# 1. Dependency Vulnerability Scan (Snyk)
if [ "$ENABLE_SNYK" = true ]; then
    echo -e "${YELLOW}📦 Running dependency vulnerability scan...${NC}"
    
    if command_exists snyk; then
        # Test for vulnerabilities
        if snyk test --json > "$REPORT_DIR/snyk-report.json" 2>/dev/null; then
            echo -e "${GREEN}✅ No critical vulnerabilities found in dependencies${NC}"
        else
            echo -e "${RED}⚠️ Vulnerabilities found in dependencies - check $REPORT_DIR/snyk-report.json${NC}"
        fi
        
        # Monitor for new vulnerabilities
        snyk monitor --project-name="LocumTrueRate" >/dev/null 2>&1 || true
    else
        echo -e "${YELLOW}⚠️ Snyk not installed. Installing...${NC}"
        npm install -g snyk
        echo "Please run 'snyk auth' to authenticate before running this script again."
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️ Skipping Snyk scan (disabled)${NC}"
fi

# 2. OWASP ZAP Security Scan
if [ "$ENABLE_ZAP" = true ]; then
    echo -e "${YELLOW}🕷️ Running OWASP ZAP security scan...${NC}"
    
    # Check if ZAP is running
    if check_port $ZAP_PORT; then
        echo -e "${GREEN}✅ ZAP proxy detected on port $ZAP_PORT${NC}"
        
        # Run ZAP baseline scan
        if command_exists docker; then
            echo "Starting ZAP baseline scan..."
            docker run -t owasp/zap2docker-stable zap-baseline.py \
                -t "$TARGET_URL" \
                -J "$REPORT_DIR/zap-report.json" \
                -r "$REPORT_DIR/zap-report.html" \
                || echo -e "${YELLOW}⚠️ ZAP scan completed with warnings${NC}"
        else
            echo -e "${YELLOW}⚠️ Docker not available for ZAP scan${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ ZAP proxy not running on port $ZAP_PORT${NC}"
        echo "To enable ZAP scanning:"
        echo "1. Install OWASP ZAP"
        echo "2. Start ZAP in daemon mode: zap.sh -daemon -port $ZAP_PORT"
        echo "3. Set ENABLE_ZAP=true"
    fi
else
    echo -e "${YELLOW}⏭️ Skipping ZAP scan (disabled)${NC}"
fi

# 3. NPM Audit
echo -e "${YELLOW}🔍 Running npm security audit...${NC}"
if npm audit --audit-level moderate --json > "$REPORT_DIR/npm-audit.json" 2>/dev/null; then
    echo -e "${GREEN}✅ No security issues found in npm dependencies${NC}"
else
    echo -e "${RED}⚠️ Security issues found in npm dependencies - check $REPORT_DIR/npm-audit.json${NC}"
    echo "Run 'npm audit fix' to fix automatically fixable issues"
fi

# 4. Git Security Scan (check for secrets)
echo -e "${YELLOW}🔑 Scanning for secrets in git history...${NC}"
if command_exists git; then
    # Look for potential secrets in git history
    git log --all --full-history --pretty=format:"%h %s" -- '*.env*' '*.key*' '*.pem*' '*.p12*' > "$REPORT_DIR/git-secrets-scan.txt" 2>/dev/null || true
    
    # Check for common secret patterns
    git grep -n -E "(password|secret|key|token).*=" -- '*.js' '*.ts' '*.json' '*.env*' > "$REPORT_DIR/secret-patterns.txt" 2>/dev/null || true
    
    if [ -s "$REPORT_DIR/secret-patterns.txt" ]; then
        echo -e "${RED}⚠️ Potential secrets found in code - check $REPORT_DIR/secret-patterns.txt${NC}"
    else
        echo -e "${GREEN}✅ No obvious secrets found in codebase${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Git not available for secret scanning${NC}"
fi

# 5. Custom Security Checks
echo -e "${YELLOW}🔧 Running custom security checks...${NC}"

# Check for common security misconfigurations
cat > "$REPORT_DIR/security-checklist.md" << EOF
# LocumTrueRate Security Checklist

## Environment Security
- [ ] Production environment variables are set
- [ ] No test/development credentials in production
- [ ] Secrets are properly managed (not in code)
- [ ] HTTPS is enforced
- [ ] Security headers are configured

## Database Security
- [ ] Database connections use SSL/TLS
- [ ] Database credentials are secured
- [ ] SQL injection protection is implemented
- [ ] Database backups are encrypted

## API Security
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] Authentication is required for protected endpoints
- [ ] CORS is properly configured
- [ ] API versioning is implemented

## HIPAA Compliance (Healthcare)
- [ ] PHI data is encrypted at rest
- [ ] PHI data is encrypted in transit
- [ ] Access logging is implemented
- [ ] User access controls are in place
- [ ] Data retention policies are defined
- [ ] Incident response plan is documented

## Application Security
- [ ] XSS protection is enabled
- [ ] CSRF protection is implemented
- [ ] File upload security is configured
- [ ] Session management is secure
- [ ] Error handling doesn't leak sensitive information

## Infrastructure Security
- [ ] Firewall rules are configured
- [ ] Monitoring and alerting is set up
- [ ] Regular security updates are applied
- [ ] Backup and recovery procedures are tested
- [ ] Access logs are monitored
EOF

# 6. TypeScript/JavaScript Security Linting
echo -e "${YELLOW}🔍 Running security linting...${NC}"
if command_exists eslint; then
    # Run ESLint with security rules
    npx eslint . --ext .ts,.js --format json > "$REPORT_DIR/eslint-security.json" 2>/dev/null || true
    echo -e "${GREEN}✅ Security linting completed${NC}"
else
    echo -e "${YELLOW}⚠️ ESLint not available for security linting${NC}"
fi

# 7. Generate Summary Report
echo -e "${YELLOW}📊 Generating security summary...${NC}"

TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SCAN_ID=$(date +%s)

cat > "$REPORT_DIR/security-summary.md" << EOF
# Security Scan Summary

**Scan ID:** $SCAN_ID  
**Timestamp:** $TIMESTAMP  
**Target:** $TARGET_URL  

## Scan Results

### Dependency Vulnerabilities (Snyk)
$([ "$ENABLE_SNYK" = true ] && [ -f "$REPORT_DIR/snyk-report.json" ] && echo "✅ Completed - Check snyk-report.json" || echo "⏭️ Skipped or failed")

### Web Application Security (OWASP ZAP)
$([ "$ENABLE_ZAP" = true ] && [ -f "$REPORT_DIR/zap-report.json" ] && echo "✅ Completed - Check zap-report.json" || echo "⏭️ Skipped or failed")

### NPM Security Audit
$([ -f "$REPORT_DIR/npm-audit.json" ] && echo "✅ Completed - Check npm-audit.json" || echo "❌ Failed")

### Secret Scanning
$([ -f "$REPORT_DIR/secret-patterns.txt" ] && echo "✅ Completed - Check secret-patterns.txt" || echo "❌ Failed")

### Security Linting
$([ -f "$REPORT_DIR/eslint-security.json" ] && echo "✅ Completed - Check eslint-security.json" || echo "⏭️ Skipped")

## Next Steps

1. Review all generated reports in \`$REPORT_DIR\`
2. Address any critical or high-severity vulnerabilities immediately
3. Implement missing security controls from the checklist
4. Schedule regular security scans (weekly recommended)
5. Monitor for new vulnerabilities with Snyk monitoring

## Report Files

- \`security-summary.md\` - This summary report
- \`security-checklist.md\` - Security implementation checklist
- \`snyk-report.json\` - Dependency vulnerability scan
- \`npm-audit.json\` - NPM security audit
- \`zap-report.json\` - Web application security scan
- \`secret-patterns.txt\` - Potential secrets in code
- \`eslint-security.json\` - Security linting results

## Contact

For security questions or to report vulnerabilities, contact the security team.
EOF

# 8. Display Results
echo ""
echo -e "${GREEN}✨ Security assessment completed!${NC}"
echo ""
echo -e "${BLUE}📄 Reports generated in: $REPORT_DIR${NC}"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  ✅ Dependency scan: $([ "$ENABLE_SNYK" = true ] && echo "Enabled" || echo "Disabled")"
echo "  ✅ Web app scan: $([ "$ENABLE_ZAP" = true ] && echo "Enabled" || echo "Disabled")"
echo "  ✅ NPM audit: Completed"
echo "  ✅ Secret scan: Completed"
echo "  ✅ Security checklist: Generated"
echo ""
echo -e "${YELLOW}📖 Next steps:${NC}"
echo "  1. Review the security summary: $REPORT_DIR/security-summary.md"
echo "  2. Check the security checklist: $REPORT_DIR/security-checklist.md"
echo "  3. Address any critical vulnerabilities found"
echo "  4. Implement missing security controls"
echo ""
echo -e "${BLUE}🔗 Useful commands:${NC}"
echo "  View summary: cat $REPORT_DIR/security-summary.md"
echo "  Fix npm issues: npm audit fix"
echo "  Update dependencies: npm update"
echo ""
echo -e "${GREEN}🎉 Stay secure!${NC}"