#!/bin/bash

echo "=== Job Board API Integration Test ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check API Server
echo "1. Testing API Server..."
if curl -s http://localhost:4000/api/v1/jobs | grep -q "jobs"; then
    echo -e "${GREEN}✓ API Server is running and returning jobs${NC}"
else
    echo -e "${RED}✗ API Server not responding${NC}"
    exit 1
fi

# Test 2: Check Frontend Server
echo ""
echo "2. Testing Frontend Server..."
if curl -s http://localhost:3000/frontend/job-board.html | grep -q "USE_API_MODE"; then
    echo -e "${GREEN}✓ Frontend server is running${NC}"
else
    echo -e "${RED}✗ Frontend server not responding${NC}"
    exit 1
fi

# Test 3: Check CORS
echo ""
echo "3. Testing CORS Configuration..."
CORS_HEADER=$(curl -s -H "Origin: http://localhost:3000" -I http://localhost:4000/api/v1/jobs | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓ CORS is properly configured: $CORS_HEADER${NC}"
else
    echo -e "${RED}✗ CORS not configured${NC}"
fi

# Test 4: Check Authentication Endpoint
echo ""
echo "4. Testing Authentication Endpoint..."
if curl -s http://localhost:4000/api/v1/auth/register | grep -q "error"; then
    echo -e "${GREEN}✓ Auth endpoint is responding (expected error for empty POST)${NC}"
else
    echo -e "${RED}✗ Auth endpoint not responding${NC}"
fi

# Test 5: Check Job Structure
echo ""
echo "5. Checking API Job Data Structure..."
SAMPLE_JOB=$(curl -s http://localhost:4000/api/v1/jobs | jq '.jobs[0]')
echo "Sample job structure:"
echo "$SAMPLE_JOB" | jq '{id, title, location, hourlyRateMin, hourlyRateMax, specialty, state}'

# Test 6: Check Frontend Integration
echo ""
echo "6. Checking Frontend API Integration..."
if curl -s http://localhost:3000/frontend/job-board.html | grep -q "apiClient.js"; then
    echo -e "${GREEN}✓ API Client script is loaded${NC}"
else
    echo -e "${RED}✗ API Client script not found${NC}"
fi

if curl -s http://localhost:3000/frontend/job-board.html | grep -q "USE_API_MODE = true"; then
    echo -e "${GREEN}✓ API Mode is ENABLED${NC}"
else
    echo -e "${RED}✗ API Mode is DISABLED${NC}"
fi

echo ""
echo "=== Integration Test Complete ==="
echo ""
echo "To test in browser:"
echo "1. Open http://localhost:3000/frontend/job-board.html"
echo "2. Jobs should load from API automatically"
echo "3. Click 'Apply Now' to test authentication"
echo "4. Filters should work with API"