# Frontend Integration Testing Guide

## Overview
This document outlines comprehensive testing procedures for the LocumTrueRate frontend production deployment. All tests require a running backend API with the endpoints defined in the apiClient.js.

## Authentication Flow Testing

### Test Scenario 1: User Registration
**Steps:**
1. Navigate to `/frontend/locum-dashboard.html`
2. Click "Register" tab
3. Fill registration form:
   - Email: test@example.com
   - Password: TestPass123!
   - First Name: Test
   - Last Name: User
   - Role: locum
4. Submit form

**Expected Results:**
- ✅ Loading state displays during API call
- ✅ User is registered and logged in automatically
- ✅ Auth token is stored in localStorage
- ✅ Dashboard content shows instead of auth forms
- ✅ Success toast notification appears

### Test Scenario 2: User Login
**Steps:**
1. Navigate to `/frontend/locum-dashboard.html`
2. Fill login form with existing user credentials
3. Submit form

**Expected Results:**
- ✅ Loading state displays during API call
- ✅ User is logged in successfully
- ✅ Auth token is stored in localStorage
- ✅ Dashboard shows user-specific data
- ✅ Navigation shows user menu

### Test Scenario 3: Session Persistence
**Steps:**
1. Log in successfully
2. Refresh the page
3. Navigate to other pages

**Expected Results:**
- ✅ User remains logged in after refresh
- ✅ All protected pages recognize authentication
- ✅ Dashboard data loads automatically

### Test Scenario 4: Logout
**Steps:**
1. Log in successfully
2. Click logout button in navigation

**Expected Results:**
- ✅ Auth token is removed from localStorage
- ✅ User is redirected to home page
- ✅ All protected content becomes inaccessible

## Job Board Testing

### Test Scenario 5: Job Browsing
**Steps:**
1. Navigate to `/frontend/job-board.html`
2. Observe job listings without login

**Expected Results:**
- ✅ Jobs load from API automatically
- ✅ Jobs display in card format with all details
- ✅ Pagination works correctly
- ✅ Loading states appear during API calls

### Test Scenario 6: Job Search and Filtering
**Steps:**
1. Use search filters (location, specialty, etc.)
2. Submit search form
3. Try different filter combinations

**Expected Results:**
- ✅ Filter parameters sent to API correctly
- ✅ Results update based on filters
- ✅ "No results" state shows when appropriate
- ✅ Filter state persists during pagination

### Test Scenario 7: Job Application (Not Logged In)
**Steps:**
1. Click "Apply" on any job while not logged in

**Expected Results:**
- ✅ User is prompted to log in
- ✅ After login, application process continues
- ✅ Application is submitted successfully

### Test Scenario 8: Job Application (Logged In)
**Steps:**
1. Log in as locum user
2. Click "Apply" on a job
3. Fill application form
4. Submit application

**Expected Results:**
- ✅ Application modal opens
- ✅ User data is pre-filled where possible
- ✅ Application submits successfully
- ✅ Success notification appears
- ✅ Apply button changes to "Applied"

## Dashboard Testing

### Test Scenario 9: Locum Dashboard
**Steps:**
1. Log in as locum user
2. Navigate to locum dashboard
3. Check all dashboard sections

**Expected Results:**
- ✅ User applications load and display
- ✅ Application statuses are accurate
- ✅ Application dates format correctly
- ✅ Dashboard updates when new applications added

### Test Scenario 10: Recruiter Dashboard
**Steps:**
1. Log in as recruiter user
2. Navigate to recruiter dashboard
3. Test all recruiter functions

**Expected Results:**
- ✅ Posted jobs load from API
- ✅ Job posting form works correctly
- ✅ Job editing functions work
- ✅ Application viewing works
- ✅ Application status updates work

## Calculator Testing

### Test Scenario 11: Contract Calculator
**Steps:**
1. Navigate to `/frontend/contract-calculator.html`
2. Fill all required fields
3. Calculate contract
4. Save calculation (requires login)

**Expected Results:**
- ✅ Calculations performed via API
- ✅ Results display correctly formatted
- ✅ Loading states show during API calls
- ✅ Save functionality requires authentication
- ✅ Saved calculations persist in user account

### Test Scenario 12: Paycheck Calculator
**Steps:**
1. Navigate to `/frontend/paycheck-calculator.html`
2. Fill paycheck details
3. Calculate paycheck
4. Save calculation (requires login)

**Expected Results:**
- ✅ Calculations performed via API
- ✅ Tax calculations are accurate
- ✅ All pay components calculate correctly
- ✅ Save requires authentication
- ✅ Period changes recalculate correctly

## Error Handling Testing

### Test Scenario 13: Network Errors
**Steps:**
1. Disconnect from internet
2. Try various API operations
3. Reconnect and retry

**Expected Results:**
- ✅ Graceful error messages display
- ✅ No application crashes
- ✅ Operations retry successfully when connection restored

### Test Scenario 14: API Errors
**Steps:**
1. Test with invalid data
2. Test with expired tokens
3. Test with insufficient permissions

**Expected Results:**
- ✅ API error messages display to user
- ✅ Invalid tokens trigger re-authentication
- ✅ Permission errors show appropriate messages

## Performance Testing

### Test Scenario 15: Loading Performance
**Steps:**
1. Test all pages on slow connection
2. Monitor API call timing
3. Test with large datasets

**Expected Results:**
- ✅ Loading states prevent user confusion
- ✅ Pages remain responsive during API calls
- ✅ Large datasets paginate properly

## Cross-Browser Testing

### Test Scenario 16: Browser Compatibility
**Browsers to Test:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Expected Results:**
- ✅ All functionality works identically
- ✅ CSS styles render correctly
- ✅ JavaScript APIs work properly

## Mobile Testing

### Test Scenario 17: Mobile Responsiveness
**Steps:**
1. Test on various mobile screen sizes
2. Test touch interactions
3. Test mobile form inputs

**Expected Results:**
- ✅ All layouts are mobile-responsive
- ✅ Forms work properly on mobile
- ✅ Navigation is touch-friendly

## Test Automation

### API Endpoint Tests Required
```javascript
// Authentication Endpoints
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me

// Job Endpoints
GET  /api/v1/jobs
POST /api/v1/jobs
GET  /api/v1/jobs/:id
PUT  /api/v1/jobs/:id
DELETE /api/v1/jobs/:id
GET  /api/v1/jobs/my-posts

// Application Endpoints
POST /api/v1/applications
GET  /api/v1/applications/my-applications
GET  /api/v1/jobs/:jobId/applications
PUT  /api/v1/applications/:id/status

// Calculator Endpoints
POST /api/v1/calculators/contract
POST /api/v1/calculators/paycheck
POST /api/v1/calculators/save
GET  /api/v1/calculators/saved
```

## Manual Test Checklist

### Pre-Testing Setup
- [ ] Backend API server is running
- [ ] Database is populated with test data
- [ ] CORS is configured for frontend domain
- [ ] All environment variables are set

### Critical Path Tests
- [ ] User can register successfully
- [ ] User can login successfully  
- [ ] User can browse jobs
- [ ] User can apply to jobs
- [ ] User can view their applications
- [ ] Recruiter can post jobs
- [ ] Recruiter can view applications
- [ ] Calculators work correctly
- [ ] Data persists correctly

### Edge Case Tests
- [ ] Invalid login credentials
- [ ] Duplicate job applications
- [ ] Network timeouts
- [ ] Large datasets
- [ ] Empty states
- [ ] Error recovery

## Automated Testing Recommendations

### Unit Tests
- API client methods
- Authentication utilities
- Form validation functions
- Utility functions

### Integration Tests
- Full user workflows
- API error handling
- State management
- Local storage operations

### E2E Tests
- Complete user journeys
- Cross-page navigation
- Data persistence
- Real API interactions

## Security Testing

### Authentication Security
- [ ] Tokens expire properly
- [ ] Unauthorized access blocked
- [ ] Sensitive data not exposed
- [ ] XSS protection works
- [ ] CSRF protection active

### Data Validation
- [ ] Input sanitization
- [ ] SQL injection prevention
- [ ] File upload security
- [ ] Rate limiting works

---

**Note:** This testing guide should be executed systematically once the backend API is available. All tests should pass before production deployment.