#!/bin/bash

# Test all API endpoints after DRY refactoring

BASE_URL="http://localhost:4001"
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
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')
echo ""

if [ -z "$TOKEN" ]; then
  echo "Registration failed, trying login with demo user..."
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
echo "3. Jobs - List (public):"
curl -s "${BASE_URL}/api/v1/jobs" | jq '.jobs | length' | xargs -I {} echo "Found {} jobs"
echo ""

echo "4. Jobs - List with filters:"
curl -s "${BASE_URL}/api/v1/jobs?specialty=Emergency&state=CA&page=1&limit=5" | jq '.pagination'
echo ""

echo "5. Jobs - Get by ID:"
curl -s "${BASE_URL}/api/v1/jobs/1" | jq '.job.id // "Not found"'
echo ""

echo "6. Jobs - Invalid ID:"
curl -s "${BASE_URL}/api/v1/jobs/invalid" | jq '.error'
echo ""

echo "7. Jobs - Invalid query param:"
curl -s "${BASE_URL}/api/v1/jobs?invalid=param" | jq '.error'
echo ""

# Protected jobs endpoints
echo "8. Jobs - Create (requires auth):"
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
echo "9. Applications - My Applications:"
curl -s "${BASE_URL}/api/v1/applications/my" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Result: {}"
echo ""

echo "10. Applications - Filter Options:"
curl -s "${BASE_URL}/api/v1/applications/filter-options" \
  -H "Authorization: Bearer ${TOKEN}" | jq 'keys // .error'
echo ""

echo "11. Applications - Create:"
curl -s -X POST "${BASE_URL}/api/v1/applications" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "coverLetter": "I am interested in this position.",
    "expectedRate": 150
  }' | jq '.message // .error'
echo ""

echo "12. Applications - Search:"
curl -s "${BASE_URL}/api/v1/applications/search?search=medicine" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Found {} applications"
echo ""

echo "13. Applications - For Job:"
curl -s "${BASE_URL}/api/v1/applications/for-job/1" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.applications | length // .error' | xargs -I {} echo "Found {} applications for job"
echo ""

# Data export endpoints
echo "14. Data Export - My Data:"
curl -s "${BASE_URL}/api/v1/data-export/my-data?format=json" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.exportMetadata // .error'
echo ""

echo "15. Data Export - Invalid Format:"
curl -s "${BASE_URL}/api/v1/data-export/my-data?format=invalid" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.error'
echo ""

echo "16. Data Export - Privacy Summary:"
curl -s "${BASE_URL}/api/v1/data-export/privacy-summary" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.privacySummary.dataTypes // .error'
echo ""

# Auth endpoints
echo "17. Auth - Me:"
curl -s "${BASE_URL}/api/v1/auth/me" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.user.email // .error'
echo ""

echo "18. Auth - Logout:"
curl -s -X POST "${BASE_URL}/api/v1/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.message // .error'
echo ""

echo ""
echo "===== ENDPOINT TESTING COMPLETE ====="