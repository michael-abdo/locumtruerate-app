# Production Deployment Configuration Guide

## API Endpoint Configuration

The LocumTrueRate frontend automatically detects the appropriate API endpoint based on the deployment environment. This guide explains how to configure API endpoints for different deployment scenarios.

## Environment Detection

The API client (`apiClient.js`) automatically detects the environment based on the hostname:

### Development
- **Hostnames**: `localhost`, `127.0.0.1`
- **API URL**: `http://localhost:4000/api/v1`
- **Debug Mode**: Enabled

### Staging
- **Hostnames**: Contains `locumtruerate-stage` or `staging`
- **API URL**: `https://[hostname]/api/v1`
- **Debug Mode**: Enabled

### Production
- **Hostnames**: Contains `herokuapp.com`, `locumtruerate.com`, or `truerate.app`
- **API URL**: Varies by deployment type (see below)
- **Debug Mode**: Disabled

## Production API Configuration Options

### Option 1: Same-Origin Deployment (Recommended for Heroku)
```
Frontend: https://locumtruerate.herokuapp.com
Backend:  https://locumtruerate.herokuapp.com/api/v1
```
- ✅ Simplest CORS setup
- ✅ Single domain SSL certificate
- ✅ No additional DNS configuration

### Option 2: API Subdomain
```
Frontend: https://app.locumtruerate.com
Backend:  https://api.locumtruerate.com/v1
```
- ✅ Clean separation of concerns
- ⚠️ Requires CORS configuration
- ⚠️ Requires additional DNS setup

### Option 3: Custom Port (IP-based deployment)
```
Frontend: https://192.168.1.100
Backend:  https://192.168.1.100:8080/api/v1
```
- ✅ Works with server deployments
- ⚠️ Requires firewall configuration

## Manual Configuration Override

### Method 1: Environment Configuration File
Include `env-config.js` before other scripts:
```html
<script src="js/env-config.js"></script>
<script src="js/apiClient.js"></script>
```

Then override in deployment script:
```javascript
window.setEnvironmentConfig({
    API_BASE_URL: 'https://your-api-domain.com/v1',
    DEBUG_MODE: false
});
```

### Method 2: Environment Variables (Build-time)
For build systems that support environment variables:
```bash
export API_BASE_URL="https://api.locumtruerate.com/v1"
export DEBUG_MODE="false"
```

### Method 3: Runtime Configuration
Set configuration before loading the API client:
```html
<script>
window.ENV = {
    API_BASE_URL: 'https://api.locumtruerate.com/v1',
    DEBUG_MODE: false
};
</script>
<script src="js/apiClient.js"></script>
```

## Heroku Deployment Configuration

### Static Site Deployment (Current Setup)
The current setup uses Heroku with the nginx buildpack for static file serving.

**Required files:**
- `Procfile`: Contains `web: bin/start-nginx-solo`
- `config/nginx.conf.erb`: NGINX configuration for static files

**API Configuration:**
The frontend will automatically use the same origin as the backend:
```
Frontend: https://locumtruerate-stage.herokuapp.com
API:      https://locumtruerate-stage.herokuapp.com/api/v1
```

### Backend API Requirements
The backend must:
1. Serve API endpoints under `/api/v1/` path
2. Configure CORS for the frontend domain
3. Handle both frontend routes and API routes

## CORS Configuration Requirements

### Development CORS
```javascript
// Backend CORS config for development
cors({
    origin: ['http://localhost:3000', 'http://localhost:8080'],
    credentials: true
})
```

### Staging CORS
```javascript
// Backend CORS config for staging
cors({
    origin: ['https://locumtruerate-stage.herokuapp.com'],
    credentials: true
})
```

### Production CORS
```javascript
// Backend CORS config for production
cors({
    origin: ['https://locumtruerate.herokuapp.com', 'https://app.locumtruerate.com'],
    credentials: true
})
```

## Deployment Checklist

### Pre-Deployment
- [ ] Backend API is running and accessible
- [ ] All required API endpoints are implemented
- [ ] CORS is configured for the frontend domain
- [ ] SSL certificates are configured (HTTPS)

### Environment Configuration
- [ ] API_BASE_URL is correctly set for the environment
- [ ] DEBUG_MODE is disabled in production
- [ ] All environment variables are configured

### Testing
- [ ] API connectivity test from frontend domain
- [ ] Authentication flow works end-to-end
- [ ] All major features function correctly
- [ ] Error handling works properly

### Post-Deployment
- [ ] Monitor API response times
- [ ] Check browser console for errors
- [ ] Verify HTTPS is working
- [ ] Test on multiple devices/browsers

## Troubleshooting Common Issues

### CORS Errors
```
Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' 
has been blocked by CORS policy
```
**Solution**: Configure CORS on the backend to allow the frontend domain.

### 404 API Errors
```
GET https://example.com/api/v1/jobs 404 (Not Found)
```
**Solutions**:
1. Verify the backend is serving API routes under `/api/v1/`
2. Check if the API base URL is correctly configured
3. Ensure the backend is running and accessible

### SSL Certificate Errors
```
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```
**Solution**: Ensure the API URL uses HTTPS in production.

### Authentication Token Issues
```
401 Unauthorized errors after successful login
```
**Solutions**:
1. Check token storage in localStorage
2. Verify token format and expiration
3. Ensure CORS allows credentials

## Environment-Specific Deployment Examples

### Heroku Production Deployment
```bash
# Deploy frontend to Heroku
git push heroku production-deploy:main

# Verify API configuration
curl https://your-app.herokuapp.com/api/v1/health

# Check frontend connectivity
open https://your-app.herokuapp.com
```

### Custom Domain Deployment
```bash
# Set custom API URL
heroku config:set API_BASE_URL=https://api.yourcompany.com/v1

# Configure DNS
# A record: api.yourcompany.com -> your-backend-ip
# CNAME record: app.yourcompany.com -> your-frontend-host
```

---

**Note**: Always test the complete user flow after deployment to ensure all integrations work correctly in the production environment.