#!/bin/bash

# Test minimal application creation

# First, let's test if the database connection works
echo "Testing database connection..."
curl -s "https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1/auth/health" | jq .

# Get the existing test user token from our earlier test
echo -e "\nGetting auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "debug_1753755012@example.com",
        "password": "TestPass123!"
    }')

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$AUTH_TOKEN" = "null" ] || [ -z "$AUTH_TOKEN" ]; then
    echo "Failed to get auth token"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi

echo "Auth token obtained"

# Try creating an application with absolute minimal data
echo -e "\nCreating minimal application..."
APP_RESPONSE=$(curl -s -X POST "https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1/applications" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "job_id": 1,
        "applicant_name": "Test User",
        "applicant_email": "test@example.com",
        "privacy_policy_accepted": true,
        "terms_accepted": true
    }')

echo "Application response:"
echo "$APP_RESPONSE" | jq .