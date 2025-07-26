# API Client Curl Examples

These curl commands demonstrate the API endpoints that the frontend client uses.

## Prerequisites

Make sure the API server is running:
```bash
npm start
```

## 1. Authentication Flow

### Register a new user
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "password": "DemoPass123!",
    "firstName": "Demo",
    "lastName": "User",
    "role": "locum"
  }'
```

### Login and get token
```bash
# Login and save token to variable
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "password123"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

echo "Token: $TOKEN"
```

### Get current user info
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Logout
```bash
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## 2. Jobs API (Public)

### List all jobs
```bash
curl http://localhost:4000/api/v1/jobs
```

### Search jobs with filters
```bash
# Search for jobs in California with hourly rate between $150-$300
curl "http://localhost:4000/api/v1/jobs?state=CA&minRate=150&maxRate=300&limit=5"
```

### Get specific job
```bash
curl http://localhost:4000/api/v1/jobs/1
```

### Create a job (requires auth as recruiter)
```bash
# First login as recruiter to get token
RECRUITER_TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "recruiter@example.com",
    "password": "RecruiterPass123"
  }' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Create job
curl -X POST http://localhost:4000/api/v1/jobs \
  -H "Authorization: Bearer $RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Emergency Medicine Physician",
    "location": "Los Angeles, CA",
    "state": "CA",
    "hourlyRateMin": 250,
    "hourlyRateMax": 350,
    "specialty": "Emergency Medicine",
    "description": "Urgent need for experienced EM physician",
    "requirements": ["Board certified", "Active CA license"],
    "companyName": "LA Medical Center"
  }'
```

## 3. Calculator API (Public)

### Contract Calculator
```bash
curl -X POST http://localhost:4000/api/v1/calculate/contract \
  -H "Content-Type: application/json" \
  -d '{
    "hourlyRate": 200,
    "hoursPerWeek": 40,
    "weeksPerYear": 48,
    "state": "CA",
    "expenseRate": 0.15
  }' | python3 -m json.tool
```

### Paycheck Calculator
```bash
curl -X POST http://localhost:4000/api/v1/calculate/paycheck \
  -H "Content-Type: application/json" \
  -d '{
    "regularHours": 40,
    "regularRate": 200,
    "overtimeHours": 10,
    "overtimeRate": 300,
    "state": "TX",
    "period": "weekly"
  }' | python3 -m json.tool
```

### Get Tax Info
```bash
curl http://localhost:4000/api/v1/calculate/tax-info | python3 -m json.tool
```

### Get States List
```bash
curl http://localhost:4000/api/v1/calculate/states | python3 -m json.tool
```

## 4. Applications API (Auth Required)

### Apply to a job
```bash
curl -X POST http://localhost:4000/api/v1/applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 1,
    "coverLetter": "I am very interested in this position...",
    "expectedRate": 275,
    "availableDate": "2025-02-01",
    "notes": "Available for immediate start"
  }'
```

### Get my applications
```bash
curl http://localhost:4000/api/v1/applications/my \
  -H "Authorization: Bearer $TOKEN"
```

### Search my applications
```bash
curl "http://localhost:4000/api/v1/applications/search?status=pending&state=CA" \
  -H "Authorization: Bearer $TOKEN"
```

### Get filter options
```bash
curl http://localhost:4000/api/v1/applications/filter-options \
  -H "Authorization: Bearer $TOKEN"
```

## 5. GDPR Data Export (Auth Required)

### Export my data as JSON
```bash
curl "http://localhost:4000/api/v1/data-export/my-data?format=json" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

### Export my data as CSV
```bash
curl "http://localhost:4000/api/v1/data-export/my-data?format=csv" \
  -H "Authorization: Bearer $TOKEN" > my-data.csv
```

### Get privacy summary
```bash
curl http://localhost:4000/api/v1/data-export/privacy-summary \
  -H "Authorization: Bearer $TOKEN"
```

## 6. Testing Frontend Integration

### Complete workflow test
```bash
# 1. Health check
curl -s http://localhost:4000/health | grep "ok"

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"password123"}' \
  | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# 3. Get jobs
curl -s http://localhost:4000/api/v1/jobs?limit=3 | grep "jobs"

# 4. Calculate contract
curl -s -X POST http://localhost:4000/api/v1/calculate/contract \
  -H "Content-Type: application/json" \
  -d '{"hourlyRate":250,"hoursPerWeek":40,"weeksPerYear":48,"state":"CA","expenseRate":0.15}' \
  | grep "annual"

# 5. Get user applications
curl -s http://localhost:4000/api/v1/applications/my \
  -H "Authorization: Bearer $TOKEN" | grep "applications"

echo "All tests passed!"
```

## 7. Error Testing

### Test 401 Unauthorized
```bash
curl -i http://localhost:4000/api/v1/applications/my
```

### Test 400 Bad Request
```bash
curl -i -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid-email"}'
```

### Test 404 Not Found
```bash
curl -i http://localhost:4000/api/v1/jobs/99999
```

## Frontend Demo

After testing these endpoints, you can see them in action in the browser:

```bash
# Option 1: Direct file access
open vanilla-demos-only/api-client-demo.html

# Option 2: Serve with Python
cd vanilla-demos-only
python3 serve-demo.py

# Then visit: http://localhost:8080/api-client-demo.html
```

The demo shows how the JavaScript API client handles all these endpoints with proper error handling, loading states, and user feedback.