#!/bin/bash

# Quick test of calculation creation

API_BASE_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com/api/v1"

# Get auth token
LOGIN=$(curl -s -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "auth_test_1753757856@example.com",
        "password": "TestPass123!"
    }')

AUTH_TOKEN=$(echo "$LOGIN" | jq -r '.token')

# Test calculation creation
echo "Testing calculation creation..."
CALC_RESPONSE=$(curl -s -X POST "$API_BASE_URL/calculations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "calculation_type": "paycheck",
        "title": "API Test Calculation",
        "hourly_rate": 250,
        "hours_per_week": 40,
        "regular_hours": 40,
        "regular_rate": 250,
        "overtime_hours": 0,
        "overtime_rate": 375,
        "gross_pay": 10000,
        "federal_tax": 2200,
        "state_tax": 600,
        "fica_tax": 765,
        "net_pay": 6435,
        "housing_stipend": 3000,
        "meal_stipend": 1000,
        "travel_reimbursement": 500
    }')

echo "Response:"
echo "$CALC_RESPONSE" | jq .