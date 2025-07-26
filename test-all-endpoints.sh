#!/bin/bash

# Test all API endpoints after DRY refactoring

BASE_URL="http://localhost:4000"
TIMESTAMP=$(date +%s)
TEST_EMAIL="testuser${TIMESTAMP}@example.com"
TEST_PASS="TestPass123"

echo "===== TESTING ALL API ENDPOINTS ====="
echo "Base URL: $BASE_URL"
echo ""

# Health check
echo "1. Health Check:"
curl -s "${BASE_URL}/health" | jq . || echo "FAILED"
echo ""

# Auth endpoints
echo "2. Auth - Register:"
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASS}\",\"firstName\":\"Test\",\"lastName\":\"User\",\"role\":\"locum\"}")
echo "$REGISTER_RESPONSE" | jq .
echo ""

echo "3. Auth - Login with new user:"
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASS}\"}")
echo "$LOGIN_RESPONSE" | jq .
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
echo ""

if [ -z "$TOKEN" ]; then
  echo "Login failed, trying with demo user..."
  LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"john.doe@example.com","password":"password123"}')
  echo "$LOGIN_RESPONSE" | jq .
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
fi

if [ -z "$TOKEN" ]; then
  echo "No auth token available. Some tests will fail."
  TOKEN="no-token"
fi

echo "Using token: ${TOKEN:0:20}..."
echo ""

# Jobs endpoints (public)
echo "4. Jobs - List (public):"
curl -s "${BASE_URL}/api/v1/jobs" | jq '.jobs | length' | xargs -I {} echo "Found {} jobs"
echo ""

echo "5. Jobs - List with filters:"
curl -s "${BASE_URL}/api/v1/jobs?specialty=Emergency&state=CA&page=1&limit=5" | jq '.pagination'
echo ""

echo "6. Jobs - Get by ID:"
curl -s "${BASE_URL}/api/v1/jobs/1" | jq '.job.id // "Not found"'
echo ""

echo "7. Jobs - Invalid ID:"
curl -s "${BASE_URL}/api/v1/jobs/invalid" | jq '.error'
echo ""

echo "8. Jobs - Invalid query param:"
curl -s "${BASE_URL}/api/v1/jobs?invalid=param" | jq '.error'
echo ""

# Protected jobs endpoints
echo "9. Jobs - Create (requires auth):"
curl -s -X POST "${BASE_URL}/api/v1/jobs" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Physician",
    "location": "Test City",
    "state": "CA",
    "specialty": "Internal Medicine",
    "description": "Test job description",
    "hourlyRateMin": 100,
    "hourlyRateMax": 200
  }' | jq '.message // .error'
echo ""

# Application endpoints (all require auth)
echo "10. Applications - My Applications:"
curl -s "${BASE_URL}/api/v1/applications/my" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Result: {}"
echo ""

echo "11. Applications - Filter Options:"
curl -s "${BASE_URL}/api/v1/applications/filter-options" \
  -H "Authorization: Bearer ${TOKEN}" | jq 'keys // .error'
echo ""

echo "12. Applications - Create:"
curl -s -X POST "${BASE_URL}/api/v1/applications" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "coverLetter": "I am interested in this position.",
    "expectedRate": 150
  }' | jq '.message // .error'
echo ""

echo "13. Applications - Search:"
curl -s "${BASE_URL}/api/v1/applications/search?search=medicine" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Found {} applications"
echo ""

echo "14. Applications - For Job:"
curl -s "${BASE_URL}/api/v1/applications/for-job/1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Found {} applications for job"
echo ""

# Data export endpoints
echo "15. Data Export - My Data:"
curl -s "${BASE_URL}/api/v1/data-export/my-data?format=json" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.exportMetadata // .error'
echo ""

echo "16. Data Export - Invalid Format:"
curl -s "${BASE_URL}/api/v1/data-export/my-data?format=invalid" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.error'
echo ""

echo "17. Data Export - Privacy Summary:"
curl -s "${BASE_URL}/api/v1/data-export/privacy-summary" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.privacySummary.dataTypes // .error'
echo ""

# Calculator endpoints (public)
echo "18. Calculator - Contract Calculation:"
curl -s -X POST "${BASE_URL}/api/v1/calculate/contract" \
  -H "Content-Type: application/json" \
  -d '{
    "hourlyRate": 150,
    "hoursPerWeek": 40,
    "weeksPerYear": 50,
    "state": "CA",
    "expenseRate": 0.15
  }' | jq '.success, .data.gross.annual, .data.net.annual'
echo ""

echo "19. Calculator - Paycheck Calculation:"
curl -s -X POST "${BASE_URL}/api/v1/calculate/paycheck" \
  -H "Content-Type: application/json" \
  -d '{
    "regularHours": 40,
    "regularRate": 150,
    "overtimeHours": 10,
    "overtimeRate": 225,
    "state": "CA",
    "period": "weekly"
  }' | jq '.success, .data.summary.netPay, .data.summary.effectiveTaxRate'
echo ""

echo "20. Calculator - Simple Paycheck:"
curl -s -X POST "${BASE_URL}/api/v1/calculate/simple-paycheck" \
  -H "Content-Type: application/json" \
  -d '{
    "grossPay": 8000,
    "additionalDeductions": 500,
    "state": "CA",
    "period": "monthly"
  }' | jq '.success, .data.grossPay, .data.netPay'
echo ""

echo "21. Calculator - Tax Info:"
curl -s "${BASE_URL}/api/v1/calculate/tax-info" | jq '.success, (.data.federalTaxBrackets | length), .data.ficaRates.socialSecurity.rate'
echo ""

echo "22. Calculator - States List:"
curl -s "${BASE_URL}/api/v1/calculate/states" | jq '.success, .data.count, (.data.states | map(select(.code == "CA" or .code == "TX")) | length)'
echo ""

echo "23. Calculator - Validation Error:"
curl -s -X POST "${BASE_URL}/api/v1/calculate/contract" \
  -H "Content-Type: application/json" \
  -d '{"hourlyRate": -50}' | jq '.error, .message'
echo ""

# API Info
echo "24. API Info - Endpoint List:"
curl -s "${BASE_URL}/api/v1" | jq '.endpoints | keys | length' | xargs -I {} echo "Total endpoints documented: {}"
echo ""

# Auth endpoints
echo "25. Auth - Me:"
curl -s "${BASE_URL}/api/v1/auth/me" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.user.email // .error'
echo ""

echo "26. Auth - Logout:"
curl -s -X POST "${BASE_URL}/api/v1/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.message // .error'
echo ""

echo ""
echo "===== ENDPOINT TESTING COMPLETE ====="
echo "Tested 26 endpoints across 6 categories:"
echo "- Health (1)"
echo "- Authentication (4)" 
echo "- Jobs (5)"
echo "- Applications (8)"
echo "- Calculator (5)"
echo "- Data Export (3)"