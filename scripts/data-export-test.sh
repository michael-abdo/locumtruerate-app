#!/bin/bash

# Data Export Endpoints Test Script
# Tests GDPR-compliant data export functionality

set -e

BASE_URL="https://locumcalc-production-17560d4c3d1a.herokuapp.com"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Data Export Endpoints Test${NC}"
echo "Testing against: $API_BASE"
echo "========================================"

# Test tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

log_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ $1${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Step 1: Create a test user and get token
echo -e "\n${YELLOW}📋 Step 1: Creating test user for data export${NC}"
TEST_EMAIL="data-export-test-$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"password123\",
        \"role\": \"locum\",
        \"firstName\": \"Data\",
        \"lastName\": \"Tester\"
    }")

if echo "$REGISTER_RESPONSE" | grep -q "User registered successfully"; then
    echo -e "${GREEN}✅ Test user registered successfully${NC}"
    
    # Login to get token
    LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$TEST_EMAIL\",
            \"password\": \"password123\"
        }")
    
    if echo "$LOGIN_RESPONSE" | grep -q "token"; then
        USER_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Test user logged in successfully${NC}"
        echo "User Token: ${USER_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Failed to login test user${NC}"
        echo "Response: $LOGIN_RESPONSE"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to register test user${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# Step 2: Test privacy summary endpoint
echo -e "\n${YELLOW}📋 Step 2: Testing privacy summary endpoint${NC}"
PRIVACY_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/privacy-summary" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$PRIVACY_RESPONSE" | grep -q "dataProcessingSummary"; then
    echo -e "${GREEN}✅ Privacy summary endpoint working${NC}"
    log_test "Privacy summary endpoint"
else
    echo -e "${RED}❌ Privacy summary endpoint failed${NC}"
    echo "Response: $PRIVACY_RESPONSE"
    log_test "Privacy summary endpoint"
fi

# Step 3: Test deletion request endpoint
echo -e "\n${YELLOW}📋 Step 3: Testing deletion request endpoint${NC}"
DELETION_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/request-deletion" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$DELETION_RESPONSE" | grep -q "gdprRights"; then
    echo -e "${GREEN}✅ Deletion request endpoint working${NC}"
    log_test "Deletion request endpoint"
else
    echo -e "${RED}❌ Deletion request endpoint failed${NC}"
    echo "Response: $DELETION_RESPONSE"
    log_test "Deletion request endpoint"
fi

# Step 4: Test data export (JSON format)
echo -e "\n${YELLOW}📋 Step 4: Testing data export (JSON format)${NC}"
JSON_EXPORT_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/my-data?format=json" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$JSON_EXPORT_RESPONSE" | grep -q "exportMetadata"; then
    echo -e "${GREEN}✅ JSON data export working${NC}"
    log_test "JSON data export"
else
    echo -e "${RED}❌ JSON data export failed${NC}"
    echo "Response: $JSON_EXPORT_RESPONSE"
    log_test "JSON data export"
fi

# Step 5: Test data export (CSV format)
echo -e "\n${YELLOW}📋 Step 5: Testing data export (CSV format)${NC}"
CSV_EXPORT_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/my-data?format=csv" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$CSV_EXPORT_RESPONSE" | grep -q "Application ID"; then
    echo -e "${GREEN}✅ CSV data export working${NC}"
    log_test "CSV data export"
else
    echo -e "${RED}❌ CSV data export failed${NC}"
    echo "Response: $CSV_EXPORT_RESPONSE"
    log_test "CSV data export"
fi

# Step 6: Test data export with date range
echo -e "\n${YELLOW}📋 Step 6: Testing data export with date range${NC}"
DATE_FROM="2025-01-01"
DATE_TO="2025-12-31"
RANGE_EXPORT_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/my-data?dateFrom=${DATE_FROM}&dateTo=${DATE_TO}&includeHistory=true" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$RANGE_EXPORT_RESPONSE" | grep -q "exportMetadata"; then
    echo -e "${GREEN}✅ Date range data export working${NC}"
    log_test "Date range data export"
else
    echo -e "${RED}❌ Date range data export failed${NC}"
    echo "Response: $RANGE_EXPORT_RESPONSE"
    log_test "Date range data export"
fi

# Step 7: Test unauthorized access
echo -e "\n${YELLOW}📋 Step 7: Testing unauthorized access protection${NC}"
UNAUTHORIZED_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/my-data" \
    -H "Authorization: Bearer invalid_token")

if echo "$UNAUTHORIZED_RESPONSE" | grep -q "Invalid token\|Unauthorized"; then
    echo -e "${GREEN}✅ Unauthorized access properly blocked${NC}"
    log_test "Unauthorized access protection"
else
    echo -e "${RED}❌ Unauthorized access not blocked${NC}"
    echo "Response: $UNAUTHORIZED_RESPONSE"
    log_test "Unauthorized access protection"
fi

# Step 8: Test malformed requests
echo -e "\n${YELLOW}📋 Step 8: Testing validation with invalid date format${NC}"
INVALID_DATE_RESPONSE=$(curl -s -X GET "${API_BASE}/data-export/my-data?dateFrom=invalid-date" \
    -H "Authorization: Bearer $USER_TOKEN")

if echo "$INVALID_DATE_RESPONSE" | grep -q "validation_error\|invalid"; then
    echo -e "${GREEN}✅ Invalid date format properly rejected${NC}"
    log_test "Invalid date validation"
else
    echo -e "${RED}❌ Invalid date format not rejected${NC}"
    echo "Response: $INVALID_DATE_RESPONSE"
    log_test "Invalid date validation"
fi

# Final summary
echo -e "\n${BLUE}========================================"
echo "📊 Data Export Endpoints Test Summary"
echo "========================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All data export endpoint tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi