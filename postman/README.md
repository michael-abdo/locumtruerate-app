# LocumTrueRate API Testing Guide

## Overview

This directory contains Postman collections and testing tools for the LocumTrueRate API. The collection includes comprehensive testing for all 26 endpoints with automatic token management, response validation, and error case testing.

## Files

- `LocumTrueRate_API_Collection.json` - Complete Postman collection with all 26 API endpoints
- `LocumTrueRate_Environment.json` - Environment variables for local development
- `test-with-newman.sh` - Automated test runner script with Newman
- `reports/` - Test execution reports (generated after running tests)
- `README.md` - This testing guide

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
- **GET /health** - Health check
- **GET /api/v1** - API information

### 2. Authentication (4 endpoints)
- **POST /api/v1/auth/register** - User registration
- **POST /api/v1/auth/login** - Login (saves token automatically)
- **GET /api/v1/auth/me** - Get current user
- **POST /api/v1/auth/logout** - Logout

### 3. Jobs (5 endpoints)
- **GET /api/v1/jobs** - List jobs with filters
- **GET /api/v1/jobs/:id** - Get job by ID
- **POST /api/v1/jobs** - Create job (requires auth)
- **PUT /api/v1/jobs/:id** - Update job (requires auth + ownership)
- **DELETE /api/v1/jobs/:id** - Delete job (requires auth + ownership)

### 4. Applications (8 endpoints)
- **POST /api/v1/applications** - Apply to job
- **GET /api/v1/applications/my** - Get my applications
- **GET /api/v1/applications/for-job/:jobId** - Get applications for job (recruiters)
- **GET /api/v1/applications/search** - Search applications
- **PUT /api/v1/applications/:id/status** - Update application status
- **DELETE /api/v1/applications/:id** - Withdraw application
- **GET /api/v1/applications/filter-options** - Get filter options

### 5. Calculators (5 endpoints)
- **POST /api/v1/calculate/contract** - Contract calculator
- **POST /api/v1/calculate/paycheck** - Paycheck calculator
- **POST /api/v1/calculate/simple-paycheck** - Simple paycheck calculator
- **GET /api/v1/calculate/tax-info** - Tax information
- **GET /api/v1/calculate/states** - States list

### 6. GDPR Data Export (3 endpoints)
- **GET /api/v1/data-export/my-data** - Export my data (JSON/CSV)
- **GET /api/v1/data-export/privacy-summary** - Privacy summary
- **GET /api/v1/data-export/request-deletion** - Request deletion info

## Environment Variables

The environment file includes:
- `baseUrl` - API base URL (default: http://localhost:4000)
- `apiVersion` - API version (default: v1)
- `authToken` - JWT token (automatically set after login)
- `testEmail` - Test user email (frontend.test@example.com)
- `testPassword` - Test user password (TestPass123!)
- `testJobId` - Test job ID (automatically set from job list)
- `createdJobId` - Created job ID (automatically set after job creation)
- `testApplicationId` - Test application ID (automatically set after application)

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
- Verify port 4000 is accessible

### Authentication Errors
- Run the Login request to get a fresh token
- Tokens expire after 24 hours
- Check that test credentials are correct

### Test Failures
- Check `reports/` for detailed error messages
- Verify test data exists in the database
- Some tests may fail if run multiple times (e.g., duplicate applications)

### Newman Issues
- If Newman fails to install globally, try local installation:
  ```bash
  npm install newman
  npx newman run LocumTrueRate_API_Collection.json -e LocumTrueRate_Environment.json
  ```

## Error Testing

The collection includes error case testing:

### Validation Errors (400)
- Invalid input data
- Missing required fields
- Out-of-range values

### Authentication Errors (401)
- Missing or invalid tokens
- Expired tokens
- Unauthorized access

### Authorization Errors (403)
- Attempting to modify others' data
- Role-based access violations

### Not Found Errors (404)
- Non-existent resources
- Deleted resources

### Server Errors (500)
- Database connection issues
- Internal server errors

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

## Performance Testing

The test script includes:
- Request delays (100ms between requests)
- Timeouts (10s request, 5s script)
- Error handling and retry logic

## Security Testing

Validation includes:
- JWT token validation
- Authorization checks
- Input sanitization verification
- CORS policy testing

## Documentation

For complete API documentation, see:
- `API_DOCS.md` - Comprehensive endpoint documentation
- Collection descriptions - Inline documentation for each endpoint
- Environment notes - Variable usage and setup instructions

## Reporting

Newman generates:
- **HTML Reports**: Detailed visual reports with request/response data
- **JUnit XML**: CI/CD compatible test results
- **CLI Output**: Real-time test execution feedback

Reports are timestamped and stored in `reports/` directory.

## Support

For issues with the API testing:
1. Check this README for common solutions
2. Review the generated reports for specific error details
3. Verify API server logs for backend issues
4. Test individual endpoints manually to isolate problems