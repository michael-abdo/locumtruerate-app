# LocumTrueRate API Documentation

## Overview
Complete REST API documentation for the LocumTrueRate job board platform.

**Base URL**: `http://localhost:4000/api/v1`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`

---

## Authentication Endpoints

### Register User
```http
POST /api/v1/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe", 
  "phone": "555-0123",
  "role": "locum"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-0123",
    "role": "locum"
  },
  "timestamp": "2025-07-25T02:45:23.979Z"
}
```

### Login User
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-0123",
    "role": "locum"
  },
  "timestamp": "2025-07-25T02:45:29.084Z"
}
```

### Get User Profile
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "555-0123",
    "role": "locum",
    "specialty": null,
    "yearsExperience": null,
    "createdAt": "2025-07-25T02:45:23.973Z"
  },
  "timestamp": "2025-07-25T02:53:25.153Z"
}
```

### Logout User
```http
POST /api/v1/auth/logout
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logout successful",
  "timestamp": "2025-07-25T02:45:47.033Z"
}
```

---

## Jobs Endpoints

### Get All Jobs
```http
GET /api/v1/jobs?page=1&limit=20&specialty=Pediatrics&state=TX
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `specialty` (string) - Filter by medical specialty
- `state` (string, 2 chars) - Filter by state (e.g., "NY", "CA")
- `minRate` (number) - Minimum hourly rate filter
- `maxRate` (number) - Maximum hourly rate filter
- `search` (string) - Search in title and description
- `sortBy` (string) - Sort field: created_at, hourly_rate_min, start_date, title
- `sortOrder` (string) - Sort direction: ASC, DESC

**Response (200):**
```json
{
  "jobs": [
    {
      "id": 3,
      "title": "Pediatrician - Urgent Care",
      "location": "Austin, TX",
      "state": "TX", 
      "specialty": "Pediatrics",
      "description": "Seeking board-certified pediatrician for busy urgent care clinic.",
      "hourlyRateMin": 225,
      "hourlyRateMax": 275,
      "startDate": "2025-08-01T00:00:00.000Z",
      "endDate": "2025-10-31T00:00:00.000Z",
      "duration": "3 months",
      "shiftType": "Day shift",
      "postedBy": 6,
      "postedByEmail": "recruiter@example.com",
      "postedByName": "Jane Recruiter",
      "companyName": "Austin Pediatric Urgent Care",
      "status": "active",
      "views": 15,
      "requirements": [],
      "requirementCount": 3,
      "createdAt": "2025-07-25T01:52:24.391Z",
      "updatedAt": "2025-07-25T01:52:31.429Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "timestamp": "2025-07-25T02:46:03.530Z"
}
```

### Get Single Job
```http
GET /api/v1/jobs/{id}
```

**Response (200):**
```json
{
  "job": {
    "id": 1,
    "title": "Internal Medicine Physician",
    "location": "New York, NY",
    "state": "NY",
    "specialty": "Internal Medicine",
    "description": "Seeking experienced IM physician for 3-month assignment",
    "hourlyRateMin": 300,
    "hourlyRateMax": 350,
    "startDate": null,
    "endDate": null,
    "duration": null,
    "shiftType": null,
    "postedBy": 2,
    "postedByEmail": "recruiter@example.com",
    "postedByName": "Jane Recruiter",
    "companyName": "NYC Medical Center",
    "status": "active",
    "views": 25,
    "requirements": [],
    "requirementCount": 0,
    "createdAt": "2025-07-25T00:42:53.146Z",
    "updatedAt": "2025-07-25T02:46:58.259Z"
  },
  "timestamp": "2025-07-25T02:46:15.621Z"
}
```

### Create Job
```http
POST /api/v1/jobs
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "Emergency Medicine Physician",
  "location": "Los Angeles, CA", 
  "state": "CA",
  "specialty": "Emergency Medicine",
  "description": "ER coverage needed for busy Level II trauma center",
  "hourlyRateMin": 350,
  "hourlyRateMax": 400,
  "startDate": "2025-09-01",
  "endDate": "2025-12-31",
  "duration": "4 months",
  "shiftType": "Night shift",
  "companyName": "LA County Hospital",
  "requirements": ["Board certified in EM", "ACLS certified", "Trauma experience preferred"]
}
```

**Response (201):**
```json
{
  "message": "Job created successfully",
  "job": {
    "id": 5,
    "title": "Emergency Medicine Physician",
    "location": "Los Angeles, CA",
    "state": "CA",
    "specialty": "Emergency Medicine",
    "description": "ER coverage needed for busy Level II trauma center",
    "hourlyRateMin": 350,
    "hourlyRateMax": 400,
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "duration": "4 months",
    "shiftType": "Night shift",
    "postedBy": 11,
    "postedByName": "John Doe",
    "companyName": "LA County Hospital",
    "status": "active",
    "views": 0,
    "requirements": ["Board certified in EM", "ACLS certified", "Trauma experience preferred"],
    "requirementCount": 3,
    "createdAt": "2025-07-25T02:46:09.114Z",
    "updatedAt": "2025-07-25T02:46:09.114Z"
  },
  "timestamp": "2025-07-25T02:46:09.120Z"
}
```

### Update Job
```http
PUT /api/v1/jobs/{id}
Authorization: Bearer {token}
```

**Request Body:** (partial updates allowed)
```json
{
  "title": "Updated Emergency Medicine Physician",
  "description": "Updated job description with new requirements",
  "hourlyRateMax": 450
}
```

**Response (200):**
```json
{
  "message": "Job updated successfully", 
  "job": {
    "id": 5,
    "title": "Updated Emergency Medicine Physician",
    "location": "Los Angeles, CA",
    "state": "CA",
    "specialty": "Emergency Medicine", 
    "description": "Updated job description with new requirements",
    "hourlyRateMin": 350,
    "hourlyRateMax": 450,
    "startDate": "2025-09-01T00:00:00.000Z",
    "endDate": "2025-12-31T00:00:00.000Z",
    "duration": "4 months",
    "shiftType": "Night shift",
    "postedBy": 11,
    "postedByName": "John Doe",
    "companyName": "LA County Hospital",
    "status": "active",
    "views": 1,
    "requirements": ["Board certified in EM", "ACLS certified", "Trauma experience preferred"],
    "requirementCount": 3,
    "createdAt": "2025-07-25T02:46:09.114Z",
    "updatedAt": "2025-07-25T02:46:21.998Z"
  },
  "timestamp": "2025-07-25T02:46:22.003Z"
}
```

### Delete Job
```http
DELETE /api/v1/jobs/{id}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Job deleted successfully",
  "timestamp": "2025-07-25T02:46:27.869Z"
}
```

---

## Applications Endpoints

### Apply to Job
```http
POST /api/v1/applications
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "jobId": 1,
  "coverLetter": "I am very interested in this position and have extensive experience in emergency medicine.",
  "expectedRate": 375,
  "availableDate": "2025-09-15",
  "notes": "Available for weekend shifts and on-call rotations"
}
```

**Response (201):**
```json
{
  "message": "Application submitted successfully",
  "application": {
    "id": 4,
    "userId": 10,
    "jobId": 1,
    "status": "pending",
    "coverLetter": "I am very interested in this position and have extensive experience in emergency medicine.",
    "expectedRate": 375,
    "availableDate": "2025-09-15T00:00:00.000Z",
    "notes": "Available for weekend shifts and on-call rotations",
    "reviewedAt": null,
    "reviewedBy": null,
    "createdAt": "2025-07-25T02:32:47.903Z",
    "updatedAt": "2025-07-25T02:32:47.903Z",
    "job": {
      "id": 1,
      "title": "Emergency Medicine Physician",
      "location": "Los Angeles, CA",
      "state": "CA",
      "specialty": "Emergency Medicine",
      "hourlyRateMin": 350,
      "hourlyRateMax": 400,
      "companyName": "LA County Hospital",
      "status": "active",
      "poster": {
        "email": "recruiter@example.com",
        "name": "Jane Recruiter"
      }
    },
    "applicant": {
      "email": "applicant@example.com",
      "firstName": "John",
      "lastName": "Applicant"
    }
  },
  "timestamp": "2025-07-25T02:32:47.948Z"
}
```

### Get My Applications
```http
GET /api/v1/applications/my?page=1&limit=20&status=pending&sortBy=created_at&sortOrder=DESC
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page  
- `status` (string) - Filter by status: pending, reviewed, accepted, rejected, withdrawn
- `sortBy` (string) - Sort field: created_at, updated_at, status
- `sortOrder` (string) - Sort direction: ASC, DESC

**Response (200):**
```json
{
  "applications": [
    {
      "id": 4,
      "userId": 10,
      "jobId": 1,
      "status": "pending",
      "coverLetter": "I am very interested in this position and have extensive experience in emergency medicine.",
      "expectedRate": 375,
      "availableDate": "2025-09-15T00:00:00.000Z",
      "notes": "Available for weekend shifts and on-call rotations",
      "reviewedAt": null,
      "reviewedBy": null,
      "createdAt": "2025-07-25T02:32:47.903Z",
      "updatedAt": "2025-07-25T02:32:47.903Z",
      "job": {
        "id": 1,
        "title": "Emergency Medicine Physician",
        "location": "Los Angeles, CA",
        "state": "CA",
        "specialty": "Emergency Medicine", 
        "hourlyRateMin": 350,
        "hourlyRateMax": 400,
        "companyName": "LA County Hospital",
        "status": "active",
        "poster": {
          "email": "recruiter@example.com",
          "name": "Jane Recruiter"
        }
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "timestamp": "2025-07-25T02:32:48.970Z"
}
```

### Get Applications for Job (Recruiters)
```http
GET /api/v1/applications/for-job/{jobId}?page=1&limit=20&status=pending
Authorization: Bearer {token}
```

**Authorization**: Only job poster can access applications for their jobs.

**Query Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 20, max: 100) - Items per page
- `status` (string) - Filter by status: pending, reviewed, accepted, rejected, withdrawn
- `sortBy` (string) - Sort field: created_at, updated_at, status
- `sortOrder` (string) - Sort direction: ASC, DESC

**Response (200):**
```json
{
  "applications": [
    {
      "id": 6,
      "userId": 11,
      "jobId": 3,
      "status": "pending",
      "coverLetter": "I am applying for this pediatrician position and have 8 years of pediatric experience.",
      "expectedRate": 250,
      "availableDate": "2025-08-15T00:00:00.000Z",
      "notes": "Board certified, available for weekend coverage",
      "reviewedAt": null,
      "reviewedBy": null,
      "createdAt": "2025-07-25T02:47:11.272Z",
      "updatedAt": "2025-07-25T02:47:11.272Z",
      "applicant": {
        "email": "doctor@example.com",
        "firstName": "Dr. Sarah",
        "lastName": "Johnson",
        "phone": "555-0456",
        "specialty": "Pediatrics",
        "yearsExperience": 8
      }
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 20,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "timestamp": "2025-07-25T02:47:16.976Z"
}
```

### Update Application Status (Recruiters)
```http
PUT /api/v1/applications/{id}/status
Authorization: Bearer {token}
```

**Authorization**: Only job poster can update application status.

**Request Body:**
```json
{
  "status": "reviewed",
  "notes": "Application looks promising, scheduling phone interview"
}
```

**Response (200):**
```json
{
  "message": "Application status updated successfully",
  "application": {
    "id": 6,
    "userId": 11,
    "jobId": 3,
    "status": "reviewed",
    "coverLetter": "I am applying for this pediatrician position and have 8 years of pediatric experience.",
    "expectedRate": 250,
    "availableDate": "2025-08-15T00:00:00.000Z",
    "notes": "Application looks promising, scheduling phone interview",
    "reviewedAt": "2025-07-25T02:47:22.557Z",
    "reviewedBy": 6,
    "createdAt": "2025-07-25T02:47:11.272Z",
    "updatedAt": "2025-07-25T02:47:22.557Z"
  },
  "timestamp": "2025-07-25T02:47:22.562Z"
}
```

### Withdraw Application
```http
DELETE /api/v1/applications/{id}
Authorization: Bearer {token}
```

**Authorization**: Only application owner can withdraw their application.

**Response (200):**
```json
{
  "message": "Application withdrawn successfully",
  "timestamp": "2025-07-25T02:47:27.464Z"
}
```

---

## Error Responses

### Authentication Errors

**401 Unauthorized - No Token:**
```json
{
  "error": "authentication_required",
  "message": "No authorization header provided",
  "timestamp": "2025-07-25T02:49:58.937Z"
}
```

**401 Unauthorized - Invalid Token:**
```json
{
  "error": "authentication_failed", 
  "message": "Invalid token",
  "timestamp": "2025-07-25T02:50:07.817Z"
}
```

**403 Forbidden - Insufficient Permissions:**
```json
{
  "error": "unauthorized",
  "message": "You are not authorized to view applications for this job",
  "timestamp": "2025-07-25T02:47:03.905Z"
}
```

### Validation Errors

**400 Bad Request - Validation Failed:**
```json
{
  "error": "validation_error",
  "message": "\"jobId\" must be a number",
  "timestamp": "2025-07-25T02:23:35.789Z"
}
```

**400 Bad Request - Business Logic Error:**
```json
{
  "error": "duplicate_application",
  "message": "You have already applied to this job",
  "timestamp": "2025-07-25T02:23:17.008Z"
}
```

### Resource Errors

**404 Not Found:**
```json
{
  "error": "not_found",
  "message": "The requested resource /api/v1/jobs/999 was not found",
  "timestamp": "2025-07-25T02:29:23.082Z"
}
```

**500 Internal Server Error:**
```json
{
  "error": "internal_server_error",
  "message": "Internal server error during application submission",
  "timestamp": "2025-07-25T02:29:23.082Z"
}
```

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute per IP
- **Application submission**: 10 applications per hour per user
- **General API requests**: 100 requests per minute per authenticated user

---

## Data Validation Rules

### Application Fields
- `jobId`: Required positive integer
- `coverLetter`: Required string, 10-5000 characters
- `expectedRate`: Optional number, 0-2000 (USD per hour)
- `availableDate`: Optional ISO date, must be in future
- `notes`: Optional string, max 1000 characters

### Job Fields  
- `title`: Required string, 3-255 characters
- `location`: Required string, 3-255 characters
- `state`: Required 2-character uppercase state code
- `specialty`: Required string, 2-100 characters
- `hourlyRateMin/Max`: Required numbers, 0-1000, min <= max
- `requirements`: Optional array of strings, max 20 items, 500 chars each

### User Fields
- `email`: Required valid email format
- `password`: Required string, minimum 6 characters
- `firstName/lastName`: Required strings, 1-100 characters
- `phone`: Optional string
- `role`: Optional enum: locum, recruiter, admin (default: locum)

---

## Performance Notes

- All list endpoints support pagination (default 20 items, max 100)
- Database indexes optimize queries by user_id, job_id, status, and dates
- Job browsing endpoints (GET /jobs, GET /jobs/:id) are public (no auth required)
- All other endpoints require authentication
- Composite indexes support common query patterns for optimal performance

---

## Security Features

- JWT-based authentication with 24-hour expiration
- Token blacklisting for secure logout
- Role-based access control (applicants vs recruiters)
- Input validation and sanitization
- SQL injection protection via parameterized queries
- CORS configuration for cross-origin requests
- Helmet.js security headers