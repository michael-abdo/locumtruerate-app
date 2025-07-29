#!/bin/bash

# Test with different job IDs

API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"
TEST_EMAIL="unique_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"

echo "1. Creating fresh user..."
REGISTER=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Unique\",
        \"lastName\": \"Test\",
        \"role\": \"locum\"
    }")

echo "$REGISTER" | jq .

echo -e "\n2. Logging in..."
LOGIN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

AUTH_TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo "Token obtained"

# Try different job IDs
for JOB_ID in 1 2 3 4 5 6; do
    echo -e "\n3. Trying to apply to job $JOB_ID..."
    FUTURE_DATE=$(date -d "+30 days" '+%Y-%m-%d' 2>/dev/null || date -v+30d '+%Y-%m-%d')
    
    APP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/applications" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d "{
            \"job_id\": $JOB_ID,
            \"applicant_name\": \"Unique Test\",
            \"applicant_email\": \"$TEST_EMAIL\",
            \"cover_letter\": \"Test application for job $JOB_ID\",
            \"availability_start\": \"$FUTURE_DATE\",
            \"hourly_rate_expectation\": 250,
            \"privacy_policy_accepted\": true,
            \"terms_accepted\": true
        }")
    
    if echo "$APP_RESPONSE" | grep -q "success"; then
        echo "✓ Success! Application created for job $JOB_ID"
        echo "$APP_RESPONSE" | jq .
        break
    else
        echo "✗ Failed for job $JOB_ID"
        echo "$APP_RESPONSE" | jq .
    fi
done