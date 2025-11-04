#!/bin/bash

# LocumCalc API Test Script
# Tests all API endpoints against the production deployment

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL for production
BASE_URL="https://locumcalc-production-17560d4c3d1a.herokuapp.com"

# Variables to store auth data
AUTH_TOKEN=""
USER_ID=""
JOB_ID=""
APPLICATION_ID=""

# Function to print test headers
print_test() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo -e "${BLUE}LocumCalc API Test Suite${NC}"
echo "Testing against: $BASE_URL"
echo "$(date)"

# =============================================================================
# SYSTEM ENDPOINTS
# =============================================================================

print_test "HEALTH CHECK ENDPOINT"
HEALTH_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/health")
HEALTH_STATUS=$(echo $HEALTH_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$HEALTH_STATUS" -eq 200 ]; then
    print_success "Health check endpoint working"
    echo $HEALTH_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.'
else
    print_error "Health check failed with status $HEALTH_STATUS"
fi

print_test "API INFO ENDPOINT"
API_INFO_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/v1")
API_INFO_STATUS=$(echo $API_INFO_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$API_INFO_STATUS" -eq 200 ]; then
    print_success "API info endpoint working"
    echo $API_INFO_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.'
else
    print_error "API info failed with status $API_INFO_STATUS"
fi

print_test "METRICS ENDPOINT"
METRICS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/metrics")
METRICS_STATUS=$(echo $METRICS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$METRICS_STATUS" -eq 200 ]; then
    print_success "Metrics endpoint working"
else
    print_error "Metrics failed with status $METRICS_STATUS"
fi

# =============================================================================
# AUTHENTICATION ENDPOINTS
# =============================================================================

print_test "USER REGISTRATION"
REGISTER_DATA='{
    "email": "testuser_'$(date +%s)'@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "555-0123",
    "role": "locum"
}'

REGISTER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA" \
    "$BASE_URL/api/v1/auth/register")

REGISTER_STATUS=$(echo $REGISTER_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$REGISTER_STATUS" -eq 201 ]; then
    print_success "User registration successful"
    USER_EMAIL=$(echo $REGISTER_DATA | jq -r '.email')
    echo "Registered user: $USER_EMAIL"
else
    print_error "Registration failed with status $REGISTER_STATUS"
    echo $REGISTER_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
fi

print_test "USER LOGIN"
LOGIN_DATA='{
    "email": "'$USER_EMAIL'",
    "password": "TestPassword123!"
}'

LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" \
    "$BASE_URL/api/v1/auth/login")

LOGIN_STATUS=$(echo $LOGIN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$LOGIN_STATUS" -eq 200 ]; then
    print_success "User login successful"
    AUTH_TOKEN=$(echo $LOGIN_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq -r '.token')
    USER_ID=$(echo $LOGIN_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq -r '.user.id')
    print_success "Auth token obtained: ${AUTH_TOKEN:0:20}..."
else
    print_error "Login failed with status $LOGIN_STATUS"
    echo $LOGIN_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
fi

print_test "GET CURRENT USER"
if [ ! -z "$AUTH_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/auth/me")
    
    ME_STATUS=$(echo $ME_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$ME_STATUS" -eq 200 ]; then
        print_success "Get current user successful"
        echo $ME_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.user'
    else
        print_error "Get current user failed with status $ME_STATUS"
    fi
else
    print_warning "Skipping current user test - no auth token"
fi

# =============================================================================
# JOB ENDPOINTS
# =============================================================================

print_test "GET ALL JOBS"
JOBS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/v1/jobs")
JOBS_STATUS=$(echo $JOBS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$JOBS_STATUS" -eq 200 ]; then
    print_success "Get all jobs successful"
    JOB_COUNT=$(echo $JOBS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.jobs | length')
    print_success "Found $JOB_COUNT jobs"
    
    # Get first job ID for testing
    JOB_ID=$(echo $JOBS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq -r '.jobs[0].id // empty')
    if [ ! -z "$JOB_ID" ]; then
        print_success "Using job ID for testing: $JOB_ID"
    fi
else
    print_error "Get all jobs failed with status $JOBS_STATUS"
fi

print_test "GET SINGLE JOB"
if [ ! -z "$JOB_ID" ]; then
    SINGLE_JOB_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" "$BASE_URL/api/v1/jobs/$JOB_ID")
    SINGLE_JOB_STATUS=$(echo $SINGLE_JOB_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$SINGLE_JOB_STATUS" -eq 200 ]; then
        print_success "Get single job successful"
        echo $SINGLE_JOB_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.job.title'
    else
        print_error "Get single job failed with status $SINGLE_JOB_STATUS"
    fi
else
    print_warning "Skipping single job test - no job ID available"
fi

print_test "CREATE JOB"
if [ ! -z "$AUTH_TOKEN" ]; then
    CREATE_JOB_DATA='{
        "title": "Test Locum Position",
        "facility": "Test Hospital",
        "location": "Test City, TS",
        "specialty": "Internal Medicine",
        "description": "Test job posting created by API test",
        "requirements": "Test requirements",
        "hourlyRate": 85,
        "startDate": "2025-01-15",
        "duration": "3 months",
        "benefits": "Test benefits",
        "contactEmail": "test@example.com"
    }'
    
    CREATE_JOB_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$CREATE_JOB_DATA" \
        "$BASE_URL/api/v1/jobs")
    
    CREATE_JOB_STATUS=$(echo $CREATE_JOB_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$CREATE_JOB_STATUS" -eq 201 ]; then
        print_success "Create job successful"
        CREATED_JOB_ID=$(echo $CREATE_JOB_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq -r '.job.id')
        print_success "Created job ID: $CREATED_JOB_ID"
        JOB_ID=$CREATED_JOB_ID  # Use the created job for further tests
    else
        print_error "Create job failed with status $CREATE_JOB_STATUS"
        echo $CREATE_JOB_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
    fi
else
    print_warning "Skipping create job test - no auth token"
fi

print_test "UPDATE JOB"
if [ ! -z "$AUTH_TOKEN" ] && [ ! -z "$JOB_ID" ]; then
    UPDATE_JOB_DATA='{
        "title": "Updated Test Locum Position",
        "hourlyRateMin": 85,
        "hourlyRateMax": 95
    }'
    
    UPDATE_JOB_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$UPDATE_JOB_DATA" \
        "$BASE_URL/api/v1/jobs/$JOB_ID")
    
    UPDATE_JOB_STATUS=$(echo $UPDATE_JOB_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$UPDATE_JOB_STATUS" -eq 200 ]; then
        print_success "Update job successful"
    else
        print_error "Update job failed with status $UPDATE_JOB_STATUS"
        echo $UPDATE_JOB_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
    fi
else
    print_warning "Skipping update job test - missing auth token or job ID"
fi

# =============================================================================
# APPLICATION ENDPOINTS
# =============================================================================

print_test "APPLY TO JOB"
if [ ! -z "$AUTH_TOKEN" ] && [ ! -z "$JOB_ID" ]; then
    APPLY_DATA='{
        "jobId": '$JOB_ID',
        "coverLetter": "This is a test application submitted via API test script.",
        "expectedRate": 85,
        "availableDate": "2025-01-20"
    }'
    
    APPLY_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$APPLY_DATA" \
        "$BASE_URL/api/v1/applications")
    
    APPLY_STATUS=$(echo $APPLY_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$APPLY_STATUS" -eq 201 ]; then
        print_success "Job application successful"
        APPLICATION_ID=$(echo $APPLY_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq -r '.application.id')
        print_success "Application ID: $APPLICATION_ID"
    else
        print_error "Job application failed with status $APPLY_STATUS"
        echo $APPLY_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
    fi
else
    print_warning "Skipping job application test - missing auth token or job ID"
fi

print_test "GET MY APPLICATIONS"
if [ ! -z "$AUTH_TOKEN" ]; then
    MY_APPS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/applications/my")
    
    MY_APPS_STATUS=$(echo $MY_APPS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$MY_APPS_STATUS" -eq 200 ]; then
        print_success "Get my applications successful"
        APP_COUNT=$(echo $MY_APPS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.applications | length')
        print_success "Found $APP_COUNT applications"
    else
        print_error "Get my applications failed with status $MY_APPS_STATUS"
    fi
else
    print_warning "Skipping my applications test - no auth token"
fi

print_test "GET JOB APPLICATIONS (RECRUITER)"
if [ ! -z "$AUTH_TOKEN" ] && [ ! -z "$JOB_ID" ]; then
    JOB_APPS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/applications/for-job/$JOB_ID")
    
    JOB_APPS_STATUS=$(echo $JOB_APPS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$JOB_APPS_STATUS" -eq 200 ]; then
        print_success "Get job applications successful"
        JOB_APP_COUNT=$(echo $JOB_APPS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g' | jq '.applications | length')
        print_success "Found $JOB_APP_COUNT applications for job"
    else
        print_error "Get job applications failed with status $JOB_APPS_STATUS"
        echo $JOB_APPS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
    fi
else
    print_warning "Skipping job applications test - missing auth token or job ID"
fi

print_test "UPDATE APPLICATION STATUS"
if [ ! -z "$AUTH_TOKEN" ] && [ ! -z "$APPLICATION_ID" ]; then
    UPDATE_STATUS_DATA='{
        "status": "reviewed",
        "notes": "Application reviewed via API test"
    }'
    
    UPDATE_STATUS_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "$UPDATE_STATUS_DATA" \
        "$BASE_URL/api/v1/applications/$APPLICATION_ID/status")
    
    UPDATE_STATUS_STATUS=$(echo $UPDATE_STATUS_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$UPDATE_STATUS_STATUS" -eq 200 ]; then
        print_success "Update application status successful"
    else
        print_error "Update application status failed with status $UPDATE_STATUS_STATUS"
        echo $UPDATE_STATUS_RESPONSE | sed -e 's/HTTPSTATUS:.*//g'
    fi
else
    print_warning "Skipping application status update test - missing auth token or application ID"
fi

# =============================================================================
# DATA EXPORT ENDPOINTS
# =============================================================================

print_test "GET FILTER OPTIONS"
if [ ! -z "$AUTH_TOKEN" ]; then
    FILTER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/applications/filter-options")
    
    FILTER_STATUS=$(echo $FILTER_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$FILTER_STATUS" -eq 200 ]; then
        print_success "Get filter options successful"
    else
        print_error "Get filter options failed with status $FILTER_STATUS"
    fi
else
    print_warning "Skipping filter options test - no auth token"
fi

print_test "EXPORT USER DATA"
if [ ! -z "$AUTH_TOKEN" ]; then
    EXPORT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/data-export/my-data")
    
    EXPORT_STATUS=$(echo $EXPORT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$EXPORT_STATUS" -eq 200 ]; then
        print_success "Export user data successful"
    else
        print_error "Export user data failed with status $EXPORT_STATUS"
    fi
else
    print_warning "Skipping data export test - no auth token"
fi

# =============================================================================
# CLEANUP AND LOGOUT
# =============================================================================

print_test "USER LOGOUT"
if [ ! -z "$AUTH_TOKEN" ]; then
    LOGOUT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/auth/logout")
    
    LOGOUT_STATUS=$(echo $LOGOUT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$LOGOUT_STATUS" -eq 200 ]; then
        print_success "User logout successful"
    else
        print_error "User logout failed with status $LOGOUT_STATUS"
    fi
else
    print_warning "Skipping logout test - no auth token"
fi

# Clean up created job if needed
if [ ! -z "$AUTH_TOKEN" ] && [ ! -z "$CREATED_JOB_ID" ]; then
    print_test "CLEANUP: DELETE CREATED JOB"
    DELETE_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X DELETE \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/api/v1/jobs/$CREATED_JOB_ID")
    
    DELETE_STATUS=$(echo $DELETE_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$DELETE_STATUS" -eq 200 ]; then
        print_success "Cleanup: Test job deleted"
    else
        print_warning "Cleanup: Could not delete test job (status $DELETE_STATUS)"
    fi
fi

echo -e "\n${BLUE}=== API TEST SUITE COMPLETE ===${NC}"
echo "All endpoints tested against: $BASE_URL"