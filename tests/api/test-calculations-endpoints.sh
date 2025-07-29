#!/bin/bash

# Test script for Calculations API endpoints
# This script tests all CRUD operations for the calculations API

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
CALCULATION_ID=""

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
    
    response=$(curl -s "$API_BASE_URL/../health")
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

# Test 3: Create Paycheck Calculation
test_create_paycheck_calculation() {
    print_header "Create Paycheck Calculation"
    
    paycheck_data='{
        "calculation_type": "paycheck",
        "title": "Test Paycheck Calculation",
        "description": "Testing paycheck calculator API",
        "hourly_rate": 85.00,
        "regular_hours": 40,
        "regular_rate": 85.00,
        "overtime_hours": 8,
        "overtime_rate": 127.50,
        "call_hours": 0,
        "call_rate": 25.00,
        "housing_stipend": 1200,
        "meal_stipend": 300,
        "pay_period": "weekly",
        "tax_state": "no-tax",
        "filing_status": "single",
        "gross_pay": 4420.00,
        "net_pay": 3200.00,
        "true_hourly_rate": 95.50,
        "notes": "Test calculation for API"
    }'
    
    make_request "POST" "/calculations" "$paycheck_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 201 ]; then
        CALCULATION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        print_success "Paycheck calculation created successfully (ID: $CALCULATION_ID)"
    else
        print_error "Failed to create paycheck calculation"
    fi
}

# Test 4: Create Contract Calculation
test_create_contract_calculation() {
    print_header "Create Contract Calculation"
    
    contract_data='{
        "calculation_type": "contract",
        "title": "Test Contract Calculation",
        "description": "Testing contract calculator API",
        "hourly_rate": 300.00,
        "hours_per_week": 40,
        "contract_weeks": 13,
        "contract_type": "locum",
        "housing_stipend": 1500,
        "travel_reimbursement": 2000,
        "other_stipends": 500,
        "work_state": "CA",
        "total_contract_value": 171000.00,
        "true_hourly_rate": 325.00,
        "annual_equivalent": 676000.00,
        "notes": "Test contract calculation"
    }'
    
    make_request "POST" "/calculations" "$contract_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 201 ]; then
        print_success "Contract calculation created successfully"
    else
        print_error "Failed to create contract calculation"
    fi
}

# Test 5: Get All Calculations
test_get_all_calculations() {
    print_header "Get All Calculations"
    
    make_request "GET" "/calculations" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        count=$(echo "$body" | grep -o '"id":[0-9]*' | wc -l)
        print_success "Retrieved calculations successfully (Count: $count)"
    else
        print_error "Failed to retrieve calculations"
    fi
}

# Test 6: Get Specific Calculation
test_get_calculation() {
    print_header "Get Specific Calculation"
    
    if [ -n "$CALCULATION_ID" ]; then
        make_request "GET" "/calculations/$CALCULATION_ID" "" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Retrieved specific calculation successfully"
        else
            print_error "Failed to retrieve specific calculation"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 7: Update Calculation
test_update_calculation() {
    print_header "Update Calculation"
    
    if [ -n "$CALCULATION_ID" ]; then
        update_data='{
            "title": "Updated Test Calculation",
            "hourly_rate": 90.00,
            "notes": "Updated via API test"
        }'
        
        make_request "PUT" "/calculations/$CALCULATION_ID" "$update_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Calculation updated successfully"
        else
            print_error "Failed to update calculation"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 8: Toggle Favorite
test_toggle_favorite() {
    print_header "Toggle Favorite Status"
    
    if [ -n "$CALCULATION_ID" ]; then
        make_request "PATCH" "/calculations/$CALCULATION_ID/favorite" "" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Favorite status toggled successfully"
        else
            print_error "Failed to toggle favorite status"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 9: Duplicate Calculation
test_duplicate_calculation() {
    print_header "Duplicate Calculation"
    
    if [ -n "$CALCULATION_ID" ]; then
        duplicate_data='{
            "title": "Duplicated Test Calculation"
        }'
        
        make_request "POST" "/calculations/$CALCULATION_ID/duplicate" "$duplicate_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 201 ]; then
            print_success "Calculation duplicated successfully"
        else
            print_error "Failed to duplicate calculation"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 10: Archive Calculation
test_archive_calculation() {
    print_header "Archive Calculation"
    
    if [ -n "$CALCULATION_ID" ]; then
        archive_data='{
            "archived": true
        }'
        
        make_request "PATCH" "/calculations/$CALCULATION_ID/archive" "$archive_data" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Calculation archived successfully"
        else
            print_error "Failed to archive calculation"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 11: Get Statistics
test_get_statistics() {
    print_header "Get Calculation Statistics"
    
    make_request "GET" "/calculations/stats" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        print_success "Statistics retrieved successfully"
    else
        print_error "Failed to retrieve statistics"
    fi
}

# Test 12: Query with Filters
test_query_with_filters() {
    print_header "Query with Filters"
    
    make_request "GET" "/calculations?calculation_type=paycheck&limit=5&page=1" "" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 200 ]; then
        print_success "Filtered query successful"
    else
        print_error "Failed to execute filtered query"
    fi
}

# Test 13: Delete Calculation
test_delete_calculation() {
    print_header "Delete Calculation"
    
    if [ -n "$CALCULATION_ID" ]; then
        print_warning "This will delete the test calculation. Proceeding..."
        
        make_request "DELETE" "/calculations/$CALCULATION_ID" "" "Authorization: Bearer $AUTH_TOKEN"
        
        if [ $? -eq 200 ]; then
            print_success "Calculation deleted successfully"
        else
            print_error "Failed to delete calculation"
        fi
    else
        print_warning "Skipping - no calculation ID available"
    fi
}

# Test 14: Validation Tests
test_validation_errors() {
    print_header "Validation Error Tests"
    
    # Test invalid calculation type
    invalid_data='{
        "calculation_type": "invalid_type",
        "hourly_rate": 85.00
    }'
    
    make_request "POST" "/calculations" "$invalid_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 400 ]; then
        print_success "Validation error test passed (invalid calculation type)"
    else
        print_error "Validation error test failed"
    fi
    
    # Test missing required field
    missing_data='{
        "calculation_type": "paycheck"
    }'
    
    make_request "POST" "/calculations" "$missing_data" "Authorization: Bearer $AUTH_TOKEN"
    
    if [ $? -eq 400 ]; then
        print_success "Validation error test passed (missing required field)"
    else
        print_error "Validation error test failed"
    fi
}

# Test 15: Unauthorized Access
test_unauthorized_access() {
    print_header "Unauthorized Access Test"
    
    make_request "GET" "/calculations" "" ""
    
    if [ $? -eq 401 ]; then
        print_success "Unauthorized access properly blocked"
    else
        print_error "Unauthorized access test failed"
    fi
}

# Main test execution
main() {
    echo -e "${BLUE}Starting Calculations API Test Suite${NC}"
    echo "Testing against: $API_BASE_URL"
    echo ""
    
    # Run all tests
    test_health_check
    test_authentication
    test_unauthorized_access
    test_create_paycheck_calculation
    test_create_contract_calculation
    test_get_all_calculations
    test_get_calculation
    test_update_calculation
    test_toggle_favorite
    test_duplicate_calculation
    test_get_statistics
    test_query_with_filters
    test_validation_errors
    test_archive_calculation
    test_delete_calculation
    
    print_header "Test Suite Completed"
    echo -e "${GREEN}All tests have been executed. Check the results above.${NC}"
}

# Run the main function
main