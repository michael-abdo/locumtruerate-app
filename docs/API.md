# Job Board API Documentation

A comprehensive REST API for managing jobs, applications, and employer authentication.

## Base URL

```
https://your-job-board.your-worker.dev/api
```

For local development:
```
http://localhost:8787/api
```

## Authentication

Most endpoints require no authentication. Employer-specific operations require a Bearer token.

### Headers
```
Content-Type: application/json
Authorization: Bearer <token>  # For authenticated endpoints
```

## Endpoints

### Jobs

#### GET /jobs
Get all job listings with optional filtering.

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Software Engineer",
    "company": "Tech Corp",
    "location": "San Francisco, CA",
    "type": "full-time",
    "salary": "$100,000 - $150,000",
    "category": "engineering",
    "tags": "JavaScript, React, Node.js",
    "description": "We are looking for...",
    "createdAt": "2024-06-14T10:00:00.000Z",
    "updatedAt": "2024-06-14T10:00:00.000Z"
  }
]
```

#### GET /jobs/{id}
Get a specific job by ID.

**Response:**
```json
{
  "id": "uuid",
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "type": "full-time",
  "salary": "$100,000 - $150,000",
  "category": "engineering",
  "tags": "JavaScript, React, Node.js",
  "description": "We are looking for...",
  "createdAt": "2024-06-14T10:00:00.000Z"
}
```

#### POST /jobs
Create a new job posting.

**Request Body:**
```json
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "type": "full-time",
  "salary": "$100,000 - $150,000",
  "category": "engineering",
  "tags": "JavaScript, React, Node.js",
  "description": "We are looking for a skilled software engineer..."
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Software Engineer",
  "company": "Tech Corp",
  "location": "San Francisco, CA",
  "type": "full-time",
  "salary": "$100,000 - $150,000",
  "category": "engineering",
  "tags": "JavaScript, React, Node.js",
  "description": "We are looking for...",
  "createdAt": "2024-06-14T10:00:00.000Z"
}
```

#### PUT /jobs/{id}
Update an existing job posting.

**Request Body:** Same as POST /jobs

**Response:** Updated job object

#### DELETE /jobs/{id}
Delete a job posting.

**Response:**
```
Job deleted successfully
```

### Applications

#### GET /applications
Get all job applications.

**Response:**
```json
[
  {
    "id": "uuid",
    "jobId": "job-uuid",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "experience": "5-10",
    "coverLetter": "I am interested in this position because...",
    "resumeFileName": "john_doe_resume.pdf",
    "resumeSize": 1024000,
    "resumeUrl": "placeholder-url",
    "portfolio": "https://johndoe.com",
    "availability": "2weeks",
    "appliedAt": "2024-06-14T10:00:00.000Z",
    "status": "pending"
  }
]
```

#### POST /applications
Submit a job application.

**Request Body:**
```json
{
  "jobId": "job-uuid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "experience": "5-10",
  "coverLetter": "I am interested in this position because...",
  "portfolio": "https://johndoe.com",
  "availability": "2weeks"
}
```

**Response:**
```json
{
  "id": "uuid",
  "jobId": "job-uuid",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "experience": "5-10",
  "coverLetter": "I am interested in this position because...",
  "portfolio": "https://johndoe.com",
  "availability": "2weeks",
  "appliedAt": "2024-06-14T10:00:00.000Z",
  "status": "pending"
}
```

### Authentication

#### POST /auth/register
Register a new employer account.

**Request Body:**
```json
{
  "companyName": "Tech Corp",
  "contactName": "Jane Smith",
  "email": "jane@techcorp.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "employer": {
    "id": "uuid",
    "companyName": "Tech Corp",
    "contactName": "Jane Smith",
    "email": "jane@techcorp.com",
    "createdAt": "2024-06-14T10:00:00.000Z",
    "isVerified": true
  }
}
```

#### POST /auth/login
Login with employer credentials.

**Request Body:**
```json
{
  "email": "jane@techcorp.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "employer": {
    "id": "uuid",
    "companyName": "Tech Corp",
    "contactName": "Jane Smith",
    "email": "jane@techcorp.com",
    "createdAt": "2024-06-14T10:00:00.000Z",
    "isVerified": true
  }
}
```

#### GET /auth/verify
Verify an authentication token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "valid": true,
  "employerId": "uuid"
}
```

## Data Models

### Job
```typescript
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'contract' | 'remote';
  salary?: string;
  category: 'engineering' | 'design' | 'marketing' | 'sales' | 'product' | 'finance' | 'hr' | 'operations' | 'other';
  tags?: string; // Comma-separated
  description: string;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date
}
```

### Application
```typescript
interface Application {
  id: string;
  jobId: string;
  fullName: string;
  email: string;
  phone?: string;
  experience?: '0-1' | '2-3' | '4-5' | '6-10' | '10+';
  coverLetter: string;
  resumeFileName?: string;
  resumeSize?: number;
  resumeUrl?: string;
  portfolio?: string;
  availability?: 'immediate' | '2weeks' | '1month' | 'other';
  appliedAt: string; // ISO date
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}
```

### Employer
```typescript
interface Employer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  createdAt: string; // ISO date
  isVerified: boolean;
}
```

## Error Responses

All errors return a JSON object with an error message:

```json
{
  "error": "Error description"
}
```

### Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## CORS

The API supports CORS and can be accessed from any origin. The following headers are included:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Security Notes

1. **Password Storage**: Passwords are hashed using SHA-256. In production, use bcrypt or similar.
2. **Token Security**: Tokens are base64 encoded JSON. In production, use proper JWT with signing.
3. **HTTPS**: Always use HTTPS in production to protect sensitive data.
4. **Input Validation**: The API performs basic validation. Consider implementing more robust validation.

## Examples

### Creating a Job with cURL

```bash
curl -X POST https://your-job-board.your-worker.dev/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Frontend Developer",
    "company": "StartupCo",
    "location": "Remote",
    "type": "full-time",
    "salary": "$80,000 - $120,000",
    "category": "engineering",
    "tags": "React, TypeScript, CSS",
    "description": "We are looking for a talented frontend developer..."
  }'
```

### Submitting an Application

```bash
curl -X POST https://your-job-board.your-worker.dev/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "123e4567-e89b-12d3-a456-426614174000",
    "fullName": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "+1234567890",
    "experience": "4-5",
    "coverLetter": "I am excited to apply for this position...",
    "portfolio": "https://alicejohnson.dev",
    "availability": "2weeks"
  }'
```

### Authenticating as an Employer

```bash
# Register
curl -X POST https://your-job-board.your-worker.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "My Company",
    "contactName": "John Smith",
    "email": "john@mycompany.com",
    "password": "securepassword123"
  }'

# Login
curl -X POST https://your-job-board.your-worker.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@mycompany.com",
    "password": "securepassword123"
  }'
```

This API provides a complete foundation for a job board application with proper authentication, data management, and CORS support for web applications.