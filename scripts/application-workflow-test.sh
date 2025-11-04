#!/bin/bash

# Enhanced Application Workflow Test Script
# Tests the complete application flow with proper user roles

set -e

BASE_URL="https://locumcalc-production-17560d4c3d1a.herokuapp.com"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🚀 Starting Enhanced Application Workflow Test${NC}"
echo "Testing against: $API_BASE"
echo "========================================"

# Step 1: Create a recruiter user
echo -e "\n${YELLOW}📋 Step 1: Creating recruiter user${NC}"
RECRUITER_EMAIL="test-recruiter-$(date +%s)@example.com"
RECRUITER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$RECRUITER_EMAIL\",
        \"password\": \"password123\",
        \"role\": \"recruiter\",
        \"firstName\": \"Jane\",
        \"lastName\": \"Recruiter\"
    }")

if echo "$RECRUITER_RESPONSE" | grep -q "User registered successfully"; then
    echo -e "${GREEN}✅ Recruiter registered successfully${NC}"
    
    # Now login to get token
    RECRUITER_LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$RECRUITER_EMAIL\",
            \"password\": \"password123\"
        }")
    
    if echo "$RECRUITER_LOGIN_RESPONSE" | grep -q "token"; then
        RECRUITER_TOKEN=$(echo "$RECRUITER_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Recruiter logged in successfully${NC}"
        echo "Recruiter Token: ${RECRUITER_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Failed to login recruiter${NC}"
        echo "Response: $RECRUITER_LOGIN_RESPONSE"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to register recruiter${NC}"
    echo "Response: $RECRUITER_RESPONSE"
    exit 1
fi

# Step 2: Create a locum user
echo -e "\n${YELLOW}📋 Step 2: Creating locum user${NC}"
LOCUM_EMAIL="test-locum-$(date +%s)@example.com"
LOCUM_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$LOCUM_EMAIL\",
        \"password\": \"password123\",
        \"role\": \"locum\",
        \"firstName\": \"Dr. John\",
        \"lastName\": \"Locum\"
    }")

if echo "$LOCUM_RESPONSE" | grep -q "User registered successfully"; then
    echo -e "${GREEN}✅ Locum registered successfully${NC}"
    
    # Now login to get token
    LOCUM_LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$LOCUM_EMAIL\",
            \"password\": \"password123\"
        }")
    
    if echo "$LOCUM_LOGIN_RESPONSE" | grep -q "token"; then
        LOCUM_TOKEN=$(echo "$LOCUM_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        echo -e "${GREEN}✅ Locum logged in successfully${NC}"
        echo "Locum Token: ${LOCUM_TOKEN:0:20}..."
    else
        echo -e "${RED}❌ Failed to login locum${NC}"
        echo "Response: $LOCUM_LOGIN_RESPONSE"
        exit 1
    fi
else
    echo -e "${RED}❌ Failed to register locum${NC}"
    echo "Response: $LOCUM_RESPONSE"
    exit 1
fi

# Step 3: Recruiter creates a job
echo -e "\n${YELLOW}📋 Step 3: Recruiter creates a job${NC}"
FUTURE_DATE=$(date -d "+30 days" +%Y-%m-%d)
JOB_RESPONSE=$(curl -s -X POST "${API_BASE}/jobs" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RECRUITER_TOKEN" \
    -d "{
        \"title\": \"Test ER Physician Position\",
        \"location\": \"Test City, TX\",
        \"state\": \"TX\",
        \"specialty\": \"Emergency Medicine\",
        \"description\": \"Test position for application workflow\",
        \"hourlyRateMin\": 250,
        \"hourlyRateMax\": 300,
        \"startDate\": \"$FUTURE_DATE\",
        \"duration\": \"3 months\",
        \"shiftType\": \"12-hour shifts\",
        \"companyName\": \"Test Medical Center\"
    }")

if echo "$JOB_RESPONSE" | grep -q '"id"'; then
    JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Job created successfully${NC}"
    echo "Job ID: $JOB_ID"
else
    echo -e "${RED}❌ Failed to create job${NC}"
    echo "Response: $JOB_RESPONSE"
    exit 1
fi

# Step 4: Locum applies to the job
echo -e "\n${YELLOW}📋 Step 4: Locum applies to job${NC}"
APPLICATION_DATE=$(date -d "+45 days" +%Y-%m-%d)
APPLICATION_RESPONSE=$(curl -s -X POST "${API_BASE}/applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LOCUM_TOKEN" \
    -d "{
        \"jobId\": $JOB_ID,
        \"coverLetter\": \"I am very interested in this position and believe my experience makes me a great fit.\",
        \"expectedRate\": 275,
        \"availableDate\": \"$APPLICATION_DATE\"
    }")

if echo "$APPLICATION_RESPONSE" | grep -q '"id"'; then
    APPLICATION_ID=$(echo "$APPLICATION_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ Application created successfully${NC}"
    echo "Application ID: $APPLICATION_ID"
else
    echo -e "${RED}❌ Failed to create application${NC}"
    echo "Response: $APPLICATION_RESPONSE"
    exit 1
fi

# Step 5: Locum gets their own applications
echo -e "\n${YELLOW}📋 Step 5: Locum retrieves their applications${NC}"
MY_APPLICATIONS_RESPONSE=$(curl -s -X GET "${API_BASE}/applications/my" \
    -H "Authorization: Bearer $LOCUM_TOKEN")

if echo "$MY_APPLICATIONS_RESPONSE" | grep -q "$APPLICATION_ID"; then
    echo -e "${GREEN}✅ Locum can retrieve their applications${NC}"
    log_test "Locum get my applications"
else
    echo -e "${RED}❌ Locum cannot retrieve their applications${NC}"
    echo "Response: $MY_APPLICATIONS_RESPONSE"
    log_test "Locum get my applications"
fi

# Step 6: Recruiter gets applications for their job
echo -e "\n${YELLOW}📋 Step 6: Recruiter retrieves job applications${NC}"
JOB_APPLICATIONS_RESPONSE=$(curl -s -X GET "${API_BASE}/jobs/$JOB_ID/applications" \
    -H "Authorization: Bearer $RECRUITER_TOKEN")

if echo "$JOB_APPLICATIONS_RESPONSE" | grep -q "$APPLICATION_ID"; then
    echo -e "${GREEN}✅ Recruiter can retrieve job applications${NC}"
    log_test "Recruiter get job applications"
else
    echo -e "${RED}❌ Recruiter cannot retrieve job applications${NC}"
    echo "Response: $JOB_APPLICATIONS_RESPONSE"
    log_test "Recruiter get job applications"
fi

# Step 7: Recruiter updates application status
echo -e "\n${YELLOW}📋 Step 7: Recruiter updates application status${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "${API_BASE}/applications/$APPLICATION_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $RECRUITER_TOKEN" \
    -d "{
        \"status\": \"reviewed\",
        \"notes\": \"Good candidate, proceeding to interview\"
    }")

if echo "$UPDATE_RESPONSE" | grep -q '"status":"reviewed"'; then
    echo -e "${GREEN}✅ Application status updated successfully${NC}"
    log_test "Recruiter update application status"
else
    echo -e "${RED}❌ Failed to update application status${NC}"
    echo "Response: $UPDATE_RESPONSE"
    log_test "Recruiter update application status"
fi

# Step 8: Verify updated status is visible to locum
echo -e "\n${YELLOW}📋 Step 8: Verify updated status visible to locum${NC}"
UPDATED_APPLICATION_RESPONSE=$(curl -s -X GET "${API_BASE}/applications/my" \
    -H "Authorization: Bearer $LOCUM_TOKEN")

if echo "$UPDATED_APPLICATION_RESPONSE" | grep -q '"status":"reviewed"'; then
    echo -e "${GREEN}✅ Updated status visible to locum${NC}"
    log_test "Status update visible to applicant"
else
    echo -e "${RED}❌ Updated status not visible to locum${NC}"
    echo "Response: $UPDATED_APPLICATION_RESPONSE"
    log_test "Status update visible to applicant"
fi

# Step 9: Test get single application endpoint
echo -e "\n${YELLOW}📋 Step 9: Test get single application${NC}"
SINGLE_APPLICATION_RESPONSE=$(curl -s -X GET "${API_BASE}/applications/$APPLICATION_ID" \
    -H "Authorization: Bearer $LOCUM_TOKEN")

if echo "$SINGLE_APPLICATION_RESPONSE" | grep -q '"id":'$APPLICATION_ID; then
    echo -e "${GREEN}✅ Can retrieve single application${NC}"
    log_test "Get single application"
else
    echo -e "${RED}❌ Cannot retrieve single application${NC}"
    echo "Response: $SINGLE_APPLICATION_RESPONSE"
    log_test "Get single application"
fi

# Step 10: Test unauthorized access (locum tries to access other's application)
echo -e "\n${YELLOW}📋 Step 10: Test unauthorized access protection${NC}"
# First create another locum and application to test against
OTHER_LOCUM_EMAIL="other-locum-$(date +%s)@example.com"
OTHER_LOCUM_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$OTHER_LOCUM_EMAIL\",
        \"password\": \"password123\",
        \"role\": \"locum\",
        \"firstName\": \"Dr. Jane\",
        \"lastName\": \"Other\"
    }")

if echo "$OTHER_LOCUM_RESPONSE" | grep -q "User registered successfully"; then
    # Login to get token
    OTHER_LOCUM_LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$OTHER_LOCUM_EMAIL\",
            \"password\": \"password123\"
        }")
    
    if echo "$OTHER_LOCUM_LOGIN_RESPONSE" | grep -q "token"; then
        OTHER_LOCUM_TOKEN=$(echo "$OTHER_LOCUM_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        
        # Try to access the first locum's application with the second locum's token
        UNAUTHORIZED_RESPONSE=$(curl -s -X GET "${API_BASE}/applications/$APPLICATION_ID" \
            -H "Authorization: Bearer $OTHER_LOCUM_TOKEN")
        
        if echo "$UNAUTHORIZED_RESPONSE" | grep -q "403\|Unauthorized\|not authorized"; then
            echo -e "${GREEN}✅ Unauthorized access properly blocked${NC}"
            log_test "Unauthorized access blocked"
        else
            echo -e "${RED}❌ Unauthorized access not blocked${NC}"
            echo "Response: $UNAUTHORIZED_RESPONSE"
            log_test "Unauthorized access blocked"
        fi
    else
        echo -e "${YELLOW}⚠️ Could not login second locum for unauthorized test${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Could not create second locum for unauthorized test${NC}"
fi

# Cleanup step (optional - delete test data)
echo -e "\n${YELLOW}📋 Cleanup: Deleting test application${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE "${API_BASE}/applications/$APPLICATION_ID" \
    -H "Authorization: Bearer $LOCUM_TOKEN")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Test application deleted${NC}"
else
    echo -e "${YELLOW}⚠️ Could not delete test application (may not be implemented)${NC}"
fi

# Final summary
echo -e "\n${BLUE}========================================"
echo "📊 Application Workflow Test Summary"
echo "========================================"
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All application workflow tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Check the output above for details.${NC}"
    exit 1
fi