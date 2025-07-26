#!/bin/bash

# Quick API test for frontend integration
echo "Quick API Test for Frontend Integration"
echo "======================================"

# Test if server is running
echo -n "1. Checking if API server is running... "
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✓ Yes"
else
    echo "✗ No"
    echo ""
    echo "Please start the API server first:"
    echo "  npm start"
    echo ""
    exit 1
fi

# Test API endpoints
echo -n "2. Testing API info endpoint... "
if curl -s http://localhost:4000/api/v1 | grep -q "LocumTrueRate API"; then
    echo "✓ Working"
else
    echo "✗ Failed"
fi

# Test jobs endpoint (no auth required)
echo -n "3. Testing jobs endpoint... "
JOBS_RESPONSE=$(curl -s http://localhost:4000/api/v1/jobs?limit=2)
if echo "$JOBS_RESPONSE" | grep -q '"jobs"'; then
    echo "✓ Working"
    JOB_COUNT=$(echo "$JOBS_RESPONSE" | grep -o '"id"' | wc -l)
    echo "   Found $JOB_COUNT jobs in response"
else
    echo "✗ Failed"
fi

# Test calculator endpoint (no auth required)
echo -n "4. Testing calculator endpoint... "
CALC_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/calculate/contract \
    -H "Content-Type: application/json" \
    -d '{"hourlyRate":200,"hoursPerWeek":40,"weeksPerYear":48,"state":"CA","expenseRate":0.15}')

if echo "$CALC_RESPONSE" | grep -q "success"; then
    echo "✓ Working"
    # Extract some key values
    ANNUAL=$(echo "$CALC_RESPONSE" | grep -o '"annual":[^,}]*' | head -1 | sed 's/.*://;s/[^0-9.]//g')
    NET=$(echo "$CALC_RESPONSE" | grep -o '"takeHomeRate":[^,}]*' | sed 's/.*://;s/[^0-9.]//g')
    echo "   Annual gross: \$$ANNUAL"
    echo "   Take-home rate: $NET%"
else
    echo "✗ Failed"
fi

echo ""
echo "Frontend Demo Instructions:"
echo "=========================="
echo "1. Open in browser:"
echo "   file://$PWD/vanilla-demos-only/api-client-demo.html"
echo ""
echo "2. Or serve locally:"
echo "   cd vanilla-demos-only && python3 serve-demo.py"
echo "   Then visit: http://localhost:8080/api-client-demo.html"
echo ""
echo "3. Test credentials:"
echo "   Email: john.doe@example.com"
echo "   Password: password123"
echo ""