# LocumTrueRate Frontend API Client

This directory contains the JavaScript API client and helper modules for integrating the LocumTrueRate frontend with the backend API.

## Files

### Core Modules

1. **`js/apiClient.js`** - Main API client class
   - Handles all HTTP requests to the backend
   - Automatic error handling and retry logic
   - JWT token management
   - Methods for all API endpoints

2. **`js/auth.js`** - Authentication helper
   - Token storage and retrieval
   - User session management
   - Role-based access helpers
   - Login state persistence

3. **`js/ui.js`** - UI utilities
   - Toast notifications (success, error, info, warning)
   - Loading states and spinners
   - Non-blocking confirmation dialogs
   - Form management utilities

### Demo

- **`api-client-demo.html`** - Interactive demo showing how to use all three modules together

## Quick Start

### 1. Include the Scripts

```html
<script src="js/apiClient.js"></script>
<script src="js/auth.js"></script>
<script src="js/ui.js"></script>
```

### 2. Initialize

```javascript
// Create API client instance
const api = new ApiClient();

// Initialize UI helpers
UI.init();

// Check if user is logged in
if (Auth.isLoggedIn()) {
    api.setAuthToken(Auth.getToken());
}
```

### 3. Make API Calls

```javascript
// Login
try {
    const response = await api.login('user@example.com', 'password');
    Auth.login(response.token, response.user);
    UI.showSuccess('Login successful!');
} catch (error) {
    UI.showError(error.message);
}

// Get jobs
try {
    const jobs = await api.getJobs({ state: 'CA', limit: 10 });
    console.log(jobs);
} catch (error) {
    UI.showError('Failed to load jobs');
}
```

## API Client Methods

### Authentication
- `register(userData)` - Register new user
- `login(email, password)` - Login user
- `logout()` - Logout current user
- `getCurrentUser()` - Get user profile

### Jobs
- `getJobs(filters)` - List jobs with filters
- `getJob(id)` - Get single job
- `createJob(jobData)` - Create job (auth required)
- `updateJob(id, jobData)` - Update job (auth required)
- `deleteJob(id)` - Delete job (auth required)

### Applications
- `applyToJob(applicationData)` - Submit application
- `getMyApplications(options)` - Get user's applications
- `getApplicationsForJob(jobId, options)` - Get job applications (recruiter)
- `searchMyApplications(searchOptions)` - Search applications
- `updateApplicationStatus(id, statusData)` - Update status (recruiter)
- `withdrawApplication(id)` - Withdraw application

### Calculators
- `calculateContract(contractData)` - Contract earnings calculator
- `calculatePaycheck(paycheckData)` - Paycheck calculator
- `calculateSimplePaycheck(simplePaycheckData)` - Simple calculator
- `getTaxInfo()` - Get tax brackets
- `getStates()` - Get states with tax rates

### GDPR/Data Export
- `exportMyData(exportOptions)` - Export user data
- `getPrivacySummary()` - Get privacy info
- `getDataDeletionInfo()` - Get deletion info

## Auth Helper Methods

### Token Management
- `Auth.setToken(token, expiresIn)` - Store JWT token
- `Auth.getToken()` - Get current token
- `Auth.clearToken()` - Remove token
- `Auth.isLoggedIn()` - Check login status

### User Management
- `Auth.setCurrentUser(user)` - Store user data
- `Auth.getCurrentUser()` - Get user data
- `Auth.getUserRole()` - Get user role
- `Auth.getUserDisplayName()` - Get display name

### Role Checks
- `Auth.isRecruiter()` - Check if recruiter
- `Auth.isLocum()` - Check if locum
- `Auth.isAdmin()` - Check if admin

### Utilities
- `Auth.login(token, user, expiresIn)` - Handle login
- `Auth.logout()` - Handle logout
- `Auth.requireAuth(returnUrl)` - Redirect if not authenticated

## UI Helper Methods

### Notifications
- `UI.showToast(message, type, duration)` - Show toast
- `UI.showSuccess(message)` - Success toast
- `UI.showError(message)` - Error toast
- `UI.showInfo(message)` - Info toast
- `UI.showWarning(message)` - Warning toast

### Loading States
- `UI.showLoading(element, message)` - Show spinner
- `UI.hideLoading(element)` - Hide spinner
- `UI.disableForm(form, disable)` - Disable form

### Dialogs
- `UI.showConfirm(message, onConfirm, onCancel)` - Confirmation dialog

## Error Handling

The API client automatically handles common errors:

```javascript
try {
    const data = await api.someMethod();
    // Handle success
} catch (error) {
    if (error.statusCode === 401) {
        // Token expired - redirect to login
        Auth.logout();
        window.location.href = '/login.html';
    } else if (error.statusCode === 0) {
        // Network error
        UI.showError('Network error. Please check your connection.');
    } else {
        // Other API errors
        UI.showError(error.message);
    }
}
```

## Configuration

### API Base URL

```javascript
// Development
const api = new ApiClient('http://localhost:4000/api/v1');

// Production
const api = new ApiClient('https://api.locumtruerate.com/api/v1');
```

### Environment Detection

```javascript
const isDevelopment = window.location.hostname === 'localhost';
const baseUrl = isDevelopment 
    ? 'http://localhost:4000/api/v1'
    : 'https://api.locumtruerate.com/api/v1';

const api = new ApiClient(baseUrl);
```

## Integration Example

```javascript
// On page load
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize
    UI.init();
    const api = new ApiClient();
    
    // Check authentication
    if (Auth.isLoggedIn()) {
        api.setAuthToken(Auth.getToken());
        
        // Load user data
        try {
            const user = await api.getCurrentUser();
            Auth.setCurrentUser(user);
            displayUserDashboard();
        } catch (error) {
            // Token invalid
            Auth.logout();
            window.location.href = '/login.html';
        }
    } else {
        // Show login form
        showLoginForm();
    }
});
```

## Best Practices

1. **Always handle errors** - Use try/catch blocks
2. **Show loading states** - Use UI.showLoading/hideLoading
3. **Provide user feedback** - Use toast notifications
4. **Check authentication** - Use Auth.requireAuth() for protected pages
5. **Clean up on logout** - Clear all sensitive data

## Testing

Open `api-client-demo.html` in a browser to test all functionality:

1. Start the backend server: `npm start`
2. Open `api-client-demo.html`
3. Test authentication (login/register)
4. Test API calls (jobs, calculators)
5. Check error handling (stop server, try calls)

## Next Steps

1. Update existing frontend pages to use the API client
2. Replace hardcoded data with API calls
3. Add authentication to dashboards
4. Implement real-time calculations
5. Add application functionality