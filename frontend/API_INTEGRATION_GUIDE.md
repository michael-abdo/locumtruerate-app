# API Integration Guide

## Overview
The API client has been successfully deployed to the frontend directory.

## Files Deployed
- `js/apiClient.js` - Main API client with all endpoints
- `js/auth.js` - Authentication helper
- `js/ui.js` - UI utilities (toasts, loading states)
- `js/api-integration.js` - Integration helper
- `api-integration-example.html` - Example usage

## Quick Start

### 1. Include Scripts in Your HTML
```html
<script src="js/apiClient.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui.js"></script>
<script src="js/api-integration.js"></script>
```

### 2. Use the Global API Instance
```javascript
// API client is available as window.api
const jobs = await api.getJobs({ limit: 10 });
```

### 3. Handle Authentication
```javascript
// Check if logged in
if (Auth.isLoggedIn()) {
    // User is authenticated
    const user = await api.getCurrentUser();
}

// Login
const result = await api.login(email, password);
Auth.login(result.token, result.user);
```

### 4. Show UI Feedback
```javascript
// Loading states
UI.showLoading(element);
// ... do work
UI.hideLoading(element);

// Notifications
UI.showSuccess('Operation completed!');
UI.showError('Something went wrong');
```

## Data Attributes for HTML

- `data-auth-required` - Show only when authenticated
- `data-auth-hidden` - Hide when authenticated
- `data-user-display` - Auto-populate with username

## Next Steps

1. Test the integration example: `api-integration-example.html`
2. Update existing pages to use live API data
3. Replace static content with API calls
4. Add loading states and error handling
5. Test authentication flow

## API Endpoints Available

See the full list in `apiClient.js` or refer to the API documentation.
