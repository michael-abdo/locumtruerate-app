# CORS Configuration Guide for Production Deployment

## Overview
Cross-Origin Resource Sharing (CORS) must be properly configured on the backend to allow the LocumTrueRate frontend to communicate with the API from different domains.

## Required CORS Configuration

### Development Environment
```javascript
// Backend CORS configuration for development
const corsOptions = {
    origin: [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
};
```

### Staging Environment
```javascript
// Backend CORS configuration for staging
const corsOptions = {
    origin: [
        'https://locumtruerate-stage.herokuapp.com',
        'https://staging.locumtruerate.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
};
```

### Production Environment
```javascript
// Backend CORS configuration for production
const corsOptions = {
    origin: [
        'https://locumtruerate.herokuapp.com',
        'https://app.locumtruerate.com',
        'https://www.locumtruerate.com',
        'https://truerate.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
};
```

## Framework-Specific Implementation

### Express.js with cors package
```javascript
const cors = require('cors');
const express = require('express');
const app = express();

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));
```

### Express.js Manual Implementation
```javascript
app.use((req, res, next) => {
    const allowedOrigins = [
        'https://locumtruerate.herokuapp.com',
        'https://app.locumtruerate.com'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count,X-Page-Count');
    res.setHeader('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    next();
});
```

### NestJS Implementation
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    app.enableCors({
        origin: [
            'https://locumtruerate.herokuapp.com',
            'https://app.locumtruerate.com'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin'
        ]
    });
    
    await app.listen(process.env.PORT || 4000);
}
```

### Django Implementation
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "https://locumtruerate.herokuapp.com",
    "https://app.locumtruerate.com",
]

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_EXPOSE_HEADERS = [
    'x-total-count',
    'x-page-count',
]

# Install: pip install django-cors-headers
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

MIDDLEWARE = [
    ...
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]
```

## Environment-Specific Configuration

### Dynamic CORS Configuration
```javascript
// Get allowed origins from environment variables
const getAllowedOrigins = () => {
    const environment = process.env.NODE_ENV || 'development';
    
    switch (environment) {
        case 'development':
            return [
                'http://localhost:3000',
                'http://localhost:8080',
                'http://127.0.0.1:3000'
            ];
        case 'staging':
            return [
                'https://locumtruerate-stage.herokuapp.com',
                'https://staging.locumtruerate.com'
            ];
        case 'production':
            return [
                'https://locumtruerate.herokuapp.com',
                'https://app.locumtruerate.com',
                'https://www.locumtruerate.com'
            ];
        default:
            return ['http://localhost:3000'];
    }
};

const corsOptions = {
    origin: getAllowedOrigins(),
    credentials: true,
    // ... other options
};
```

## Frontend Requirements

### Required Headers
The frontend sends these headers that must be allowed by CORS:
- `Content-Type: application/json`
- `Authorization: Bearer <token>`
- `Accept: application/json`
- `Origin: <frontend-domain>`

### Credential Requirements
- The frontend uses `credentials: 'include'` for authenticated requests
- Backend must set `Access-Control-Allow-Credentials: true`

## Common CORS Issues and Solutions

### Issue 1: Preflight Request Failures
**Error**: `CORS preflight request failed`
**Solution**: Ensure OPTIONS method is allowed and properly handled

```javascript
// Ensure OPTIONS requests are handled
app.options('*', cors(corsOptions));
```

### Issue 2: Missing Authorization Header
**Error**: `Request header field Authorization is not allowed`
**Solution**: Add Authorization to allowed headers

```javascript
allowedHeaders: [
    'Content-Type',
    'Authorization', // This must be included
    'X-Requested-With',
    'Accept',
    'Origin'
]
```

### Issue 3: Wildcard Origin with Credentials
**Error**: `Cannot use wildcard in Access-Control-Allow-Origin when credentials are true`
**Solution**: Specify exact origins instead of '*'

```javascript
// ❌ Wrong
origin: '*',
credentials: true

// ✅ Correct
origin: ['https://app.locumtruerate.com'],
credentials: true
```

### Issue 4: Missing Exposed Headers
**Error**: Response headers not accessible in frontend
**Solution**: Add headers to exposedHeaders

```javascript
exposedHeaders: ['X-Total-Count', 'X-Page-Count', 'X-RateLimit-Remaining']
```

## Testing CORS Configuration

### Manual Testing with curl
```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://app.locumtruerate.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v \
  https://api.locumtruerate.com/v1/auth/login

# Test actual request
curl -X POST \
  -H "Origin: https://app.locumtruerate.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  -v \
  https://api.locumtruerate.com/v1/auth/login
```

### Browser Testing
1. Open browser developer tools
2. Navigate to frontend application
3. Attempt API calls
4. Check for CORS errors in console
5. Verify Network tab shows successful OPTIONS requests

## Deployment Checklist

### Backend Configuration
- [ ] CORS middleware is installed and configured
- [ ] Allowed origins include all frontend domains
- [ ] credentials: true is set if authentication is used
- [ ] All required headers are in allowedHeaders
- [ ] OPTIONS method is properly handled
- [ ] Preflight cache is configured (maxAge)

### Frontend Verification
- [ ] API calls work from all frontend domains
- [ ] Authentication works across origins
- [ ] No CORS errors in browser console
- [ ] Preflight requests complete successfully

### Environment Testing
- [ ] Development environment CORS works
- [ ] Staging environment CORS works
- [ ] Production environment CORS works
- [ ] All subdomains are properly configured

## Security Considerations

### Origin Validation
- Always specify exact origins in production
- Never use wildcards with credentials
- Validate origins dynamically if needed

### Header Restrictions
- Only allow necessary headers
- Don't expose sensitive internal headers
- Use appropriate cache times for preflight

### Credential Handling
- Only enable credentials if authentication is required
- Ensure secure cookie settings work with CORS
- Test authentication across all configured origins

---

**Important**: CORS configuration must be implemented on the backend server. This documentation should be shared with backend developers to ensure proper implementation.