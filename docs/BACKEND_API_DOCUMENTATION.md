# Backend API Documentation - staging-deploy

*Generated: September 2025*

## 📋 **Executive Summary**

The staging-deploy backend is an **extremely minimal Express.js server** that primarily serves static files with basic JWT authentication. It contains **only 4 actual API endpoints** beyond static file routing.

**Architecture**: Static file server (95%) + Basic authentication (5%)

## 🔍 **Complete API Surface Overview**

| Category | Endpoints | Purpose | Complexity |
|----------|-----------|---------|------------|
| **Authentication** | 3 endpoints | User registration, login, token validation | Simple |
| **Health Check** | 1 endpoint | Server status monitoring | Minimal |
| **Static Routing** | 8 routes | HTML file serving with clean URLs | Basic |
| **Business Logic** | 0 endpoints | ❌ No job board, dashboard, or data APIs | N/A |

## 🔐 **Authentication APIs**

### **POST /api/auth/register**
Creates a new user account with encrypted password storage.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "locum",           // Optional: "locum", "recruiter", "admin"
  "first_name": "John",      // Optional
  "last_name": "Doe",        // Optional
  "phone": "555-0123"        // Optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "locum",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-0123"
  }
}
```

**Error Responses:**
- **400**: Missing email/password, weak password
- **409**: Email already exists
- **500**: Database error

**Implementation Details:**
- Password hashed with bcrypt (10 rounds)
- JWT token expires in 7 days
- Stores user in MySQL `users` table
- Validates email uniqueness

---

### **POST /api/auth/login**
Authenticates existing user and returns JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "locum",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-0123"
  }
}
```

**Error Responses:**
- **400**: Missing credentials
- **401**: Invalid email/password
- **500**: Database error

**Implementation Details:**
- bcrypt password verification
- Returns same JWT structure as registration
- Fetches complete user profile from database

---

### **GET /api/auth/verify**
Validates JWT token and returns user information.

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": 123,
    "email": "user@example.com",
    "role": "locum",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-0123"
  }
}
```

**Error Responses:**
- **401**: Missing or invalid token
- **500**: Database error

**Implementation Details:**
- Validates JWT signature and expiration
- Fetches fresh user data from database
- Used by frontend auth guards

## 🏥 **Health Check API**

### **GET /health**
Returns server status and deployment information.

**Success Response (200):**
```json
{
  "status": "ok",
  "app": "locumcalc-vanilla-demos",
  "version": "4.2.4",
  "timestamp": "2025-09-15T22:30:00.000Z",
  "message": "This is the REAL vanilla demos server!",
  "deployment": {
    "method": "github-actions",
    "commit": "d4d659e",
    "dyno": "web.1"
  }
}
```

**Implementation Details:**
- Always returns 200 OK (no health checks)
- Includes Heroku deployment metadata
- Used for monitoring and debugging

## 🗂️ **Static File Routes**

### **HTML Page Routing**
Clean URL routing to specific HTML files.

| Route | File | Purpose |
|-------|------|---------|
| `GET /` | `index.html` | Homepage/landing page |
| `GET /admin` | `admin-dashboard.html` | Administrative interface |
| `GET /calculator` | `contract-calculator.html` | Contract analysis tool |
| `GET /jobs` | `job-board.html` | Job listings interface |
| `GET /locum` | `locum-dashboard.html` | Locum physician dashboard |
| `GET /paycheck` | `paycheck-calculator.html` | Paycheck analysis tool |
| `GET /paycheck-calculator.html` | `paycheck-calculator.html` | Direct file access |
| `GET /recruiter` | `recruiter-dashboard.html` | Recruiter interface |

**Implementation Details:**
- Uses `express.static('.')` for general static file serving
- Explicit routes for clean URLs (no .html extension)
- All routes serve complete HTML pages with embedded CSS/JS
- No server-side rendering or data injection

## 🚫 **What's NOT in the Backend**

### **Missing Business Logic APIs**

#### **❌ Job Board APIs**
```javascript
// These DON'T exist:
GET    /api/jobs              // Job listings
POST   /api/jobs              // Create job posting  
PUT    /api/jobs/:id          // Update job
DELETE /api/jobs/:id          // Delete job
GET    /api/jobs/search       // Search jobs
```
*Reality: All job data is client-side static or localStorage*

#### **❌ Dashboard Data APIs**
```javascript
// These DON'T exist:
GET /api/dashboard/stats      // Dashboard metrics
GET /api/user/profile         // User profile data
GET /api/user/applications    // User's applications
GET /api/user/contracts       // User's contracts
```
*Reality: All dashboard data is static HTML/JS*

#### **❌ Calculator APIs**
```javascript
// These DON'T exist:
POST /api/calculate/contract  // Server-side calculations
POST /api/calculate/paycheck  // Server-side calculations
GET  /api/market-data         // Market comparison data
POST /api/export/pdf          // PDF generation
```
*Reality: All calculations happen in browser JavaScript*

#### **❌ File Upload APIs**
```javascript
// These DON'T exist:
POST /api/upload/resume       // Resume uploads
POST /api/upload/contract     // Contract documents
GET  /api/files/:id           // File downloads
```
*Reality: No file handling capabilities*

#### **❌ Communication APIs**
```javascript
// These DON'T exist:
POST /api/messages            // Internal messaging
POST /api/email               // Email sending
POST /api/notifications       // Push notifications
```
*Reality: Uses mailto: links and client-side alerts*

#### **❌ Data Management APIs**
```javascript
// These DON'T exist:
GET    /api/users             // User management
PUT    /api/users/:id         // User updates
DELETE /api/users/:id         // User deletion
GET    /api/admin/analytics   // Analytics data
POST   /api/data/export       // Data exports
```
*Reality: No user management beyond authentication*

## 🗄️ **Database Schema**

### **Users Table**
The ONLY database table in use:

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('locum', 'recruiter', 'admin') DEFAULT 'locum',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Schema Limitations:**
- ❌ No jobs table
- ❌ No applications table  
- ❌ No contracts table
- ❌ No messages table
- ❌ No analytics tables
- ❌ No file metadata tables

## 📡 **Request/Response Flow**

### **Authentication Flow**
```
1. Frontend Form → 2. POST /api/auth/login → 3. bcrypt verification →
4. MySQL user lookup → 5. JWT generation → 6. JSON response →
7. localStorage save → 8. Client-side redirect
```

### **Page Load Flow**
```
1. Browser Request → 2. Express.js routing → 3. Static file serve →
4. HTML/CSS/JS download → 5. Client-side execution →
6. localStorage token check → 7. DOM manipulation
```

### **Protected Page Flow**
```
1. Page load → 2. auth-guard.js execution → 3. localStorage token check →
4. GET /api/auth/verify → 5. Server validation → 6. Allow/redirect
```

## 🔧 **Server Configuration**

### **Express.js Middleware Stack**
```javascript
// Middleware (in order):
1. express.json()           // JSON body parsing
2. URL cleanup middleware   // Trailing slash removal
3. express.static('.')      // Static file serving
4. Custom route handlers    // Page and API routes
```

### **Environment Variables**
```bash
# Database
DATABASE_URL=mysql://[heroku-provided]

# Authentication
JWT_SECRET=dev_secret_key_change_in_production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Server
NODE_ENV=development
PORT=3000
```

### **Database Connection**
```javascript
// MySQL connection with automatic URL parsing
const config = {
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.substring(1),
    port: url.port || 3306,
    ssl: false,
    reconnect: true,
    timeout: 60000
};
```

## 🔍 **API Testing Examples**

### **User Registration Test**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "locum",
    "first_name": "Test",
    "last_name": "User"
  }'
```

### **Login Test**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **Token Verification Test**
```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### **Health Check Test**
```bash
curl -X GET http://localhost:3000/health
```

## 📊 **Performance Characteristics**

### **Backend Performance**
- **Response Time**: <50ms for auth endpoints
- **Memory Usage**: ~30-50MB (minimal Express.js)
- **Database Queries**: Simple SELECT/INSERT only
- **Concurrent Users**: Limited by single Heroku dyno

### **API Limitations**
- **No Pagination**: N/A (no list endpoints)
- **No Rate Limiting**: Unprotected endpoints
- **No Caching**: Every request hits database
- **No Background Jobs**: No async processing

## 🚀 **Deployment Architecture**

### **Heroku Deployment**
```
Heroku Dyno (web process)
├── Express.js Server (server.js)
├── Static File Serving (all HTML/CSS/JS)
├── 4 API Endpoints
└── MySQL Database Connection (JawsDB)
```

### **Process Definition**
```bash
# Procfile
web: node server.js
```

### **Startup Sequence**
```javascript
1. Database connection test
2. Database table initialization  
3. Express.js server start
4. Port binding (Heroku-assigned)
5. Route registration
6. Static middleware setup
```

## 🔮 **Potential Backend Extensions**

### **If Business Logic APIs Were Added**
```javascript
// Future API possibilities:
├── Job Management APIs
│   ├── POST   /api/jobs
│   ├── GET    /api/jobs
│   ├── PUT    /api/jobs/:id
│   └── DELETE /api/jobs/:id
├── Application APIs  
│   ├── POST /api/applications
│   ├── GET  /api/applications
│   └── PUT  /api/applications/:id
├── User Profile APIs
│   ├── GET  /api/user/profile
│   ├── PUT  /api/user/profile
│   └── POST /api/user/avatar
└── File Management APIs
    ├── POST /api/files/upload
    ├── GET  /api/files/:id
    └── DELETE /api/files/:id
```

### **Database Schema Extensions**
```sql
-- Tables that would be needed:
CREATE TABLE jobs (...);
CREATE TABLE applications (...);
CREATE TABLE files (...);
CREATE TABLE messages (...);
CREATE TABLE analytics (...);
```

## 📋 **Summary**

The staging-deploy backend is intentionally **minimal and focused**:

### **What It Is:**
- ✅ Static file server with clean URL routing
- ✅ Basic JWT authentication (register/login/verify)
- ✅ Single MySQL table for user management
- ✅ Health monitoring endpoint

### **What It's Not:**
- ❌ Full-featured job board API
- ❌ Complex business logic processor
- ❌ File upload/storage system
- ❌ Real-time communication platform
- ❌ Analytics or reporting system

### **Architecture Philosophy:**
**"Keep the server simple, let the client do the work"**

This approach enables:
- **Fast Development**: No complex API design needed
- **Easy Deployment**: Minimal server resources required
- **Simple Debugging**: Most logic runs in browser DevTools
- **Cost Effective**: Runs on Heroku's cheapest tier
- **High Performance**: No server-side bottlenecks

The backend serves its purpose: **authenticate users and serve static content efficiently**.

---

*This documentation reflects the current minimal backend implementation as of September 2025.*