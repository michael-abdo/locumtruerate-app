#!/bin/bash

# Test API endpoints for frontend integration
# This script tests all the endpoints that the frontend API client uses

echo "========================================"
echo "TESTING API ENDPOINTS FOR FRONTEND"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:4000/api/v1"

# Test user credentials
TEST_EMAIL="frontend.test@example.com"
TEST_PASSWORD="TestPass123!"
TIMESTAMP=$(date +%s)

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

# Function to extract value from JSON using grep and sed
extract_json_value() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | sed "s/\"$2\":\s*\"\?\([^\"]*\)\"\?/\1/"
}

echo ""
echo "1. Testing Health Check..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:4000/health")
HTTP_STATUS=$(echo "$HEALTH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Health check passed"
else
    print_result 1 "Health check failed (HTTP $HTTP_STATUS)"
fi

echo ""
echo "2. Testing API Info Endpoint..."
API_INFO_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL")
HTTP_STATUS=$(echo "$API_INFO_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "API info endpoint working"
else
    print_result 1 "API info endpoint failed (HTTP $HTTP_STATUS)"
fi

echo ""
echo "3. Testing Authentication Flow..."

# Register new user
echo "   a) Registering new user..."
REGISTER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Frontend\",
        \"lastName\": \"Tester\",
        \"role\": \"locum\"
    }")

HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "201" ] || [ "$HTTP_STATUS" = "409" ]; then
    if [ "$HTTP_STATUS" = "409" ]; then
        print_result 0 "User already exists (expected)"
    else
        print_result 0 "User registration successful"
    fi
else
    print_result 1 "User registration failed (HTTP $HTTP_STATUS)"
    echo "$REGISTER_RESPONSE" | grep -v "HTTP_STATUS:"
fi

# Login
echo "   b) Testing login..."
LOGIN_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

HTTP_STATUS=$(echo "$LOGIN_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$HTTP_STATUS" = "200" ]; then
    TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        print_result 0 "Login successful, token received"
        echo "   Token: ${TOKEN:0:20}..."
    else
        print_result 1 "Login successful but no token in response"
    fi
else
    print_result 1 "Login failed (HTTP $HTTP_STATUS)"
    echo "$LOGIN_BODY"
fi

# Get current user
echo "   c) Testing get current user..."
if [ -n "$TOKEN" ]; then
    ME_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/auth/me" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$ME_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Get current user successful"
    else
        print_result 1 "Get current user failed (HTTP $HTTP_STATUS)"
    fi
else
    echo -e "${YELLOW}   Skipping (no token)${NC}"
fi

echo ""
echo "4. Testing Jobs Endpoints..."

# Get jobs (no auth required)
echo "   a) Getting job list..."
JOBS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/jobs?limit=5")
HTTP_STATUS=$(echo "$JOBS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Get jobs successful"
else
    print_result 1 "Get jobs failed (HTTP $HTTP_STATUS)"
fi

# Get specific job
echo "   b) Getting job by ID..."
JOB_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/jobs/1")
HTTP_STATUS=$(echo "$JOB_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
    if [ "$HTTP_STATUS" = "404" ]; then
        print_result 0 "Job not found (expected if no data)"
    else
        print_result 0 "Get job by ID successful"
    fi
else
    print_result 1 "Get job by ID failed (HTTP $HTTP_STATUS)"
fi

# Search jobs with filters
echo "   c) Searching jobs with filters..."
SEARCH_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/jobs?state=CA&minRate=150&maxRate=300")
HTTP_STATUS=$(echo "$SEARCH_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Job search with filters successful"
else
    print_result 1 "Job search failed (HTTP $HTTP_STATUS)"
fi

echo ""
echo "5. Testing Calculator Endpoints..."

# Contract calculator
echo "   a) Testing contract calculator..."
CONTRACT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/calculate/contract" \
    -H "Content-Type: application/json" \
    -d '{
        "hourlyRate": 200,
        "hoursPerWeek": 40,
        "weeksPerYear": 48,
        "state": "CA",
        "expenseRate": 0.15
    }')

HTTP_STATUS=$(echo "$CONTRACT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Contract calculator successful"
    CONTRACT_BODY=$(echo "$CONTRACT_RESPONSE" | grep -v "HTTP_STATUS:")
    ANNUAL_GROSS=$(echo "$CONTRACT_BODY" | grep -o '"annual":[^,}]*' | head -1 | sed 's/.*://;s/[^0-9.]//g')
    if [ -n "$ANNUAL_GROSS" ]; then
        echo "   Annual gross: \$$ANNUAL_GROSS"
    fi
else
    print_result 1 "Contract calculator failed (HTTP $HTTP_STATUS)"
fi

# Paycheck calculator
echo "   b) Testing paycheck calculator..."
PAYCHECK_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/calculate/paycheck" \
    -H "Content-Type: application/json" \
    -d '{
        "regularHours": 40,
        "regularRate": 200,
        "overtimeHours": 10,
        "overtimeRate": 300,
        "state": "CA",
        "period": "weekly"
    }')

HTTP_STATUS=$(echo "$PAYCHECK_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Paycheck calculator successful"
else
    print_result 1 "Paycheck calculator failed (HTTP $HTTP_STATUS)"
fi

# Get tax info
echo "   c) Getting tax information..."
TAX_INFO_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/calculate/tax-info")
HTTP_STATUS=$(echo "$TAX_INFO_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Get tax info successful"
else
    print_result 1 "Get tax info failed (HTTP $HTTP_STATUS)"
fi

# Get states list
echo "   d) Getting states list..."
STATES_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/calculate/states")
HTTP_STATUS=$(echo "$STATES_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
if [ "$HTTP_STATUS" = "200" ]; then
    print_result 0 "Get states list successful"
else
    print_result 1 "Get states list failed (HTTP $HTTP_STATUS)"
fi

echo ""
echo "6. Testing Application Endpoints (Auth Required)..."

if [ -n "$TOKEN" ]; then
    # Get my applications
    echo "   a) Getting my applications..."
    MY_APPS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/applications/my" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$MY_APPS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Get my applications successful"
    else
        print_result 1 "Get my applications failed (HTTP $HTTP_STATUS)"
    fi
    
    # Get filter options
    echo "   b) Getting application filter options..."
    FILTER_OPTIONS_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/applications/filter-options" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$FILTER_OPTIONS_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Get filter options successful"
    else
        print_result 1 "Get filter options failed (HTTP $HTTP_STATUS)"
    fi
else
    echo -e "${YELLOW}   Skipping authenticated endpoints (no token)${NC}"
fi

echo ""
echo "7. Testing GDPR/Data Export Endpoints..."

if [ -n "$TOKEN" ]; then
    # Export my data
    echo "   a) Exporting user data..."
    EXPORT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/data-export/my-data?format=json" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$EXPORT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Data export successful"
    else
        print_result 1 "Data export failed (HTTP $HTTP_STATUS)"
    fi
    
    # Privacy summary
    echo "   b) Getting privacy summary..."
    PRIVACY_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/data-export/privacy-summary" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$PRIVACY_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Privacy summary successful"
    else
        print_result 1 "Privacy summary failed (HTTP $HTTP_STATUS)"
    fi
    
    # Logout
    echo ""
    echo "   c) Testing logout..."
    LOGOUT_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/auth/logout" \
        -H "Authorization: Bearer $TOKEN")
    
    HTTP_STATUS=$(echo "$LOGOUT_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    if [ "$HTTP_STATUS" = "200" ]; then
        print_result 0 "Logout successful"
    else
        print_result 1 "Logout failed (HTTP $HTTP_STATUS)"
    fi
else
    echo -e "${YELLOW}   Skipping authenticated endpoints (no token)${NC}"
fi

echo ""
echo "========================================"
echo "FRONTEND INTEGRATION TEST COMPLETE"
echo "========================================"
echo ""
echo "To test the frontend client:"
echo "1. Make sure the API server is running: npm start"
echo "2. Open vanilla-demos-only/api-client-demo.html in a browser"
echo "3. Try the login with: $TEST_EMAIL / $TEST_PASSWORD"
echo "4. Test various API calls using the demo interface"
echo ""
echo "Or serve the demo locally:"
echo "cd vanilla-demos-only && python3 -m http.server 8080"
echo "Then visit: http://localhost:8080/api-client-demo.html"
echo ""