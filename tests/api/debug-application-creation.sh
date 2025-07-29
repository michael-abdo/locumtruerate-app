#!/bin/bash

# Debug application creation

API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"
TEST_EMAIL="debug_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"

echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Debug\",
        \"lastName\": \"User\",
        \"role\": \"locum\"
    }")

echo "Register response:"
echo "$REGISTER_RESPONSE" | jq .

echo -e "\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

echo "Login response:"
echo "$LOGIN_RESPONSE" | jq .

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')
echo -e "\nAuth token: $AUTH_TOKEN"

echo -e "\n3. Getting jobs..."
JOBS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/jobs?limit=1")
echo "Jobs response:"
echo "$JOBS_RESPONSE" | jq .

JOB_ID=$(echo "$JOBS_RESPONSE" | jq -r '.jobs[0].id')
echo -e "\nJob ID: $JOB_ID"

echo -e "\n4. Creating application with verbose output..."
FUTURE_DATE=$(date -d "+30 days" '+%Y-%m-%d' 2>/dev/null || date -v+30d '+%Y-%m-%d')

curl -v -X POST "$API_BASE_URL/applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "{
        \"job_id\": $JOB_ID,
        \"applicant_name\": \"Debug User\",
        \"applicant_email\": \"$TEST_EMAIL\",
        \"cover_letter\": \"Debug application\",
        \"availability_start\": \"$FUTURE_DATE\",
        \"hourly_rate_expectation\": 250,
        \"privacy_policy_accepted\": true,
        \"terms_accepted\": true
    }" 2>&1