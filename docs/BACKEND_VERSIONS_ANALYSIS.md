# Backend Versions and Branches Analysis

*Generated: September 2025*

## Overview

This document provides a comprehensive analysis of the different backend implementations across the jobboard project branches. The project has evolved through multiple architectural approaches, from full Node.js APIs to static site deployments.

## Branch Architecture Summary

| Branch | Backend Type | Database | Deployment | Key Features |
|--------|-------------|----------|------------|--------------|
| **staging-deploy** | NGINX Static* | MySQL2** | `bin/start-nginx-solo` | Static site deployment (current) |
| **production-deploy** | Full Node.js API | PostgreSQL | `node src/server.js` | Complete API implementation |
| **database** | Basic Node.js | MySQL2 | `node server.js` | JWT auth + DB connection |
| **mobile** | Minimal Express | None | `node server.js` | Static file serving only |
| **vanilla-only** | Minimal Express | None | `node server.js` | Static file serving only |
| **vin-backend** | Minimal Express | None | `node server.js` | Static file serving only |

*Note: staging-deploy has Node.js code but uses NGINX deployment  
**Note: Database code exists but may not be actively used

## Detailed Backend Implementations

### 1. production-deploy (Most Complete Backend)

**Architecture**: Full REST API with structured routes and middleware

**Key Components**:
- **Server Location**: `src/server.js`
- **Database**: PostgreSQL with connection pooling
- **Security**: Helmet, CORS, JWT authentication
- **Validation**: Joi schema validation

**API Routes**:
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/jobs` - Job board CRUD operations
- `/api/v1/applications` - Job applications management
- `/api/v1/data-export` - Data export functionality

**Dependencies**:
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.1",
    "express": "^4.18.2",
    "helmet": "^8.1.0",
    "joi": "^17.13.3",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.16.3"
  }
}
```

**Project Structure**:
```
src/
├── server.js
├── config/
│   └── config.js
├── middleware/
│   ├── auth.js
│   └── metrics.js
├── routes/
│   ├── applications.js
│   ├── auth.js
│   ├── data-export.js
│   └── jobs.js
└── db/
    └── connection.js
```

### 2. database & staging-deploy (Hybrid Approach)

**Current State**: Both branches contain Node.js server code with database connectivity, but staging-deploy deploys as static site

**Key Components**:
- **Server Location**: `server.js` (root level)
- **Database**: MySQL2 with JWT authentication
- **Authentication**: JWT tokens with bcrypt password hashing

**Server Structure** (from staging-deploy):
```javascript
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool, testConnection, initializeDatabase } = require('./db/connection');
require('dotenv').config();
```

**Dependencies**:
```json
{
  "dependencies": {
    "bcrypt": "^6.0.0",
    "dotenv": "^17.2.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mysql2": "^3.14.3"
  }
}
```

**Deployment Confusion**:
- Procfile specifies: `web: bin/start-nginx-solo`
- But contains full Node.js server implementation
- Suggests recent migration from Node.js to static hosting

### 3. Minimal Static Servers (mobile, vanilla-only, vin-backend)

**Architecture**: Basic Express servers for static file hosting

**Common Structure**:
```javascript
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Handle trailing slashes - redirect to clean URLs
app.use((req, res, next) => {
  if (req.path !== '/' && req.path.endsWith('/')) {
    const cleanPath = req.path.slice(0, -1);
    return res.redirect(301, cleanPath + req.url.slice(req.path.length));
  }
  next();
});

// Serve static files
app.use(express.static(__dirname));
```

**Features**:
- No database connectivity
- No authentication
- Simple static file serving
- Clean URL handling

## Heroku Deployment Mapping

| Heroku App | Git Remote | URL Pattern | Likely Branch | Purpose |
|------------|------------|-------------|---------------|---------|
| **locumcalc-stage** | `heroku`, `staging-new` | Main staging environment | staging-deploy | Current staging |
| **locumcalc-demo** | `heroku-production` | Production environment | production-deploy | Production API |
| **locumcalc-demo-2e641e257df4** | `heroku-prod` | Alternative production | production-deploy | Production backup |
| **locumcalc-staging** | `heroku-staging` | Old staging environment | Unknown | Legacy staging |
| **fatigue-detection-api** | `heroku-assessment` | Unrelated project | N/A | Different project |

## Key Insights and Architectural Evolution

### 1. Development Timeline

Based on commit analysis, the project evolved through these phases:

1. **Phase 1**: Simple static site (vanilla-only, mobile)
2. **Phase 2**: Added basic authentication (database branch)
3. **Phase 3**: Full API implementation (production-deploy)
4. **Phase 4**: Return to static deployment (staging-deploy with NGINX)

### 2. Database Evolution

- **Early Development**: MySQL2 (possibly using JAWSDB on Heroku)
- **Production**: PostgreSQL (Heroku's native database)
- **Current Staging**: Static files only (no active database)

### 3. Architectural Conflicts

**staging-deploy Branch Confusion**:
- Contains full Node.js/MySQL server code
- But deploys as static site with NGINX
- Server.js exists but isn't used in deployment
- Represents incomplete migration from dynamic to static

**production-deploy Uniqueness**:
- 53 unique commits for API development
- Complete REST API implementation
- Production-ready security and error handling
- May still be actively serving API requests

### 4. Security Implementations

**Authentication Methods**:
- **production-deploy**: JWT with structured middleware
- **database/staging-deploy**: JWT with basic implementation
- **Others**: No authentication

**Security Headers**:
- **production-deploy**: Helmet with CSP configuration
- **Others**: Basic Express security only

## Recommendations

### If You Need Backend Functionality

1. **Use production-deploy as base**
   - Most complete implementation
   - Production-tested code
   - Proper security and error handling

2. **Migration considerations**
   - Convert PostgreSQL to MySQL if needed
   - Update environment variables
   - Test all API endpoints

### If You Want Static-Only Deployment

1. **Continue with staging-deploy approach**
   - Already configured for NGINX
   - No server maintenance needed
   - Lower hosting costs

2. **Cleanup tasks**
   - Remove unused server.js and database code
   - Remove Node.js dependencies from package.json
   - Update documentation

### For Branch Consolidation

1. **Before removing any branch**:
   ```bash
   # Create comprehensive backup
   git checkout production-deploy
   git checkout -b production-deploy-backup-YYYYMMDD
   
   # Document all unique features
   git log --oneline staging-deploy..production-deploy > unique-commits.txt
   ```

2. **Verify production usage**:
   - Check Heroku logs for API activity
   - Confirm no active users depend on APIs
   - Test all functionality in staging first

3. **Safe consolidation path**:
   - Merge necessary features to staging-deploy
   - Deploy and test thoroughly
   - Monitor for issues for at least 1 week
   - Only then consider branch removal

## Current Status Summary

- **Active Development**: staging-deploy (static site)
- **Production API**: production-deploy (may be active)
- **Legacy Branches**: database, mobile, vanilla-only, vin-backend
- **Deployment Model**: Transitioning from Node.js to static NGINX

## Next Steps

1. **Immediate Actions**:
   - Verify what's deployed to each Heroku app
   - Check production API usage logs
   - Document any active API consumers

2. **Architecture Decision**:
   - Decide between static-only vs API-enabled
   - If static: clean up Node.js code
   - If API: merge production-deploy improvements

3. **Branch Cleanup** (only after verification):
   - Backup all branches
   - Merge valuable features
   - Remove redundant branches
   - Update deployment documentation

---

*This analysis is based on branch inspection as of September 2025. Always verify current deployment status before making changes.*