# LocumTrueRate API Endpoints Documentation

**Base URL**: `https://locumtruerate-production-17560d4c3d1a.herokuapp.com`

## System Endpoints

### Health Check
- **GET** `/health` - Basic health check endpoint
  - **Auth Required**: No
  - **Description**: Returns service status and basic info

### API Information  
- **GET** `/api/v1` - API information and available endpoints
  - **Auth Required**: No
  - **Description**: Returns API version and endpoint list

### Performance Metrics
- **GET** `/api/metrics` - Full performance metrics report
  - **Auth Required**: No
  - **Description**: Returns detailed performance metrics

- **GET** `/api/metrics/summary` - Lightweight metrics summary
  - **Auth Required**: No
  - **Description**: Returns basic metrics summary

### Database Test (Development Only)
- **GET** `/api/db-test` - Database connection test
  - **Auth Required**: No
  - **Description**: Tests database connectivity (dev environment only)

## Authentication Endpoints

### User Registration
- **POST** `/api/v1/auth/register` - Register a new user account
  - **Auth Required**: No
  - **Request Body**: `{ email, password, firstName, lastName, phone, role }`
  - **Description**: Creates new user account

### User Login
- **POST** `/api/v1/auth/login` - Authenticate user and return JWT token
  - **Auth Required**: No  
  - **Request Body**: `{ email, password }`
  - **Response**: `{ token, user }`
  - **Description**: Authenticates user and returns JWT token

### User Logout
- **POST** `/api/v1/auth/logout` - Logout user by blacklisting token
  - **Auth Required**: Yes
  - **Description**: Invalidates JWT token

### Current User Profile
- **GET** `/api/v1/auth/me` - Get current user profile
  - **Auth Required**: Yes
  - **Description**: Returns authenticated user's profile information

## Job Endpoints

### List Jobs
- **GET** `/api/v1/jobs` - Get all jobs with filtering and pagination
  - **Auth Required**: No
  - **Query Parameters**: Filtering, sorting, pagination options
  - **Description**: Returns paginated list of job postings

### Get Single Job
- **GET** `/api/v1/jobs/:id` - Get single job by ID
  - **Auth Required**: No
  - **Path Parameters**: `id` (job ID)
  - **Description**: Returns detailed job information

### Create Job
- **POST** `/api/v1/jobs` - Create new job posting
  - **Auth Required**: Yes
  - **Request Body**: Job posting data
  - **Description**: Creates new job posting (recruiter/admin only)

### Update Job
- **PUT** `/api/v1/jobs/:id` - Update job posting
  - **Auth Required**: Yes (ownership required)
  - **Path Parameters**: `id` (job ID)
  - **Request Body**: Updated job data
  - **Description**: Updates existing job posting

### Delete Job
- **DELETE** `/api/v1/jobs/:id` - Delete job posting
  - **Auth Required**: Yes (ownership required)
  - **Path Parameters**: `id` (job ID)
  - **Description**: Deletes job posting

## Application Endpoints

### Apply to Job
- **POST** `/api/v1/applications` - Apply to a job
  - **Auth Required**: Yes
  - **Request Body**: `{ jobId, coverLetter, expectedRate, availableDate }`
  - **Description**: Submit job application

### Get My Applications
- **GET** `/api/v1/applications/my` - Get current user's applications
  - **Auth Required**: Yes
  - **Query Parameters**: Filtering, pagination options
  - **Description**: Returns user's job applications

### Get Job Applications (Recruiter)
- **GET** `/api/v1/applications/for-job/:jobId` - Get applications for specific job
  - **Auth Required**: Yes (job ownership required)
  - **Path Parameters**: `jobId` (job ID)
  - **Description**: Returns applications for recruiter's job posting

### Update Application Status
- **PUT** `/api/v1/applications/:id/status` - Update application status
  - **Auth Required**: Yes (recruiter only)
  - **Path Parameters**: `id` (application ID)
  - **Request Body**: `{ status, notes }`
  - **Description**: Updates application status (recruiter action)

### Search User Applications
- **GET** `/api/v1/applications/search` - Advanced search user's applications
  - **Auth Required**: Yes
  - **Query Parameters**: Search filters and pagination
  - **Description**: Advanced search through user's applications

### Search Job Applications (Recruiter)
- **GET** `/api/v1/applications/for-job/:jobId/search` - Search applications for specific job
  - **Auth Required**: Yes (job ownership required)
  - **Path Parameters**: `jobId` (job ID)
  - **Query Parameters**: Search filters and pagination
  - **Description**: Search applications for recruiter's job

### Get Filter Options
- **GET** `/api/v1/applications/filter-options` - Get available filter options
  - **Auth Required**: Yes
  - **Query Parameters**: `userSpecific=true/false`
  - **Description**: Returns available filter options for applications

### Withdraw Application
- **DELETE** `/api/v1/applications/:id` - Withdraw application
  - **Auth Required**: Yes (ownership required)
  - **Path Parameters**: `id` (application ID)
  - **Description**: Withdraws job application

## Data Export Endpoints (GDPR Compliance)

### Export User Data
- **GET** `/api/v1/data-export/my-data` - Export user's application data
  - **Auth Required**: Yes
  - **Query Parameters**: `format=json/csv`, `includeHistory`, `dateFrom`, `dateTo`
  - **Description**: Exports user data for GDPR compliance

### Deletion Request Info
- **GET** `/api/v1/data-export/request-deletion` - Get deletion request information
  - **Auth Required**: Yes
  - **Description**: Provides information about data deletion process

### Privacy Summary
- **GET** `/api/v1/data-export/privacy-summary` - Get privacy summary
  - **Auth Required**: Yes
  - **Description**: Returns summary of user's data processing activities

## Important Notes

### Authentication
- All endpoints marked "Auth Required: Yes" need `Authorization: Bearer <token>` header
- JWT tokens are obtained via `/api/v1/auth/login` endpoint
- Tokens can be invalidated via `/api/v1/auth/logout` endpoint

### API Versioning
- Current API version: `v1`
- Most endpoints use `/api/v1/` prefix
- Some jobs endpoints use `/api/v1/jobs` format

### Error Handling
- All endpoints return consistent error format
- HTTP status codes follow REST conventions
- Error responses include error codes and messages

### Rate Limiting
- Performance metrics are tracked
- No explicit rate limiting documented in current implementation

### CORS Configuration
- Configured to allow cross-origin requests
- Credentials are supported for authenticated requests

## Calculator Endpoints
**Note**: No calculator endpoints were found in the backend. The frontend previously handled calculations locally. If calculator functionality is needed, it would require implementing new backend endpoints.