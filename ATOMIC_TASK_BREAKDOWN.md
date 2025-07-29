# Frontend Integration - Atomic Task Breakdown

## Recent Updates (July 28, 2025)

### ✅ Dashboard Functionality Fixes Completed
- Fixed all QA test failures in recruiter dashboard
- Quick action cards now call correct functions
- Added toast notifications for user feedback
- Fixed filterJobs() to properly hide/show rows
- Standardized all toast notifications

### ✅ API Testing Completed
- Tested all deployed endpoints on Heroku staging
- Verified authentication, jobs, and applications endpoints working
- Identified calculator endpoints as not yet implemented

## Phase 1: Authentication System (2-3 hours)

### **Task 1.1: Create Authentication Modal HTML Structure** ✅ COMPLETED
**Time Estimate**: 30 minutes

#### **1.1.1** Create login modal HTML structure
- [x] Add login modal div with id `loginModal` to `frontend/js/common-utils.js`
- [x] Add modal backdrop div with class `modal-backdrop`
- [x] Add modal content div with class `modal-content`
- [x] Add modal header with title "Login to LocumTrueRate"
- [x] Add close button with class `modal-close` and onclick handler

#### **1.1.2** Create login form elements
- [x] Add form tag with id `loginForm` and prevent default submission
- [x] Add email input field with type="email", id="loginEmail", required attribute
- [x] Add email label with "Email Address" text
- [x] Add password input field with type="password", id="loginPassword", required attribute
- [x] Add password label with "Password" text
- [x] Add submit button with type="submit", id="loginSubmit", text "Login"
- [x] Add loading spinner element with id="loginSpinner", initially hidden

#### **1.1.3** Create register modal HTML structure
- [x] Add register modal div with id `registerModal`
- [x] Add modal backdrop div with class `modal-backdrop`
- [x] Add modal content div with class `modal-content`
- [x] Add modal header with title "Register for LocumTrueRate"
- [x] Add close button with class `modal-close` and onclick handler

#### **1.1.4** Create register form elements
- [x] Add form tag with id `registerForm` and prevent default submission
- [x] Add firstName input field with id="registerFirstName", required attribute
- [x] Add lastName input field with id="registerLastName", required attribute
- [x] Add email input field with type="email", id="registerEmail", required attribute
- [x] Add password input field with type="password", id="registerPassword", required attribute
- [x] Add password confirmation field with id="registerPasswordConfirm", required attribute
- [x] Add role selection dropdown with options: locum, recruiter
- [x] Add phone input field with id="registerPhone" (optional)
- [x] Add submit button with type="submit", id="registerSubmit", text "Create Account"
- [x] Add loading spinner element with id="registerSpinner", initially hidden

### **Task 1.2: Add Modal CSS Styling** ✅ COMPLETED
**Time Estimate**: 30 minutes

#### **1.2.1** Create modal base styles
- [x] Add CSS for `.modal-backdrop` with fixed position, full screen, dark overlay
- [x] Add CSS for `.modal-content` with centered positioning, white background
- [x] Add CSS for `.modal-header` with title styling and close button positioning
- [x] Add CSS for `.modal-close` with X styling and hover effects
- [x] Add responsive design for mobile devices (max-width: 768px)

#### **1.2.2** Create form styles
- [x] Add CSS for `.auth-form` with proper spacing and layout
- [x] Add CSS for `.form-group` with margin and flex layout
- [x] Add CSS for form labels with consistent typography
- [x] Add CSS for form inputs with border, padding, focus states
- [x] Add CSS for submit buttons with primary color and hover effects
- [x] Add CSS for loading spinner with rotation animation
- [x] Add CSS for error states (red borders, error text)

#### **1.2.3** Add modal animations
- [x] Add CSS keyframes for modal fade-in animation
- [x] Add CSS keyframes for modal slide-in animation
- [x] Add CSS transition effects for all interactive elements
- [x] Add CSS for modal close animation (fade-out)

### **Task 1.3: Implement Modal JavaScript Functionality** ✅ COMPLETED
**Time Estimate**: 45 minutes

#### **1.3.1** Create modal management functions
- [x] Add `showLoginModal()` function to common-utils.js
- [x] Add `hideLoginModal()` function to common-utils.js
- [x] Add `showRegisterModal()` function to common-utils.js
- [x] Add `hideRegisterModal()` function to common-utils.js
- [x] Add `switchToRegister()` function to switch from login to register
- [x] Add `switchToLogin()` function to switch from register to login

#### **1.3.2** Add modal event listeners
- [x] Add click event listener for login modal backdrop to close modal
- [x] Add click event listener for register modal backdrop to close modal
- [x] Add click event listeners for all modal close buttons
- [x] Add ESC key event listener to close modals
- [x] Add click event listener for "Create Account" link in login modal
- [x] Add click event listener for "Login" link in register modal

#### **1.3.3** Implement form validation
- [x] Add real-time email validation with regex pattern
- [x] Add password strength validation (minimum 6 characters)
- [x] Add password confirmation matching validation
- [x] Add first name and last name validation (not empty)
- [x] Add phone number format validation (optional field)
- [x] Add visual feedback for validation errors (red borders, error messages)
- [x] Add visual feedback for validation success (green borders)

### **Task 1.4: Connect Forms to API Endpoints** ⏳ IN PROGRESS
**Time Estimate**: 45 minutes

**Note**: Authentication modals are built and styled, but not yet connected to the API endpoints.

#### **1.4.1** Implement login form submission
- [ ] Add `handleLoginSubmit()` async function
- [ ] Add form data collection from login form inputs
- [ ] Add API call to `POST /api/v1/auth/register` with email and password
- [ ] Add loading state management (show spinner, disable button)
- [ ] Add error handling for API response errors
- [ ] Add success handling for valid login response
- [ ] Add JWT token storage to localStorage with key 'authToken'
- [ ] Add user data storage to localStorage with key 'userData'

#### **1.4.2** Implement register form submission
- [ ] Add `handleRegisterSubmit()` async function
- [ ] Add form data collection from all register form inputs
- [ ] Add API call to `POST /api/v1/auth/register` with all required fields
- [ ] Add loading state management (show spinner, disable button)
- [ ] Add error handling with specific error messages for each field
- [ ] Add success handling for valid registration response
- [ ] Add automatic login after successful registration
- [ ] Add JWT token and user data storage after registration

#### **1.4.3** Add API error handling
- [ ] Add handling for 400 validation errors with field-specific messages
- [ ] Add handling for 401 authentication errors
- [ ] Add handling for 409 conflict errors (email already exists)
- [ ] Add handling for 500 server errors with generic message
- [ ] Add handling for network errors (offline, timeout)
- [ ] Add toast notifications for all error types using existing toast system
- [ ] Add form reset functionality after successful submission

### **Task 1.5: Add Authentication State Management**
**Time Estimate**: 30 minutes

#### **1.5.1** Create authentication utility functions
- [ ] Add `isAuthenticated()` function to check if user has valid token
- [ ] Add `getAuthToken()` function to retrieve token from localStorage
- [ ] Add `getUserData()` function to retrieve user data from localStorage
- [ ] Add `logout()` function to clear token and user data
- [ ] Add `requireAuth()` function to redirect to login if not authenticated
- [ ] Add `updateAuthUI()` function to update navigation based on auth state

#### **1.5.2** Add token validation and refresh
- [ ] Add JWT token expiration check functionality
- [ ] Add automatic token refresh logic (if backend supports it)
- [ ] Add automatic logout when token expires
- [ ] Add warning before token expires (5 minutes before)
- [ ] Add session timeout handling with user notification

### **Task 1.6: Integrate Authentication into All Dashboard Pages**
**Time Estimate**: 45 minutes

#### **1.6.1** Update recruiter dashboard
- [ ] Open `frontend/recruiter-dashboard.html`
- [ ] Add authentication check on page load
- [ ] Add login button/link in navigation when not authenticated
- [ ] Replace existing logout functionality with proper API logout
- [ ] Add user name display in header when authenticated
- [ ] Add redirect to login modal when authentication required
- [ ] Test all authentication flows on recruiter dashboard

#### **1.6.2** Update locum dashboard
- [ ] Open `frontend/locum-dashboard.html`
- [ ] Add authentication check on page load
- [ ] Add login button/link in navigation when not authenticated
- [ ] Replace existing logout functionality with proper API logout
- [ ] Add user name display in header when authenticated
- [ ] Add redirect to login modal when authentication required
- [ ] Test all authentication flows on locum dashboard

#### **1.6.3** Update admin dashboard
- [ ] Open `frontend/admin-dashboard.html`
- [ ] Add authentication check on page load with admin role check
- [ ] Add login button/link in navigation when not authenticated
- [ ] Replace mock authentication with real API authentication
- [ ] Add user name display in header when authenticated
- [ ] Add redirect to login modal when authentication required
- [ ] Add role-based access control (admin only)
- [ ] Test all authentication flows on admin dashboard

#### **1.6.4** Update main navigation
- [ ] Open `frontend/index.html`
- [ ] Add login/register buttons to main navigation when not authenticated
- [ ] Add user dropdown menu when authenticated (logout, profile)
- [ ] Add authentication state checks on page load
- [ ] Update all dashboard links to check authentication before navigation
- [ ] Add consistent authentication UI across all pages

---

## Phase 2: Calculator APIs (4-5 hours)

### **Task 2.1: Create Backend Database Schema**
**Time Estimate**: 45 minutes

#### **2.1.1** Design calculations database table
- [ ] Open `src/db/init.sql`
- [ ] Add `calculations` table with id (SERIAL PRIMARY KEY)
- [ ] Add user_id column (INTEGER, FOREIGN KEY to users.id)
- [ ] Add calculation_type column (VARCHAR(50), 'paycheck' or 'contract')
- [ ] Add calculation_data column (JSONB for storing calculation parameters)
- [ ] Add results_data column (JSONB for storing calculation results)
- [ ] Add title column (VARCHAR(255) for user-defined calculation names)
- [ ] Add created_at column (TIMESTAMP WITH TIME ZONE)
- [ ] Add updated_at column (TIMESTAMP WITH TIME ZONE)
- [ ] Add INDEX on user_id for query performance
- [ ] Add INDEX on calculation_type for filtering

#### **2.1.2** Create database migration script
- [ ] Create `src/db/migrations/add_calculations_table.sql`
- [ ] Add DROP TABLE IF EXISTS calculations CASCADE
- [ ] Add complete CREATE TABLE statement with all columns and constraints
- [ ] Add INSERT statements for any default data if needed
- [ ] Test migration script on development database
- [ ] Add migration to deployment process

### **Task 2.2: Create Backend Calculation Model**
**Time Estimate**: 30 minutes

#### **2.2.1** Create Calculation model file
- [ ] Create `src/models/Calculation.js`
- [ ] Add database connection import
- [ ] Add `create()` static method with validation
- [ ] Add `findByUserId()` static method with pagination
- [ ] Add `findById()` static method with user ownership check
- [ ] Add `update()` static method with user ownership check
- [ ] Add `delete()` static method with user ownership check
- [ ] Add `findByType()` static method for filtering by calculation type

#### **2.2.2** Add calculation validation
- [ ] Add validation for calculation_type (must be 'paycheck' or 'contract')
- [ ] Add validation for calculation_data (must be valid JSON)
- [ ] Add validation for results_data (must be valid JSON)
- [ ] Add validation for title (max 255 characters, required)
- [ ] Add validation for user_id (must exist and match authenticated user)
- [ ] Add sanitization for all input fields

### **Task 2.3: Create Backend API Routes**
**Time Estimate**: 60 minutes

#### **2.3.1** Create calculations routes file
- [ ] Create `src/routes/calculations.js`
- [ ] Add express router import
- [ ] Add Calculation model import
- [ ] Add authentication middleware import
- [ ] Add validation middleware imports

#### **2.3.2** Implement calculations CRUD endpoints
- [ ] Add `GET /api/v1/calculations` - list user's calculations with pagination
- [ ] Add `POST /api/v1/calculations` - create new calculation with validation
- [ ] Add `GET /api/v1/calculations/:id` - get specific calculation by ID
- [ ] Add `PUT /api/v1/calculations/:id` - update calculation with ownership check
- [ ] Add `DELETE /api/v1/calculations/:id` - delete calculation with ownership check
- [ ] Add `GET /api/v1/calculations/type/:type` - filter by calculation type

#### **2.3.3** Add input validation schemas
- [ ] Open `src/validation/schemas.js`
- [ ] Add calculationSchemas object with create and update schemas
- [ ] Add validation for calculation_type field
- [ ] Add validation for calculation_data field structure
- [ ] Add validation for results_data field structure
- [ ] Add validation for title field (required, max length)
- [ ] Add validation for paycheck-specific fields
- [ ] Add validation for contract-specific fields

#### **2.3.4** Add route to main server
- [ ] Open `src/server.js`
- [ ] Import calculations routes: `const calculationsRoutes = require('./routes/calculations')`
- [ ] Add route mounting: `app.use('/api/v1/calculations', calculationsRoutes)`
- [ ] Test route registration with server restart

### **Task 2.4: Test Backend Calculator APIs**
**Time Estimate**: 30 minutes

#### **2.4.1** Test API endpoints with curl/Postman
- [ ] Test `POST /api/v1/calculations` with valid paycheck calculation data
- [ ] Test `POST /api/v1/calculations` with valid contract calculation data
- [ ] Test `GET /api/v1/calculations` to list user calculations
- [ ] Test `GET /api/v1/calculations/:id` to get specific calculation
- [ ] Test `PUT /api/v1/calculations/:id` to update calculation
- [ ] Test `DELETE /api/v1/calculations/:id` to delete calculation
- [ ] Test authentication requirements (401 without token)
- [ ] Test ownership requirements (403 for other user's calculations)

#### **2.4.2** Verify database operations
- [ ] Check that calculations are properly stored in database
- [ ] Verify user_id association is correct
- [ ] Verify JSON data is stored correctly in JSONB columns
- [ ] Verify timestamps are set correctly
- [ ] Check that soft deletes work if implemented
- [ ] Verify query performance with EXPLAIN ANALYZE

### **Task 2.5: Update Frontend Paycheck Calculator**
**Time Estimate**: 60 minutes

#### **2.5.1** Add API integration to paycheck calculator
- [ ] Open `frontend/paycheck-calculator.html`
- [ ] Find existing save functionality (currently localStorage)
- [ ] Add `saveCalculationToAPI()` async function
- [ ] Add `loadCalculationsFromAPI()` async function
- [ ] Add `deleteCalculationFromAPI()` async function
- [ ] Replace localStorage calls with API calls
- [ ] Add error handling for API failures with localStorage fallback

#### **2.5.2** Add save calculation UI
- [ ] Add "Save Calculation" button to paycheck calculator
- [ ] Add modal or form for entering calculation title
- [ ] Add loading state during save operation
- [ ] Add success/error toast notifications
- [ ] Add confirmation dialog for overwriting existing calculations
- [ ] Add input validation for calculation title

#### **2.5.3** Add load calculation functionality
- [ ] Add "Load Calculation" button or dropdown menu
- [ ] Add calculation history sidebar or modal
- [ ] Display list of saved calculations with titles and dates
- [ ] Add click handlers to load calculation data into form
- [ ] Add search/filter functionality for calculation history
- [ ] Add pagination for large number of calculations

#### **2.5.4** Add calculation management UI
- [ ] Add "Delete" buttons for each saved calculation
- [ ] Add confirmation dialog for calculation deletion
- [ ] Add "Rename" functionality for calculation titles
- [ ] Add "Duplicate" functionality to copy calculations
- [ ] Add export functionality for calculation data
- [ ] Add calculation sharing functionality (if required)

### **Task 2.6: Update Frontend Contract Calculator**
**Time Estimate**: 60 minutes

#### **2.6.1** Add API integration to contract calculator
- [ ] Open `frontend/contract-calculator.html`
- [ ] Find existing save functionality (currently localStorage)
- [ ] Add `saveCalculationToAPI()` async function
- [ ] Add `loadCalculationsFromAPI()` async function
- [ ] Add `deleteCalculationFromAPI()` async function
- [ ] Replace localStorage calls with API calls
- [ ] Add error handling for API failures with localStorage fallback

#### **2.6.2** Add save calculation UI
- [ ] Add "Save Calculation" button to contract calculator
- [ ] Add modal or form for entering calculation title
- [ ] Add loading state during save operation
- [ ] Add success/error toast notifications
- [ ] Add confirmation dialog for overwriting existing calculations
- [ ] Add input validation for calculation title

#### **2.6.3** Add load calculation functionality
- [ ] Add "Load Calculation" button or dropdown menu
- [ ] Add calculation history sidebar or modal
- [ ] Display list of saved calculations with titles and dates
- [ ] Add click handlers to load calculation data into form
- [ ] Add search/filter functionality for calculation history
- [ ] Add pagination for large number of calculations

#### **2.6.4** Add calculation management UI
- [ ] Add "Delete" buttons for each saved calculation
- [ ] Add confirmation dialog for calculation deletion
- [ ] Add "Rename" functionality for calculation titles
- [ ] Add "Duplicate" functionality to copy calculations
- [ ] Add export functionality for calculation data
- [ ] Add calculation sharing functionality (if required)

### **Task 2.7: Create Calculation History Page**
**Time Estimate**: 45 minutes

#### **2.7.1** Create calculation history HTML page
- [ ] Create `frontend/calculation-history.html`
- [ ] Add page header with title "My Saved Calculations"
- [ ] Add navigation breadcrumbs
- [ ] Add filter/search section (by type, date, title)
- [ ] Add calculations list container
- [ ] Add pagination controls
- [ ] Add "New Calculation" buttons for each type

#### **2.7.2** Add calculation history JavaScript
- [ ] Add `loadCalculationHistory()` function
- [ ] Add `filterCalculations()` function for search/filter
- [ ] Add `deleteCalculation()` function with confirmation
- [ ] Add `duplicateCalculation()` function
- [ ] Add `exportCalculation()` function
- [ ] Add pagination logic for large datasets
- [ ] Add sorting functionality (by date, title, type)

#### **2.7.3** Style calculation history page
- [ ] Add CSS for calculation cards/list items
- [ ] Add CSS for filter and search controls
- [ ] Add CSS for pagination controls
- [ ] Add CSS for action buttons (edit, delete, duplicate)
- [ ] Add CSS for empty state (no calculations found)
- [ ] Add responsive design for mobile devices
- [ ] Add CSS for calculation type badges/icons

---

## Phase 3: Job Applications (2 hours)

### **Task 3.1: Connect Apply Buttons to API**
**Time Estimate**: 60 minutes

#### **3.1.1** Find and audit all Apply buttons
- [ ] Search all HTML files for "Apply", "apply", or buttons with apply functionality
- [ ] List all locations of Apply buttons:
  - `frontend/job-board.html` - Apply buttons in job cards
  - `frontend/index.html` - Any Apply buttons on homepage
  - Any other pages with job listings
- [ ] Document current Apply button behavior (modals, links, etc.)
- [ ] Identify which Apply buttons need API integration

#### **3.1.2** Create application submission modal
- [ ] Add application modal HTML structure to common-utils.js
- [ ] Add modal with id `applicationModal`
- [ ] Add form with id `applicationForm`
- [ ] Add hidden input for job ID
- [ ] Add cover letter textarea (required, max 5000 characters)
- [ ] Add expected rate input (optional, number)
- [ ] Add available date input (optional, date picker)
- [ ] Add notes textarea (optional, max 1000 characters)
- [ ] Add submit button with loading state
- [ ] Add cancel/close button

#### **3.1.3** Add application modal styling
- [ ] Add CSS for application modal layout
- [ ] Add CSS for form fields with proper spacing
- [ ] Add CSS for character counters on text areas
- [ ] Add CSS for date picker styling
- [ ] Add CSS for submit button states (normal, loading, disabled)
- [ ] Add CSS for validation error states
- [ ] Add responsive design for mobile devices

#### **3.1.4** Implement Apply button functionality
- [ ] Add click event listeners to all Apply buttons
- [ ] Add authentication check before showing application modal
- [ ] Add job data extraction from Apply button context
- [ ] Add `showApplicationModal(jobId, jobTitle)` function
- [ ] Add form validation for cover letter length
- [ ] Add form validation for expected rate (if provided)
- [ ] Add form validation for available date (if provided)

#### **3.1.5** Connect application submission to API
- [ ] Add `submitApplication()` async function
- [ ] Collect form data including jobId, coverLetter, expectedRate, notes
- [ ] Add API call to `POST /api/v1/applications`
- [ ] Add authentication headers with JWT token
- [ ] Add loading state management during submission
- [ ] Add error handling for API responses (400, 401, 409, 500)
- [ ] Add success handling with confirmation message
- [ ] Add form reset after successful submission

### **Task 3.2: Add Application Tracking and History**
**Time Estimate**: 60 minutes

#### **3.2.1** Create application status display
- [ ] Add application status badges to job listings
- [ ] Add status indicators: "Applied", "Under Review", "Accepted", "Rejected"
- [ ] Add visual styling for each status type (colors, icons)
- [ ] Add application date display
- [ ] Add "Application Status" section to job detail modals
- [ ] Update Apply buttons to show "Applied" state when user has applied

#### **3.2.2** Create My Applications page
- [ ] Create `frontend/my-applications.html`
- [ ] Add page header with title "My Job Applications"
- [ ] Add filter controls (by status, date, company)
- [ ] Add search functionality for job titles/companies
- [ ] Add applications list container
- [ ] Add pagination controls for large datasets
- [ ] Add sorting functionality (by date, status, company)

#### **3.2.3** Implement applications list functionality
- [ ] Add `loadMyApplications()` async function
- [ ] Add API call to `GET /api/v1/applications`
- [ ] Add authentication headers with JWT token
- [ ] Add error handling for API responses
- [ ] Add application card/list item rendering
- [ ] Add application details modal for each application
- [ ] Add "View Job" links to original job postings

#### **3.2.4** Add application management features
- [ ] Add "Withdraw Application" functionality (if allowed by API)
- [ ] Add "Edit Application" functionality (if allowed by API)
- [ ] Add application notes/communication history
- [ ] Add application export functionality
- [ ] Add email notifications for status changes (if backend supports)
- [ ] Add application analytics (response rate, average time to response)

#### **3.2.5** Add application status updates
- [ ] Add automatic status checking on page load
- [ ] Add real-time status updates (if WebSocket available)
- [ ] Add status change notifications using toast system
- [ ] Add status history tracking (when status changed)
- [ ] Add email notifications for status changes
- [ ] Add browser notifications for important status changes

#### **3.2.6** Update navigation and user flow
- [ ] Add "My Applications" link to authenticated user navigation
- [ ] Add application count badges in navigation (if any pending)
- [ ] Add quick access to applications from user profile dropdown
- [ ] Add links from job listings to application status
- [ ] Add breadcrumb navigation between jobs and applications
- [ ] Add deep linking to specific applications

### **Task 3.3: Test End-to-End Application Flow**
**Time Estimate**: 30 minutes

#### **3.3.1** Test complete application workflow
- [ ] Test user authentication and login
- [ ] Navigate to job board and verify job listings load from API
- [ ] Click Apply button and verify modal opens with job information
- [ ] Fill out application form with valid data
- [ ] Submit application and verify API call succeeds
- [ ] Verify success message displays and modal closes
- [ ] Navigate to My Applications page
- [ ] Verify application appears in list with correct status
- [ ] Test application detail view

#### **3.3.2** Test error scenarios
- [ ] Test applying without authentication (should prompt login)
- [ ] Test applying to same job twice (should show error)
- [ ] Test submitting application with invalid data
- [ ] Test network errors during application submission
- [ ] Test API errors (server down, invalid responses)
- [ ] Verify all error messages are user-friendly
- [ ] Verify error states don't break the application

#### **3.3.3** Test cross-browser compatibility
- [ ] Test complete flow in Chrome (latest)
- [ ] Test complete flow in Firefox (latest)
- [ ] Test complete flow in Safari (latest)
- [ ] Test complete flow in Edge (latest)
- [ ] Test mobile responsiveness on iOS Safari
- [ ] Test mobile responsiveness on Android Chrome
- [ ] Verify all functionality works across browsers

---

## Deployment and Final Testing

### **Task 4.1: Deploy Updates to Production**
**Time Estimate**: 30 minutes

#### **4.1.1** Deploy backend changes
- [ ] Commit all backend changes to git
- [ ] Push changes to GitHub repository
- [ ] Deploy to Heroku staging environment
- [ ] Run database migrations on production database
- [ ] Verify all new API endpoints work in production
- [ ] Test authentication with production environment

#### **4.1.2** Deploy frontend changes
- [ ] Commit all frontend changes to git
- [ ] Push changes to GitHub repository
- [ ] Verify frontend loads correctly in production
- [ ] Test all API integrations with production backend
- [ ] Verify authentication flows work end-to-end

### **Task 4.2: Final End-to-End Testing**
**Time Estimate**: 30 minutes

#### **4.2.1** Test complete user journey
- [ ] Register new user account
- [ ] Log in with new account
- [ ] Create and save paycheck calculation
- [ ] Create and save contract calculation
- [ ] Browse job listings
- [ ] Apply to multiple jobs
- [ ] View application history
- [ ] Log out and log back in
- [ ] Verify all data persists correctly

#### **4.2.2** Performance and usability testing
- [ ] Test page load times for all pages
- [ ] Test API response times for all endpoints
- [ ] Test with slow network conditions
- [ ] Test with large datasets (many calculations, applications)
- [ ] Verify all loading states work correctly
- [ ] Verify all error states are handled gracefully

---

## **Summary**

**Total Tasks**: 126 atomic tasks across 3 phases
**Total Estimated Time**: 8-10 hours
**Files to be Modified**: ~15 files
**New Files to be Created**: ~8 files

**Critical Dependencies**:
- Phase 1 must be completed before Phase 3 (authentication required)
- Backend APIs in Phase 2 must be completed before frontend integration
- Database migrations must be run before API testing

**Success Criteria**:
- Users can register, login, and maintain authenticated sessions
- Calculator data persists across sessions and devices
- Job applications can be submitted and tracked
- All functionality works in production environment
- All error cases are handled gracefully with user-friendly messages