#!/bin/bash

# Test script for Applications API endpoints
# This script tests all CRUD operations and advanced features for the applications API

# Configuration
BASE_URL="http://localhost:4000/api/v1"
HEROKU_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
USE_HEROKU=${1:-false}
if [ "$USE_HEROKU" = "true" ]; then
    API_BASE_URL=$HEROKU_URL
    echo -e "${BLUE}Testing against Heroku staging: $HEROKU_URL${NC}"
else
    API_BASE_URL=$BASE_URL
    echo -e "${BLUE}Testing against local server: $BASE_URL${NC}"
fi

# Global variables
AUTH_TOKEN=""
USER_EMAIL="locum@example.com"
USER_PASSWORD="password123"
APPLICATION_ID=""
JOB_ID="1"  # Assuming job with ID 1 exists

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to make API requests with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$headers" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -H "$headers" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "HTTP Status: $http_code"
    echo "Response: $body"
    echo ""
    
    return $http_code
}

# Test 1: Health Check
test_health_check() {
    print_header "Health Check"
    
    response=$(curl -s "${API_BASE_URL%/api/v1}/health")
    if echo "$response" | grep -q '"status":"ok"'; then
        print_success "Health check passed"
    else
        print_error "Health check failed"
        echo "Response: $response"
    fi
}

# Test 2: Authentication (Login)
test_authentication() {
    print_header "Authentication - Login"
    
    login_data='{
        "email": "'$USER_EMAIL'",
        "password": "'$USER_PASSWORD'"
    }'
    
    response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        "$API_BASE_URL/auth/login")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ]; then
        AUTH_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        if [ -n "$AUTH_TOKEN" ]; then
            print_success "Authentication successful"
            echo "Token obtained: ${AUTH_TOKEN:0:20}..."
        else
            print_error "Authentication failed - no token received"
            echo "Response: $body"
            exit 1
        fi
    else
        print_error "Authentication failed - HTTP $http_code"
        echo "Response: $body"
        exit 1
    fi
}

# Test 3: Create Application
test_create_application() {
    print_header "Create Application"
    
    application_data='{
        "job_id": '$JOB_ID',
        "applicant_name": "Dr. Jane Smith",
        "applicant_email": "jane.smith@example.com",
        "applicant_phone": "+1-555-0123",
        "cover_letter": "Dear Hiring Manager,\n\nI am writing to express my strong interest in this locum tenens position. With over 8 years of experience in emergency medicine, I am confident in my ability to provide exceptional patient care.\n\nSincerely,\nDr. Jane Smith",
        "resume_text": "Dr. Jane Smith, MD\nEmergency Medicine Physician\n\nEXPERIENCE:\n- 2016-Present: Emergency Medicine Physician, City General Hospital\n- 2014-2016: Emergency Medicine Resident, Metro Medical Center\n\nEDUCATION:\n- 2014: MD, State University School of Medicine\n- 2010: BS Biology, State University",
        "additional_notes": "I have experience with Epic EMR and am comfortable working in fast-paced environments.",
        "availability_start": "2025-09-01",  
        "availability_end": "2025-12-01",
        "salary_expectation": 200000,
        "hourly_rate_expectation": 120,
        "preferred_location": "California, Nevada, Arizona",
        "willing_to_relocate": true,
        "years_experience": 8,
        "specialty": "Emergency Medicine",
        "board_certifications": ["American Board of Emergency Medicine", "ACLS", "PALS"],
        "licenses": ["CA Medical License #CA12345", "DEA #BC1234567"],
        "source": "company_website",
        "consent_to_contact": true,
        "privacy_policy_accepted": true,
        "terms_accepted": true
    }'
    
    make_request "POST" "/applications" "$application_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 201 ]; then
        APPLICATION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        print_success "Application created successfully (ID: $APPLICATION_ID)"
    else
        print_error "Failed to create application"
    fi
}

# Test 4: Get All Applications
test_get_all_applications() {
    print_header "Get All Applications"
    
    make_request "GET" "/applications?page=1&limit=10" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        count=$(echo "$body" | grep -o '"id":[0-9]*' | wc -l)
        print_success "Retrieved applications successfully (Count: $count)"
    else
        print_error "Failed to retrieve applications"
    fi
}

# Test 5: Get Specific Application
test_get_application() {
    print_header "Get Specific Application"
    
    if [ -n "$APPLICATION_ID" ]; then
        make_request "GET" "/applications/$APPLICATION_ID" "" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Retrieved specific application successfully"
        else
            print_error "Failed to retrieve specific application"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 6: Update Application
test_update_application() {
    print_header "Update Application"
    
    if [ -n "$APPLICATION_ID" ]; then
        update_data='{
            "cover_letter": "Updated cover letter: I am very excited about this opportunity and believe my skills would be a great fit.",
            "salary_expectation": 210000,
            "additional_notes": "Updated: I am also available for additional shifts if needed."
        }'
        
        make_request "PUT" "/applications/$APPLICATION_ID" "$update_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Application updated successfully"
        else
            print_error "Failed to update application"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 7: Update Application Status
test_update_status() {
    print_header "Update Application Status"
    
    if [ -n "$APPLICATION_ID" ]; then
        status_data='{
            "application_status": "under_review",
            "status_change_reason": "Application meets initial requirements",
            "status_notes": "Moving to review stage for further evaluation"
        }'
        
        make_request "PATCH" "/applications/$APPLICATION_ID/status" "$status_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Application status updated successfully"
        else
            print_error "Failed to update application status"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 8: Add Document to Application
test_add_document() {
    print_header "Add Document to Application"
    
    if [ -n "$APPLICATION_ID" ]; then
        document_data='{
            "document_type": "resume",
            "file_name": "jane_smith_resume.pdf",
            "file_path": "/uploads/applications/'$APPLICATION_ID'/jane_smith_resume.pdf",
            "file_size": 245760,
            "mime_type": "application/pdf"
        }'
        
        make_request "POST" "/applications/$APPLICATION_ID/documents" "$document_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 201 ]; then
            print_success "Document added successfully"
        else
            print_error "Failed to add document"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 9: Add Communication
test_add_communication() {
    print_header "Add Communication Record"
    
    if [ -n "$APPLICATION_ID" ]; then
        communication_data='{
            "communication_type": "email",
            "direction": "outbound",
            "to_email": "hr@hospital.com",
            "subject": "Application for Emergency Medicine Position",
            "message_body": "Thank you for considering my application. I look forward to hearing from you."
        }'
        
        make_request "POST" "/applications/$APPLICATION_ID/communications" "$communication_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 201 ]; then
            print_success "Communication record added successfully"
        else
            print_error "Failed to add communication record"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 10: Add Reminder
test_add_reminder() {
    print_header "Add Reminder"
    
    if [ -n "$APPLICATION_ID" ]; then
        reminder_data='{
            "reminder_type": "follow_up",
            "title": "Follow up on Emergency Medicine application",
            "description": "Send follow-up email if no response received within one week",
            "due_date": "2025-08-15T10:00:00Z"
        }'
        
        make_request "POST" "/applications/$APPLICATION_ID/reminders" "$reminder_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 201 ]; then
            print_success "Reminder added successfully"
        else
            print_error "Failed to add reminder"
        fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Test 11: Get Application Statistics
test_get_statistics() {
    print_header "Get Application Statistics"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$API_BASE_URL/applications/stats")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "HTTP Status: $http_code"
    echo "Response: $body"
    echo ""
    
    if [ "$http_code" = "200" ]; then
        print_success "Statistics retrieved successfully"
    else
        print_error "Failed to retrieve statistics"
    fi
}

# Test 12: Get Applications by Status
test_get_by_status() {
    print_header "Get Applications by Status"
    
    make_request "GET" "/applications/by-status/submitted?limit=10" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        print_success "Applications by status retrieved successfully"
    else
        print_error "Failed to retrieve applications by status"
    fi
}

# Test 13: Get Recent Applications
test_get_recent() {
    print_header "Get Recent Applications"
    
    make_request "GET" "/applications/recent?days=30&limit=5" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        print_success "Recent applications retrieved successfully"
    else
        print_error "Failed to retrieve recent applications"
    fi
}

# Test 14: Advanced Search
test_advanced_search() {
    print_header "Advanced Search"
    
    search_data='{
        "search": "Emergency",
        "statuses": ["submitted", "under_review"],
        "min_experience": 5,
        "willing_to_relocate": true,
        "page": 1,
        "limit": 10
    }'
    
    make_request "POST" "/applications/search" "$search_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        print_success "Advanced search completed successfully"
    else
        print_error "Failed to perform advanced search"
    fi
}

# Test 15: Validation Tests
test_validation_errors() {
    print_header "Validation Error Tests"
    
    # Test missing required field
    invalid_data='{
        "job_id": '$JOB_ID',
        "applicant_email": "test@example.com"
    }'
    
    make_request "POST" "/applications" "$invalid_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 400 ]; then
        print_success "Validation error test passed (missing required field)"
    else
        print_error "Validation error test failed"
    fi
    
    # Test invalid status
    if [ -n "$APPLICATION_ID" ]; then
        invalid_status='{
            "application_status": "invalid_status"
        }'
        
        make_request "PATCH" "/applications/$APPLICATION_ID/status" "$invalid_status" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 400 ]; then
            print_success "Validation error test passed (invalid status)"
        else
            print_error "Validation error test failed"
        fi
    fi
}

# Test 16: Unauthorized Access
test_unauthorized_access() {
    print_header "Unauthorized Access Test"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "Content-Type: application/json" \
        "$API_BASE_URL/applications")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    echo "HTTP Status: $http_code"
    echo "Response: $body"
    echo ""
    
    if [ "$http_code" = "401" ]; then
        print_success "Unauthorized access properly blocked"
    else
        print_error "Unauthorized access test failed"
    fi
}

# Test 17: Delete Application (Optional - commented out to preserve data)
test_delete_application() {
    print_header "Delete Application (Optional)"
    
    if [ -n "$APPLICATION_ID" ]; then
        print_warning "Skipping delete test to preserve test data"
        print_warning "To test delete: curl -X DELETE $API_BASE_URL/applications/$APPLICATION_ID -H \"Authorization: Bearer $AUTH_TOKEN\""
        
        # Uncomment below to actually test delete
        # make_request "DELETE" "/applications/$APPLICATION_ID" "" "Authorization: Bearer $AUTH_TOKEN"
        # 
        # if [ $? -eq 200 ]; then
        #     print_success "Application deleted successfully"
        # else
        #     print_error "Failed to delete application"
        # fi
    else
        print_warning "Skipping - no application ID available"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}Starting Applications API Test Suite${NC}"
    echo "Testing against: $API_BASE_URL"
    echo ""
    
    # Run all tests
    test_health_check
    test_authentication
    test_unauthorized_access
    test_create_application
    test_get_all_applications
    test_get_application
    test_update_application
    test_update_status
    test_add_document
    test_add_communication
    test_add_reminder
    test_get_statistics
    test_get_by_status
    test_get_recent
    test_advanced_search
    test_validation_errors
    test_delete_application
    
    print_header "Test Suite Completed"
    echo -e "${GREEN}All tests have been executed. Check the results above.${NC}"
    echo ""
    echo -e "${BLUE}Summary:${NC}"
    echo "- Application ID created: $APPLICATION_ID"
    echo "- Job ID used for testing: $JOB_ID"
    echo "- API Base URL: $API_BASE_URL"
}

# Run the main function
main