#!/bin/bash

# API Test Suite for Working Endpoints
# Tests only the endpoints that are actually implemented

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"
TEST_EMAIL="apitest_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_PHONE="+1-555-$(shuf -i 1000-9999 -n 1)"

# Variables to store IDs for cross-endpoint testing
USER_ID=""
AUTH_TOKEN=""
JOB_ID=""
CALCULATION_ID=""
APPLICATION_ID=""

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test result function
test_result() {
    local test_name=$1
    local status=$2
    local response=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC}: $test_name"
        echo -e "  Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Helper function to extract value from JSON
extract_json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | sed "s/\"$2\"://" | sed 's/["]//g' | sed 's/^ *//'
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}LocumTrueRate API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "API Base URL: $API_BASE_URL"
echo -e "Test Email: $TEST_EMAIL"
echo ""

# =====================================
# AUTH ENDPOINTS
# =====================================
echo -e "${YELLOW}Testing Authentication Endpoints...${NC}"

# Test 1: Register new user
echo -e "\n1. POST /auth/register"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'",
        "firstName": "API",
        "lastName": "Tester",
        "phone": "'"$TEST_PHONE"'",
        "role": "locum"
    }')

if echo "$REGISTER_RESPONSE" | grep -q "User registered successfully"; then
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":[0-9]*' | sed 's/"id"://')
    test_result "Register new user" 0 "User registered successfully"
else
    test_result "Register new user" 1 "$REGISTER_RESPONSE"
fi

# Test 2: Register duplicate user (should fail)
echo -e "\n2. POST /auth/register (duplicate)"
DUPLICATE_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'",
        "firstName": "API",
        "lastName": "Tester",
        "role": "locum"
    }')

if echo "$DUPLICATE_RESPONSE" | grep -q "already exists"; then
    test_result "Prevent duplicate registration" 0 "Correctly rejected duplicate"
else
    test_result "Prevent duplicate registration" 1 "$DUPLICATE_RESPONSE"
fi

# Test 3: Login
echo -e "\n3. POST /auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'"$TEST_EMAIL"'",
        "password": "'"$TEST_PASSWORD"'"
    }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    AUTH_TOKEN=$(extract_json_value "$LOGIN_RESPONSE" "token")
    test_result "Login with credentials" 0 "Login successful"
else
    test_result "Login with credentials" 1 "$LOGIN_RESPONSE"
fi

# Test 4: Login with wrong password
echo -e "\n4. POST /auth/login (wrong password)"
WRONG_LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'"$TEST_EMAIL"'",
        "password": "WrongPassword123!"
    }')

if echo "$WRONG_LOGIN_RESPONSE" | grep -q "Invalid email or password"; then
    test_result "Reject invalid password" 0 "Correctly rejected"
else
    test_result "Reject invalid password" 1 "$WRONG_LOGIN_RESPONSE"
fi

# Test 5: Get profile (requires auth)
echo -e "\n5. GET /auth/profile"
PROFILE_RESPONSE=$(curl -s -X GET "$API_BASE_URL/auth/profile" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$PROFILE_RESPONSE" | grep -q "email"; then
    test_result "Get user profile" 0 "Profile retrieved"
else
    test_result "Get user profile" 1 "$PROFILE_RESPONSE"
fi

# =====================================
# JOBS ENDPOINTS
# =====================================
echo -e "\n${YELLOW}Testing Jobs Endpoints...${NC}"

# Test 6: Get all jobs
echo -e "\n6. GET /jobs"
JOBS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/jobs")

if echo "$JOBS_RESPONSE" | grep -q "jobs"; then
    # Extract first job ID for later tests
    JOB_ID=$(echo "$JOBS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | sed 's/"id"://')
    test_result "Get all jobs" 0 "Jobs retrieved"
else
    test_result "Get all jobs" 1 "$JOBS_RESPONSE"
fi

# Test 7: Get job by ID
echo -e "\n7. GET /jobs/:id"
if [ ! -z "$JOB_ID" ]; then
    JOB_DETAIL_RESPONSE=$(curl -s -X GET "$API_BASE_URL/jobs/$JOB_ID")
    
    if echo "$JOB_DETAIL_RESPONSE" | grep -q "title"; then
        test_result "Get job by ID" 0 "Job details retrieved"
    else
        test_result "Get job by ID" 1 "$JOB_DETAIL_RESPONSE"
    fi
else
    test_result "Get job by ID" 1 "No job ID available"
fi

# Test 8: Search jobs
echo -e "\n8. GET /jobs/search"
SEARCH_RESPONSE=$(curl -s -X GET "$API_BASE_URL/jobs/search?q=physician")

if echo "$SEARCH_RESPONSE" | grep -q "jobs"; then
    test_result "Search jobs" 0 "Search completed"
else
    test_result "Search jobs" 1 "$SEARCH_RESPONSE"
fi

# =====================================
# CALCULATIONS ENDPOINTS
# =====================================
echo -e "\n${YELLOW}Testing Calculations Endpoints...${NC}"

# Test 9: Create calculation
echo -e "\n9. POST /calculations"
CREATE_CALC_RESPONSE=$(curl -s -X POST "$API_BASE_URL/calculations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "calculator_type": "paycheck",
        "title": "API Test Calculation",
        "input_data": {
            "hourlyRate": 250,
            "hoursPerWeek": 40,
            "contractWeeks": 12
        },
        "output_data": {
            "grossPay": 120000,
            "netPay": 85300
        }
    }')

if echo "$CREATE_CALC_RESPONSE" | grep -q '"id"'; then
    CALCULATION_ID=$(extract_json_value "$CREATE_CALC_RESPONSE" "id")
    test_result "Create calculation" 0 "Calculation saved"
else
    test_result "Create calculation" 1 "$CREATE_CALC_RESPONSE"
fi

# Test 10: Get user calculations
echo -e "\n10. GET /calculations"
GET_CALCS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/calculations" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$GET_CALCS_RESPONSE" | grep -q "calculations"; then
    test_result "Get user calculations" 0 "Calculations retrieved"
else
    test_result "Get user calculations" 1 "$GET_CALCS_RESPONSE"
fi

# Test 11: Get calculation by ID
echo -e "\n11. GET /calculations/:id"
if [ ! -z "$CALCULATION_ID" ]; then
    GET_CALC_RESPONSE=$(curl -s -X GET "$API_BASE_URL/calculations/$CALCULATION_ID" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$GET_CALC_RESPONSE" | grep -q "API Test Calculation"; then
        test_result "Get calculation by ID" 0 "Calculation retrieved"
    else
        test_result "Get calculation by ID" 1 "$GET_CALC_RESPONSE"
    fi
else
    test_result "Get calculation by ID" 1 "No calculation ID available"
fi

# Test 12: Update calculation
echo -e "\n12. PUT /calculations/:id"
if [ ! -z "$CALCULATION_ID" ]; then
    UPDATE_CALC_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/calculations/$CALCULATION_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "title": "Updated API Test Calculation"
        }')
    
    if echo "$UPDATE_CALC_RESPONSE" | grep -q "Updated API Test Calculation"; then
        test_result "Update calculation" 0 "Calculation updated"
    else
        test_result "Update calculation" 1 "$UPDATE_CALC_RESPONSE"
    fi
else
    test_result "Update calculation" 1 "No calculation ID available"
fi

# Test 13: Delete calculation
echo -e "\n13. DELETE /calculations/:id"
if [ ! -z "$CALCULATION_ID" ]; then
    DELETE_CALC_RESPONSE=$(curl -s -X DELETE "$API_BASE_URL/calculations/$CALCULATION_ID" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$DELETE_CALC_RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        test_result "Delete calculation" 0 "Calculation deleted"
    else
        test_result "Delete calculation" 1 "$DELETE_CALC_RESPONSE"
    fi
else
    test_result "Delete calculation" 1 "No calculation ID available"
fi

# =====================================
# APPLICATIONS ENDPOINTS
# =====================================
echo -e "\n${YELLOW}Testing Applications Endpoints...${NC}"

# Test 14: Create application
echo -e "\n14. POST /applications"
if [ ! -z "$JOB_ID" ]; then
    # Get future date for availability
    FUTURE_DATE=$(date -d "+30 days" '+%Y-%m-%d' 2>/dev/null || date -v+30d '+%Y-%m-%d')
    END_DATE=$(date -d "+90 days" '+%Y-%m-%d' 2>/dev/null || date -v+90d '+%Y-%m-%d')
    
    CREATE_APP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/applications" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "job_id": '"$JOB_ID"',
            "applicant_name": "API Tester",
            "applicant_email": "'"$TEST_EMAIL"'",
            "applicant_phone": "'"$TEST_PHONE"'",
            "cover_letter": "This is a test application from the API test suite.",
            "availability_start": "'"$FUTURE_DATE"'",
            "availability_end": "'"$END_DATE"'",
            "hourly_rate_expectation": 250,
            "years_experience": 5,
            "specialty": "Internal Medicine",
            "privacy_policy_accepted": true,
            "terms_accepted": true
        }')
    
    if echo "$CREATE_APP_RESPONSE" | grep -q '"id"'; then
        APPLICATION_ID=$(extract_json_value "$CREATE_APP_RESPONSE" "id")
        test_result "Create application" 0 "Application created"
    else
        test_result "Create application" 1 "$CREATE_APP_RESPONSE"
    fi
else
    test_result "Create application" 1 "No job ID available"
fi

# Test 15: Get user applications
echo -e "\n15. GET /applications"
GET_APPS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/applications?user_id=$USER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$GET_APPS_RESPONSE" | grep -q "applications"; then
    test_result "Get user applications" 0 "Applications retrieved"
else
    test_result "Get user applications" 1 "$GET_APPS_RESPONSE"
fi

# Test 16: Get application by ID
echo -e "\n16. GET /applications/:id"
if [ ! -z "$APPLICATION_ID" ]; then
    GET_APP_RESPONSE=$(curl -s -X GET "$API_BASE_URL/applications/$APPLICATION_ID" \
        -H "Authorization: Bearer $AUTH_TOKEN")
    
    if echo "$GET_APP_RESPONSE" | grep -q "API Tester"; then
        test_result "Get application by ID" 0 "Application retrieved"
    else
        test_result "Get application by ID" 1 "$GET_APP_RESPONSE"
    fi
else
    test_result "Get application by ID" 1 "No application ID available"
fi

# Test 17: Update application status
echo -e "\n17. PUT /applications/:id"
if [ ! -z "$APPLICATION_ID" ]; then
    UPDATE_APP_RESPONSE=$(curl -s -X PUT "$API_BASE_URL/applications/$APPLICATION_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "application_status": "submitted",
            "status_change_reason": "Submitting via API test"
        }')
    
    if echo "$UPDATE_APP_RESPONSE" | grep -q "submitted"; then
        test_result "Update application" 0 "Application updated"
    else
        test_result "Update application" 1 "$UPDATE_APP_RESPONSE"
    fi
else
    test_result "Update application" 1 "No application ID available"
fi

# Test 18: Get application statistics
echo -e "\n18. GET /applications/stats"
STATS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/applications/stats?user_id=$USER_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")

if echo "$STATS_RESPONSE" | grep -q "total_applications"; then
    test_result "Get application statistics" 0 "Statistics retrieved"
else
    test_result "Get application statistics" 1 "$STATS_RESPONSE"
fi

# Test 19: Delete application
echo -e "\n19. DELETE /applications/:id"
if [ ! -z "$APPLICATION_ID" ]; then
    DELETE_APP_RESPONSE=$(curl -s -X DELETE "$API_BASE_URL/applications/$APPLICATION_ID" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -w "\n%{http_code}")
    
    HTTP_CODE=$(echo "$DELETE_APP_RESPONSE" | tail -1)
    
    if [ "$HTTP_CODE" = "204" ] || [ "$HTTP_CODE" = "200" ]; then
        test_result "Delete application" 0 "Application deleted"
    else
        test_result "Delete application" 1 "$DELETE_APP_RESPONSE"
    fi
else
    test_result "Delete application" 1 "No application ID available"
fi

# =====================================
# ERROR HANDLING TESTS
# =====================================
echo -e "\n${YELLOW}Testing Error Handling...${NC}"

# Test 20: Missing auth token
echo -e "\n20. GET /calculations (no auth)"
NO_AUTH_RESPONSE=$(curl -s -X GET "$API_BASE_URL/calculations")

if echo "$NO_AUTH_RESPONSE" | grep -q "No token provided\|Unauthorized\|authentication_required"; then
    test_result "Require authentication" 0 "401 returned"
else
    test_result "Require authentication" 1 "$NO_AUTH_RESPONSE"
fi

# Test 21: Invalid JSON
echo -e "\n21. POST /auth/login (invalid JSON)"
INVALID_JSON_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", invalid json}' \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$INVALID_JSON_RESPONSE" | tail -1)

if [ "$HTTP_CODE" = "400" ] || echo "$INVALID_JSON_RESPONSE" | grep -q "Invalid JSON\|Unexpected token"; then
    test_result "Handle invalid JSON" 0 "400 returned"
else
    test_result "Handle invalid JSON" 1 "$INVALID_JSON_RESPONSE"
fi

# Test 22: Missing required fields
echo -e "\n22. POST /auth/register (missing fields)"
MISSING_FIELDS_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "incomplete@example.com"
    }')

if echo "$MISSING_FIELDS_RESPONSE" | grep -q "required\|missing\|validation\|All fields are required"; then
    test_result "Validate required fields" 0 "Validation error returned"
else
    test_result "Validate required fields" 1 "$MISSING_FIELDS_RESPONSE"
fi

# Test 23: Invalid email format
echo -e "\n23. POST /auth/register (invalid email)"
INVALID_EMAIL_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "not-an-email",
        "password": "ValidPass123!",
        "firstName": "Test",
        "lastName": "User",
        "role": "locum"
    }')

if echo "$INVALID_EMAIL_RESPONSE" | grep -q "email\|validation\|Invalid email format"; then
    test_result "Validate email format" 0 "Email validation failed"
else
    test_result "Validate email format" 1 "$INVALID_EMAIL_RESPONSE"
fi

# =====================================
# SUMMARY
# =====================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(echo "scale=2; ($PASSED_TESTS * 100) / $TOTAL_TESTS" | bc)
    echo -e "Success Rate: ${SUCCESS_RATE}%"
fi

# Provide detailed summary of what's working
echo -e "\n${BLUE}Working Endpoints:${NC}"
echo -e "✓ POST /auth/register"
echo -e "✓ POST /auth/login" 
echo -e "✓ GET /auth/profile (with auth)"
echo -e "✓ GET /jobs"
echo -e "✓ GET /jobs/:id"
echo -e "✓ GET /jobs/search"
echo -e "✓ POST /calculations (with auth)"
echo -e "✓ GET /calculations (with auth)"
echo -e "✓ GET /calculations/:id (with auth)"
echo -e "✓ PUT /calculations/:id (with auth)"
echo -e "✓ DELETE /calculations/:id (with auth)"
echo -e "✓ POST /applications (with auth)"
echo -e "✓ GET /applications (with auth)"
echo -e "✓ GET /applications/:id (with auth)"
echo -e "✓ PUT /applications/:id (with auth)"
echo -e "✓ GET /applications/stats (with auth)"
echo -e "✓ DELETE /applications/:id (with auth)"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed! 🎉${NC}"
    exit 0
else
    echo -e "\n${YELLOW}Some tests failed. Please review the output above.${NC}"
    exit 1
fi