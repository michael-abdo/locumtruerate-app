#!/bin/bash

# Test the new auth endpoints

API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"
TEST_EMAIL="auth_test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"

echo "Testing Auth Endpoints: /verify and /refresh"
echo "==========================================="

# 1. Register a new user
echo -e "\n1. Registering new user..."
REGISTER=$(curl -s -X POST "$API_BASE_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"firstName\": \"Auth\",
        \"lastName\": \"Test\",
        \"role\": \"locum\"
    }")

echo "Register response:"
echo "$REGISTER" | jq .

# 2. Login to get token
echo -e "\n2. Logging in..."
LOGIN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

AUTH_TOKEN=$(echo "$LOGIN" | jq -r '.token')
echo "Login response:"
echo "$LOGIN" | jq .

# 3. Test /auth/verify
echo -e "\n3. Testing GET /auth/verify..."
VERIFY=$(curl -s -X GET "$API_BASE_URL/auth/verify" \
    -H "Authorization: Bearer $AUTH_TOKEN")

echo "Verify response:"
echo "$VERIFY" | jq .

# Check if verify was successful
if echo "$VERIFY" | grep -q '"valid":true'; then
    echo "✓ Token verification successful"
else
    echo "✗ Token verification failed"
fi

# 4. Test /auth/refresh
echo -e "\n4. Testing POST /auth/refresh..."
REFRESH=$(curl -s -X POST "$API_BASE_URL/auth/refresh" \
    -H "Authorization: Bearer $AUTH_TOKEN")

echo "Refresh response:"
echo "$REFRESH" | jq .

# Check if refresh was successful
if echo "$REFRESH" | grep -q '"token"'; then
    NEW_TOKEN=$(echo "$REFRESH" | jq -r '.token')
    echo "✓ Token refresh successful"
    echo "New token obtained: ${NEW_TOKEN:0:20}..."
    
    # 5. Verify the new token works
    echo -e "\n5. Verifying new token..."
    VERIFY_NEW=$(curl -s -X GET "$API_BASE_URL/auth/verify" \
        -H "Authorization: Bearer $NEW_TOKEN")
    
    echo "New token verify response:"
    echo "$VERIFY_NEW" | jq .
    
    if echo "$VERIFY_NEW" | grep -q '"valid":true'; then
        echo "✓ New token is valid"
    else
        echo "✗ New token verification failed"
    fi
else
    echo "✗ Token refresh failed"
fi

echo -e "\n==========================================="
echo "Auth endpoint tests complete!"