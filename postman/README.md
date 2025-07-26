# LocumTrueRate API Testing Guide

## Overview

This directory contains Postman collections and testing tools for the LocumTrueRate API.

## Files

- `LocumTrueRate_API_Collection.json` - Complete Postman collection with all 26 API endpoints
- `LocumTrueRate_Environment.json` - Environment variables for local development
- `test-with-newman.sh` - Automated test runner script
- `reports/` - Test execution reports (generated after running tests)

## Quick Start

### Option 1: Using Postman Desktop

1. Open Postman
2. Import the collection: Click "Import" → Select `LocumTrueRate_API_Collection.json`
3. Import the environment: Click "Import" → Select `LocumTrueRate_Environment.json`
4. Select "LocumTrueRate Development" from the environment dropdown
5. Run the "Login" request first to get an auth token
6. Run any other requests - the token is automatically included

### Option 2: Using Newman (CLI)

1. Install Newman globally:
   ```bash
   npm install -g newman
   ```

2. Run all tests:
   ```bash
   ./test-with-newman.sh
   ```

3. View results in `reports/` directory

### Option 3: Manual Testing

Use the included test script from the project root:
```bash
./test-all-endpoints.sh
```

## Test Coverage

The collection includes tests for:

### 1. Health & Info (2 endpoints)
- Health check
- API information

### 2. Authentication (4 endpoints)
- User registration
- Login (saves token automatically)
- Get current user
- Logout

### 3. Jobs (5 endpoints)
- List jobs with filters
- Get job by ID
- Create job (requires auth)
- Update job (requires auth + ownership)
- Delete job (requires auth + ownership)

### 4. Applications (8 endpoints)
- Apply to job
- Get my applications
- Get applications for job (recruiters)
- Search applications
- Update application status
- Withdraw application
- Filter options

### 5. Calculators (5 endpoints)
- Contract calculator
- Paycheck calculator
- Simple paycheck calculator
- Tax information
- States list

### 6. GDPR Data Export (3 endpoints)
- Export my data (JSON/CSV)
- Privacy summary
- Request deletion info

## Environment Variables

The environment file includes:
- `baseUrl` - API base URL (default: http://localhost:4000)
- `apiVersion` - API version (default: v1)
- `authToken` - JWT token (automatically set after login)
- `testEmail` - Test user email
- `testPassword` - Test user password

## Writing New Tests

Each request includes Postman tests. Example:

```javascript
// Check status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Check response structure
pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success', true);
    pm.expect(jsonData).to.have.property('data');
});

// Save data for later use
pm.environment.set("lastJobId", jsonData.data.job.id);
```

## Troubleshooting

### Connection Refused
- Ensure the API server is running: `npm start`
- Check the baseUrl in environment variables

### Authentication Errors
- Run the Login request to get a fresh token
- Tokens expire after 24 hours

### Test Failures
- Check `reports/` for detailed error messages
- Verify test data exists in the database
- Some tests may fail if run multiple times (e.g., duplicate applications)

## CI/CD Integration

To run tests in CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: |
    npm install -g newman
    newman run postman/LocumTrueRate_API_Collection.json \
      -e postman/LocumTrueRate_Environment.json \
      --reporters cli,junit \
      --reporter-junit-export results.xml
```