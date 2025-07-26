# LocumTrueRate API Documentation

## Overview

The LocumTrueRate API provides comprehensive functionality for managing locum tenens job postings, applications, contract calculations, and user data. This RESTful API uses JSON for data exchange and JWT tokens for authentication.

**Base URL**: `http://localhost:4000/api/v1`  
**Production URL**: `https://api.locumtruerate.com/api/v1` (when deployed)

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens expire after 24 hours and must be refreshed by logging in again.

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

### Error Response
```json
{
  "error": "error_type",
  "message": "Human-readable error message",
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 1000 requests per minute per user
- **Calculator endpoints**: No rate limiting (public access)

## Endpoints

### 1. Health & Information

#### Health Check
```http
GET /health
```

Check if the API server is running and healthy.

**Response:**
```json
{
  "status": "ok",
  "service": "locumtruerate-api",
  "version": "v1",
  "timestamp": "2025-07-26T12:00:00.000Z",
  "environment": "development"
}
```

#### API Information
```http
GET /api/v1
```

Get information about available endpoints.

**Response:**
```json
{
  "message": "LocumTrueRate API",
  "version": "v1",
  "endpoints": {
    "health": "/health",
    "auth": "/api/v1/auth",
    "jobs": "/api/v1/jobs",
    "applications": "/api/v1/applications",
    "calculate": "/api/v1/calculate",
    "dataExport": "/api/v1/data-export"
  }
}
```

### 2. Authentication

#### Register
```http
POST /api/v1/auth/register
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "locum"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "locum"
  },
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

#### Login
```http
POST /api/v1/auth/login
```

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "locum"
  },
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
```

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "locum",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
```

Invalidate the current token.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "message": "Logout successful",
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

### 3. Jobs

#### List Jobs
```http
GET /api/v1/jobs
```

Get paginated list of active job postings.

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `state` (string): Filter by state (e.g., "CA", "TX")
- `specialty` (string): Filter by specialty
- `minRate` (number): Minimum hourly rate
- `maxRate` (number): Maximum hourly rate
- `search` (string): Search in title, description, location
- `sortBy` (string): Sort field (default: "created_at")
- `sortOrder` (string): "ASC" or "DESC" (default: "DESC")

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "title": "Internal Medicine Physician",
        "location": "Los Angeles, CA",
        "state": "CA",
        "specialty": "Internal Medicine",
        "hourlyRateMin": 200,
        "hourlyRateMax": 300,
        "description": "Seeking experienced physician...",
        "requirements": ["Board certified", "Active license"],
        "companyName": "LA Medical Center",
        "status": "active",
        "createdAt": "2025-07-20T00:00:00.000Z",
        "poster": {
          "id": 2,
          "name": "Jane Recruiter",
          "email": "recruiter@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### Get Job by ID
```http
GET /api/v1/jobs/:id
```

Get detailed information about a specific job.

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "title": "Internal Medicine Physician",
      "location": "Los Angeles, CA",
      "state": "CA",
      "specialty": "Internal Medicine",
      "hourlyRateMin": 200,
      "hourlyRateMax": 300,
      "description": "Full job description...",
      "requirements": ["Board certified", "Active license", "3+ years experience"],
      "benefits": ["Malpractice insurance", "Travel reimbursement"],
      "companyName": "LA Medical Center",
      "status": "active",
      "createdAt": "2025-07-20T00:00:00.000Z",
      "updatedAt": "2025-07-20T00:00:00.000Z",
      "poster": {
        "id": 2,
        "name": "Jane Recruiter",
        "email": "recruiter@example.com",
        "company": "MedStaff Solutions"
      }
    }
  }
}
```

#### Create Job
```http
POST /api/v1/jobs
```

Create a new job posting (recruiters only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Emergency Medicine Physician",
  "location": "Austin, TX",
  "state": "TX",
  "hourlyRateMin": 250,
  "hourlyRateMax": 350,
  "specialty": "Emergency Medicine",
  "description": "Seeking board-certified emergency physician...",
  "requirements": [
    "Board certified in Emergency Medicine",
    "Active Texas medical license",
    "ACLS/BLS certified"
  ],
  "benefits": [
    "Competitive hourly rates",
    "Flexible scheduling",
    "Travel expenses covered"
  ],
  "companyName": "Austin Emergency Associates"
}
```

#### Update Job
```http
PUT /api/v1/jobs/:id
```

Update an existing job posting (owner only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:** (partial update supported)
```json
{
  "hourlyRateMin": 275,
  "hourlyRateMax": 375,
  "description": "Updated description..."
}
```

#### Delete Job
```http
DELETE /api/v1/jobs/:id
```

Delete a job posting (owner only).

**Headers:** `Authorization: Bearer <token>`

### 4. Applications

#### Apply to Job
```http
POST /api/v1/applications
```

Submit an application for a job.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "jobId": 1,
  "coverLetter": "I am interested in this position...",
  "expectedRate": 275,
  "availableDate": "2025-02-01",
  "notes": "Available for immediate start"
}
```

**Response:**
```json
{
  "message": "Application submitted successfully",
  "applicationId": 123,
  "timestamp": "2025-07-26T12:00:00.000Z"
}
```

#### Get My Applications
```http
GET /api/v1/applications/my
```

Get authenticated user's applications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (integer): Page number
- `limit` (integer): Items per page
- `status` (string): Filter by status (pending, reviewed, accepted, rejected, withdrawn)
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort direction

#### Get Applications for Job
```http
GET /api/v1/applications/for-job/:jobId
```

Get all applications for a specific job (job owner only).

**Headers:** `Authorization: Bearer <token>`

#### Search Applications
```http
GET /api/v1/applications/search
```

Search through user's applications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `search` (string): Search term
- `status` (string): Filter by status
- `specialty` (string): Filter by job specialty
- `state` (string): Filter by job state
- `dateFrom` (string): Start date filter
- `dateTo` (string): End date filter

#### Update Application Status
```http
PUT /api/v1/applications/:id/status
```

Update application status (recruiter only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "reviewed",
  "notes": "Strong candidate, scheduling interview"
}
```

#### Withdraw Application
```http
DELETE /api/v1/applications/:id
```

Withdraw an application (applicant only).

**Headers:** `Authorization: Bearer <token>`

### 5. Calculators

#### Contract Calculator
```http
POST /api/v1/calculate/contract
```

Calculate contract earnings with tax estimates.

**Request Body:**
```json
{
  "hourlyRate": 250,
  "hoursPerWeek": 40,
  "weeksPerYear": 48,
  "state": "CA",
  "expenseRate": 0.15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "input": {
      "hourlyRate": 250,
      "hoursPerWeek": 40,
      "weeksPerYear": 48,
      "state": "CA",
      "expenseRate": 0.15
    },
    "gross": {
      "hourly": 250,
      "weekly": 10000,
      "monthly": 40000,
      "annual": 480000
    },
    "taxes": {
      "federal": {
        "amount": 154789.50,
        "rate": 32.25,
        "marginalRate": 35
      },
      "state": {
        "amount": 44640,
        "rate": 9.3
      },
      "fica": {
        "socialSecurity": 10453.20,
        "medicare": 6960,
        "additionalMedicare": 2700,
        "total": 20113.20
      },
      "totalTaxes": 219542.70,
      "effectiveRate": 45.74
    },
    "businessExpenses": {
      "rate": 15,
      "amount": 39068.41
    },
    "net": {
      "afterTaxes": 260457.30,
      "afterExpenses": 221388.89,
      "monthly": 18449.07,
      "weekly": 4612.27,
      "takeHomeRate": 46.12
    }
  }
}
```

#### Paycheck Calculator
```http
POST /api/v1/calculate/paycheck
```

Calculate detailed paycheck breakdown.

**Request Body:**
```json
{
  "regularHours": 40,
  "regularRate": 250,
  "overtimeHours": 10,
  "overtimeRate": 375,
  "state": "TX",
  "period": "weekly"
}
```

#### Simple Paycheck Calculator
```http
POST /api/v1/calculate/simple-paycheck
```

Calculate basic paycheck with standard deductions.

**Request Body:**
```json
{
  "grossPay": 10000,
  "additionalDeductions": 500,
  "state": "NY",
  "period": "monthly"
}
```

#### Get Tax Information
```http
GET /api/v1/calculate/tax-info
```

Get current federal tax brackets and FICA rates.

#### Get States List
```http
GET /api/v1/calculate/states
```

Get all US states with their tax rates.

### 6. GDPR Data Export

#### Export My Data
```http
GET /api/v1/data-export/my-data
```

Export all user data for GDPR compliance.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `format` (string): "json" or "csv"
- `includeHistory` (boolean): Include historical data
- `dateFrom` (string): Start date filter
- `dateTo` (string): End date filter

#### Privacy Summary
```http
GET /api/v1/data-export/privacy-summary
```

Get privacy policy and data processing information.

**Headers:** `Authorization: Bearer <token>`

#### Request Data Deletion
```http
GET /api/v1/data-export/request-deletion
```

Get information about the data deletion process.

**Headers:** `Authorization: Bearer <token>`

## Error Codes

| Code | Type | Description |
|------|------|-------------|
| 400 | validation_error | Invalid input data |
| 401 | authentication_failed | Missing or invalid token |
| 403 | authorization_error | Insufficient permissions |
| 404 | not_found | Resource not found |
| 409 | duplicate_entry | Resource already exists |
| 429 | rate_limit_exceeded | Too many requests |
| 500 | server_error | Internal server error |

## Testing

### Using cURL

```bash
# Health check
curl http://localhost:4000/health

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Get jobs with authentication
curl http://localhost:4000/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman

1. Import the collection: `postman/LocumTrueRate_API_Collection.json`
2. Import the environment: `postman/LocumTrueRate_Environment.json`
3. Run the Login request to get a token
4. The token will be automatically saved for subsequent requests

### Using Newman (CLI)

```bash
cd postman
./test-with-newman.sh
```

## Performance Metrics

- Average response time: < 200ms
- 99th percentile: < 500ms
- Concurrent connections: 500+
- Requests per second: 1000+

## Support

For API support, please contact:
- Email: api-support@locumtruerate.com
- Documentation: https://docs.locumtruerate.com
- Status Page: https://status.locumtruerate.com