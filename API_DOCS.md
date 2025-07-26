# LocumTrueRate API Documentation

## Overview

The LocumTrueRate API is a comprehensive RESTful API for a locum tenens job board platform. It provides authentication, job management, application tracking, salary calculations, and GDPR compliance features.

**Base URL**: `http://localhost:4000`  
**API Version**: `v1`  
**Authentication**: JWT Bearer Token  

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Info Endpoints](#health--info-endpoints)
3. [Authentication Endpoints](#authentication-endpoints)
4. [Jobs Endpoints](#jobs-endpoints)
5. [Applications Endpoints](#applications-endpoints)
6. [Calculator Endpoints](#calculator-endpoints)
7. [GDPR Data Export Endpoints](#gdpr-data-export-endpoints)
8. [Error Response Format](#error-response-format)
9. [Rate Limiting](#rate-limiting)
10. [Changelog](#changelog)

---

## Authentication

Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens expire after 24 hours and must be refreshed by logging in again.

---

## Health & Info Endpoints

### GET /health

Basic health check to verify API is running.

**Authentication**: None required

**Response**:
```json
{
  "status": "ok",
  "service": "locumtruerate-api",
  "version": "v1",
  "timestamp": "2025-07-26T16:27:00.000Z",
  "environment": "development"
}
```

### GET /api/v1

Get API information and available endpoints.

**Authentication**: None required

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "LocumTrueRate API",
    "version": "v1",
    "description": "API for locum tenens job board platform",
    "endpoints": [
      "/api/v1/auth/*",
      "/api/v1/jobs/*",
      "/api/v1/applications/*",
      "/api/v1/calculate/*",
      "/api/v1/data-export/*"
    ]
  }
}
```

---

## Authentication Endpoints

### POST /api/v1/auth/register

Register a new user account.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-123-4567",
  "role": "locum"
}
```

**Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "locum"
  },
  "timestamp": "2025-07-26T16:27:00.000Z"
}
```

### POST /api/v1/auth/login

Login user and receive JWT token.

**Authentication**: None required

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "locum"
    }
  },
  "message": "Login successful",
  "timestamp": "2025-07-26T16:27:00.000Z"
}
```

### GET /api/v1/auth/me

Get current authenticated user information.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "locum",
      "phone": "555-123-4567",
      "createdAt": "2025-07-01T00:00:00.000Z"
    }
  }
}
```

### POST /api/v1/auth/logout

Logout user and invalidate token.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2025-07-26T16:27:00.000Z"
}
```

---

## Jobs Endpoints

### GET /api/v1/jobs

Get list of jobs with optional filtering and pagination.

**Authentication**: None required

**Query Parameters**:
- `page` (number, default: 1) - Page number for pagination
- `limit` (number, default: 20, max: 100) - Items per page
- `search` (string) - Search in job titles and descriptions
- `specialty` (string) - Filter by medical specialty
- `state` (string) - Filter by state (2-letter code)
- `minRate` (number) - Minimum hourly rate
- `maxRate` (number) - Maximum hourly rate
- `sortBy` (string) - Sort field: created_at, updated_at, hourly_rate_min, title
- `sortOrder` (string) - Sort order: ASC, DESC

**Example Request**:
```
GET /api/v1/jobs?specialty=Emergency%20Medicine&state=CA&minRate=200&page=1&limit=10
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 1,
        "title": "Emergency Medicine Physician",
        "location": "San Francisco, CA",
        "state": "CA",
        "specialty": "Emergency Medicine",
        "description": "Urgent need for experienced ER physician...",
        "hourlyRateMin": 250,
        "hourlyRateMax": 300,
        "duration": "13 weeks",
        "shiftType": "12-hour shifts",
        "companyName": "SF General Hospital",
        "status": "active",
        "requirements": ["Board certified", "ACLS"],
        "postedBy": {
          "id": 456,
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "createdAt": "2025-07-15T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### GET /api/v1/jobs/:id

Get single job by ID with full details.

**Authentication**: None required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 1,
      "title": "Emergency Medicine Physician",
      "location": "San Francisco, CA",
      "state": "CA",
      "specialty": "Emergency Medicine",
      "description": "Detailed job description here...",
      "hourlyRateMin": 250,
      "hourlyRateMax": 300,
      "duration": "13 weeks",
      "shiftType": "12-hour shifts",
      "companyName": "SF General Hospital",
      "status": "active",
      "requirements": ["Board certified", "ACLS"],
      "startDate": "2025-08-01",
      "endDate": "2025-10-31",
      "postedBy": {
        "id": 456,
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@hospital.com"
      },
      "createdAt": "2025-07-15T00:00:00.000Z",
      "updatedAt": "2025-07-15T00:00:00.000Z"
    }
  }
}
```

### POST /api/v1/jobs

Create a new job posting.

**Authentication**: Required

**Request Body**:
```json
{
  "title": "Emergency Medicine Physician",
  "location": "San Francisco, CA",
  "state": "CA",
  "specialty": "Emergency Medicine",
  "description": "Urgent need for experienced ER physician...",
  "hourlyRateMin": 250,
  "hourlyRateMax": 300,
  "duration": "13 weeks",
  "shiftType": "12-hour shifts",
  "companyName": "SF General Hospital",
  "requirements": ["Board certified", "ACLS"],
  "startDate": "2025-08-01",
  "endDate": "2025-10-31"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 123,
      "title": "Emergency Medicine Physician",
      "location": "San Francisco, CA",
      "state": "CA",
      "specialty": "Emergency Medicine",
      "description": "Urgent need for experienced ER physician...",
      "hourlyRateMin": 250,
      "hourlyRateMax": 300,
      "status": "active",
      "postedBy": 789,
      "createdAt": "2025-07-26T16:27:00.000Z"
    }
  },
  "message": "Job created successfully"
}
```

### PUT /api/v1/jobs/:id

Update an existing job posting.

**Authentication**: Required (must be job owner)

**Request Body** (partial updates allowed):
```json
{
  "title": "Emergency Medicine Physician - Updated",
  "hourlyRateMax": 320,
  "description": "Updated job description..."
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 123,
      "title": "Emergency Medicine Physician - Updated",
      "hourlyRateMax": 320,
      "updatedAt": "2025-07-26T16:27:00.000Z"
    }
  },
  "message": "Job updated successfully"
}
```

---

## Applications Endpoints

### POST /api/v1/applications

Apply to a job posting.

**Authentication**: Required

**Request Body**:
```json
{
  "jobId": 123,
  "coverLetter": "I am very interested in this position...",
  "expectedRate": 275,
  "availableDate": "2025-08-01",
  "notes": "Flexible with scheduling"
}
```

**Response** (201):
```json
{
  "success": true,
  "data": {
    "application": {
      "id": 456,
      "jobId": 123,
      "userId": 789,
      "status": "pending",
      "coverLetter": "I am very interested in this position...",
      "expectedRate": 275,
      "availableDate": "2025-08-01",
      "notes": "Flexible with scheduling",
      "createdAt": "2025-07-26T16:27:00.000Z"
    }
  },
  "message": "Application submitted successfully"
}
```

### GET /api/v1/applications/my

Get current user's job applications.

**Authentication**: Required

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (string) - Filter by status: pending, reviewed, accepted, rejected

**Response** (200):
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 456,
        "status": "pending",
        "coverLetter": "I am very interested...",
        "expectedRate": 275,
        "createdAt": "2025-07-26T16:27:00.000Z",
        "job": {
          "id": 123,
          "title": "Emergency Medicine Physician",
          "location": "San Francisco, CA",
          "hourlyRateMin": 250,
          "hourlyRateMax": 300,
          "companyName": "SF General Hospital"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 15,
      "itemsPerPage": 20
    }
  }
}
```

### GET /api/v1/applications/search

Search user's applications with advanced filters.

**Authentication**: Required

**Query Parameters**:
- `search` (string) - Search in job titles, companies, cover letters
- `status` (string) - Filter by application status
- `specialty` (string) - Filter by job specialty
- `state` (string) - Filter by job state
- `minRate` (number) - Minimum expected rate
- `maxRate` (number) - Maximum expected rate
- `dateFrom` (ISO date) - Applications from date
- `dateTo` (ISO date) - Applications to date
- `page`, `limit`, `sortBy`, `sortOrder` - Pagination and sorting

**Response**: Same format as GET /my applications

### GET /api/v1/applications/filter-options

Get available filter options for applications.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "specialties": ["Emergency Medicine", "Internal Medicine", "Surgery"],
    "states": ["CA", "TX", "FL", "NY"],
    "statuses": ["pending", "reviewed", "accepted", "rejected"],
    "rateRange": {
      "min": 150,
      "max": 500
    }
  }
}
```

---

## Calculator Endpoints

### POST /api/v1/calculate/contract

Calculate contract earnings with taxes and expenses.

**Authentication**: None required

**Request Body**:
```json
{
  "hourlyRate": 200,
  "hoursPerWeek": 40,
  "weeksPerYear": 48,
  "state": "CA",
  "expenseRate": 0.15
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "inputs": {
      "hourlyRate": 200,
      "hoursPerWeek": 40,
      "weeksPerYear": 48,
      "state": "CA",
      "expenseRate": 0.15
    },
    "gross": {
      "annual": 384000,
      "monthly": 32000,
      "weekly": 8000
    },
    "taxes": {
      "federal": 106298.5,
      "state": 35712,
      "fica": {
        "socialSecurity": 9932.4,
        "medicare": 5568,
        "additionalMedicare": 1656,
        "total": 17156.4
      },
      "total": 159166.9
    },
    "afterTax": {
      "annual": 224833.1,
      "monthly": 18736.09,
      "weekly": 4684.02
    },
    "expenses": {
      "businessExpenses": 33725,
      "expenseRate": 0.15
    },
    "net": {
      "annual": 191108,
      "monthly": 15925.67,
      "weekly": 3981.42
    },
    "rates": {
      "effectiveTaxRate": 41.45,
      "effectiveExpenseRate": 15,
      "takeHomeRate": 49.77
    },
    "timestamp": "2025-07-26T16:27:00.000Z",
    "metadata": {
      "calculationType": "contract",
      "disclaimer": "This is an estimate for planning purposes only...",
      "taxYear": 2025
    }
  }
}
```

### POST /api/v1/calculate/paycheck

Calculate comprehensive paycheck with all deductions.

**Authentication**: None required

**Request Body**:
```json
{
  "regularHours": 40,
  "regularRate": 200,
  "overtimeHours": 5,
  "overtimeRate": 300,
  "callHours": 0,
  "callRate": 0,
  "callbackHours": 0,
  "callbackRate": 0,
  "housingStipend": 2000,
  "mealStipend": 500,
  "mileageReimbursement": 0,
  "state": "CA",
  "period": "weekly"
}
```

**Response** (200):
```json
{
  "success": true,
  "data": {
    "inputs": {
      "regularHours": 40,
      "regularRate": 200,
      "overtimeHours": 5,
      "overtimeRate": 300,
      "housingStipend": 2000,
      "mealStipend": 500,
      "state": "CA",
      "period": "weekly"
    },
    "earnings": {
      "regularPay": 8000,
      "overtimePay": 1500,
      "callPay": 0,
      "callbackPay": 0,
      "totalGrossPay": 9500
    },
    "stipends": {
      "housingStipend": 2000,
      "mealStipend": 500,
      "mileageReimbursement": 0,
      "totalStipends": 2500
    },
    "deductions": {
      "federalTax": 2456.73,
      "stateTax": 883.5,
      "fica": {
        "socialSecurity": 589,
        "medicare": 137.75,
        "additionalMedicare": 0,
        "total": 726.75
      },
      "totalDeductions": 4066.98
    },
    "summary": {
      "totalGrossPayIncludingStipends": 12000,
      "netPay": 7933.02,
      "effectiveTaxRate": 42.81,
      "takeHomeRate": 66.11
    },
    "annualized": {
      "grossPay": 494000,
      "netPay": 412516.04,
      "totalDeductions": 211483.96
    }
  }
}
```

### GET /api/v1/calculate/tax-info

Get current tax brackets and rates information.

**Authentication**: None required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "federalTaxBrackets": [
      {"min": 0, "max": 11000, "rate": 0.10},
      {"min": 11000, "max": 44725, "rate": 0.12},
      {"min": 44725, "max": 95375, "rate": 0.22}
    ],
    "ficaRates": {
      "socialSecurity": {"rate": 0.062, "wageBase": 160200},
      "medicare": {"rate": 0.0145, "wageBase": "Infinity"},
      "additionalMedicare": {"rate": 0.009, "threshold": 200000}
    },
    "stateTaxRates": {
      "CA": 0.093,
      "TX": 0.00,
      "FL": 0.00
    },
    "taxYear": 2025,
    "disclaimer": "Tax rates subject to change..."
  }
}
```

### GET /api/v1/calculate/states

Get list of all 50 states with tax rates.

**Authentication**: None required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "states": [
      {"code": "AL", "rate": 0.05, "percentage": "5.0%"},
      {"code": "AK", "rate": 0.00, "percentage": "0.0%"},
      {"code": "CA", "rate": 0.093, "percentage": "9.3%"}
    ],
    "count": 50,
    "notes": {
      "zeroRate": "States with 0% rate have no state income tax",
      "approximation": "Rates are approximations for estimation purposes"
    }
  }
}
```

---

## GDPR Data Export Endpoints

### GET /api/v1/data-export/my-data

Export all user data in JSON or CSV format.

**Authentication**: Required

**Query Parameters**:
- `format` (string, default: json) - Export format: json, csv
- `includeHistory` (boolean, default: true) - Include historical data
- `dateFrom` (ISO date) - Data from date
- `dateTo` (ISO date) - Data to date

**Response** (200):
```json
{
  "success": true,
  "data": {
    "exportData": {
      "user": {
        "id": 123,
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "applications": [
        {
          "id": 456,
          "jobTitle": "Emergency Medicine Physician",
          "status": "pending",
          "appliedAt": "2025-07-26T16:27:00.000Z"
        }
      ],
      "jobs": [],
      "exportMetadata": {
        "exportedAt": "2025-07-26T16:27:00.000Z",
        "format": "json",
        "recordCount": {
          "applications": 15,
          "jobs": 0
        }
      }
    },
    "format": "json",
    "gdprCompliance": {
      "rightToPortability": true,
      "dataMinimization": true,
      "legalBasis": "contract"
    }
  }
}
```

### GET /api/v1/data-export/privacy-summary

Get privacy compliance summary and user rights.

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "data": {
    "dataSummary": {
      "personalData": {
        "accountData": 1,
        "applications": 15,
        "jobs": 0
      },
      "dataProcessing": {
        "purpose": "Provide job board services",
        "legalBasis": "contract",
        "retention": "3 years after account closure"
      }
    },
    "userRights": {
      "access": "Request copy of your data",
      "rectification": "Correct inaccurate data",
      "erasure": "Request deletion of your data",
      "portability": "Export your data",
      "restriction": "Limit processing of your data",
      "objection": "Object to data processing"
    },
    "contact": {
      "dataProtectionOfficer": "privacy@locumtruerate.com",
      "supervisoryAuthority": "Relevant data protection authority"
    }
  }
}
```

---

## Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "specific_field_error"
  },
  "timestamp": "2025-07-26T16:27:00.000Z"
}
```

### Common Error Codes

| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | `validation_error` | Invalid input data |
| 400 | `duplicate_application` | User already applied to this job |
| 401 | `authentication_failed` | Invalid credentials |
| 401 | `token_expired` | JWT token has expired |
| 401 | `token_invalid` | Invalid JWT token |
| 403 | `insufficient_permissions` | User lacks required permissions |
| 404 | `not_found` | Resource not found |
| 409 | `email_exists` | Email already registered |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `internal_error` | Server error |

### Validation Error Example

```json
{
  "success": false,
  "error": "validation_error",
  "message": "Hourly rate must be at least $0.01",
  "details": {
    "field": "hourlyRate",
    "value": -5,
    "constraint": "min: 0.01"
  },
  "timestamp": "2025-07-26T16:27:00.000Z"
}
```

---

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Authenticated users**: 1000 requests per hour
- **Unauthenticated users**: 100 requests per hour
- **Calculator endpoints**: 200 requests per hour per IP

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per hour
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Timestamp when limit resets

---

## API Changelog

### Version 1.0.0 (Current)
- Initial API release
- 26 endpoints across 6 categories
- JWT authentication
- GDPR compliance
- Real-time tax calculations
- Comprehensive search and filtering

### Upcoming Features
- Real-time notifications
- File upload for application documents
- Advanced reporting and analytics
- API versioning with v2 endpoints