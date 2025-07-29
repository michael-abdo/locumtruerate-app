#!/bin/bash

# Test GET /applications/:id

API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"

# Get auth token
LOGIN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "auth_test_1753757856@example.com",
        "password": "TestPass123!"
    }')

AUTH_TOKEN=$(echo "$LOGIN" | jq -r '.token')

# Create an application first
echo "Creating application..."
APP_RESPONSE=$(curl -s -X POST "$API_BASE_URL/applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "job_id": 1,
        "applicant_name": "Test User",
        "applicant_email": "test@example.com",
        "privacy_policy_accepted": true,
        "terms_accepted": true
    }')

echo "Create response:"
echo "$APP_RESPONSE" | jq .

APP_ID=$(echo "$APP_RESPONSE" | jq -r '.data.id')
echo "Application ID: $APP_ID"

# Now try to get it by ID
echo -e "\nGetting application by ID..."
GET_RESPONSE=$(curl -s -X GET "$API_BASE_URL/applications/$APP_ID" \
    -H "Authorization: Bearer $AUTH_TOKEN")

echo "Get response:"
echo "$GET_RESPONSE" | jq .