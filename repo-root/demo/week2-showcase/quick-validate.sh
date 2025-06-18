#!/bin/bash

# Week 2 Demo Quick Validation Script
# This runs basic checks without requiring puppeteer

echo "🚀 Week 2 Demo Quick Validation"
echo "=============================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Function to test a URL
test_url() {
    local url=$1
    local name=$2
    local expected=$3
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "Testing $name... "
    
    # Use curl to fetch the page
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$url")
    
    if [ "$response" = "200" ]; then
        # Check if page contains expected content
        content=$(curl -s "http://localhost:3000$url")
        if [[ "$content" == *"$expected"* ]]; then
            echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}✗ FAIL${NC} (Missing: $expected)"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $response)"
        FAILED=$((FAILED + 1))
    fi
}

# Function to check file exists
check_file() {
    local file=$1
    local name=$2
    
    TOTAL=$((TOTAL + 1))
    
    echo -n "Checking $name... "
    
    if [ -f "$file" ]; then
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        echo -e "${GREEN}✓ EXISTS${NC} ($lines lines)"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ MISSING${NC}"
        FAILED=$((FAILED + 1))
    fi
}

# Check if server is running
echo "1️⃣  Checking server status..."
echo ""

if ! curl -s -o /dev/null "http://localhost:3000"; then
    echo -e "${RED}❌ Server not running on port 3000${NC}"
    echo ""
    echo "Please start the server first:"
    echo "  cd repo-root/demo/week2-showcase"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Test pages
echo "2️⃣  Testing page loads..."
echo ""

test_url "/" "Homepage" "Week 2"
test_url "/legal/privacy" "Privacy Policy" "Privacy Policy"
test_url "/legal/terms" "Terms of Service" "Terms of Service"
test_url "/legal/cookies" "Cookie Policy" "Cookie Policy"
test_url "/legal/gdpr" "GDPR Compliance" "GDPR"
test_url "/support" "Support Page" "Support"

echo ""

# Check files exist
echo "3️⃣  Checking component files..."
echo ""

check_file "src/components/support-dashboard.tsx" "Support Dashboard"
check_file "src/components/support-widget.tsx" "Support Widget"
check_file "src/components/floating-support-button.tsx" "Floating Button"
check_file "src/components/modal.tsx" "Modal Component"
check_file "src/components/button.tsx" "Button Component"
check_file "src/components/input.tsx" "Input Component"

echo ""

# Check documentation
echo "4️⃣  Checking documentation..."
echo ""

check_file "WEEK2_COMPLETION_SHOWCASE.md" "Completion Showcase"
check_file "COMPONENT_EXTRACTION_GUIDE.md" "Extraction Guide"
check_file "MOBILE_FIRST_VALIDATION.md" "Mobile Validation"
check_file "CROSS_PLATFORM_COMPATIBILITY.md" "Cross Platform"
check_file "PERFORMANCE_ACCESSIBILITY_AUDIT.md" "Performance Audit"
check_file "FOUNDATION_VALIDATION_REPORT.md" "Validation Report"

echo ""

# Test interactive elements with curl
echo "5️⃣  Testing page content..."
echo ""

# Check for interactive elements in cookie policy
TOTAL=$((TOTAL + 1))
echo -n "Cookie checkboxes... "
content=$(curl -s "http://localhost:3000/legal/cookies")
if [[ "$content" == *"checkbox"* ]]; then
    echo -e "${GREEN}✓ FOUND${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ NOT FOUND${NC} (May need JavaScript)"
    FAILED=$((FAILED + 1))
fi

# Check for support button
TOTAL=$((TOTAL + 1))
echo -n "Support button... "
content=$(curl -s "http://localhost:3000")
if [[ "$content" == *"Support"* ]] || [[ "$content" == *"support"* ]]; then
    echo -e "${GREEN}✓ FOUND${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠ NOT FOUND${NC} (May need JavaScript)"
    FAILED=$((FAILED + 1))
fi

echo ""

# Performance check
echo "6️⃣  Quick performance check..."
echo ""

# Measure homepage load time
start_time=$(date +%s%N)
curl -s "http://localhost:3000" > /dev/null
end_time=$(date +%s%N)
load_time=$(( ($end_time - $start_time) / 1000000 ))

echo "Homepage load time: ${load_time}ms"

if [ $load_time -lt 1000 ]; then
    echo -e "${GREEN}✓ Performance looks good${NC}"
else
    echo -e "${YELLOW}⚠ Slower than expected${NC}"
fi

echo ""

# Summary
echo "=============================="
echo "📊 VALIDATION SUMMARY"
echo "=============================="
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}$PASSED${NC} ✓"
echo -e "Failed: ${RED}$FAILED${NC} ✗"

SCORE=$(( ($PASSED * 100) / $TOTAL ))
echo "Score: $SCORE%"

echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All basic tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Install puppeteer: npm install puppeteer"
    echo "2. Run full validation: node validate-demo.js"
else
    echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    echo ""
    echo "Please check the failures above."
    echo "For full validation, run: node validate-demo.js"
fi

echo ""

# Create basic results file
cat > QUICK_VALIDATION_RESULTS.txt << EOF
Week 2 Demo Quick Validation Results
Generated: $(date)

Summary:
- Total Tests: $TOTAL
- Passed: $PASSED
- Failed: $FAILED
- Score: $SCORE%

Server Status: Running on port 3000
Homepage Load Time: ${load_time}ms

Note: This is a basic validation without JavaScript execution.
For complete validation including interactive elements, run:
  npm install puppeteer
  node validate-demo.js
EOF

echo "Results saved to QUICK_VALIDATION_RESULTS.txt"