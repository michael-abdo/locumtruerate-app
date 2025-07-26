# Day 11: Job Board API Integration - Simplified Direct UI Update

**Estimated Total Time:** 5-6 hours  
**Approach:** Direct UI updates without adaptation layers  
**Complexity:** Medium  

---

## Phase 1: Update Job Card Rendering (30 minutes)

### Task 1.1: Update renderJobs Function (15 minutes)

#### Step 1.1.1: Update job card HTML template
- [ ] Open `frontend/job-board.html`
- [ ] Locate `renderJobs()` function
- [ ] Find job card HTML template inside the function
- [ ] Update `${job.facility}` to `${job.companyName || 'Healthcare Facility'}`
- [ ] Update `${job.salary}` to `$${job.hourlyRateMin}-${job.hourlyRateMax}/hr`
- [ ] Update `${job.duration}` to `${job.duration || '13 weeks'}`
- [ ] Update `${job.hours}` to `${job.shiftType || '40 hrs/week'}`
- [ ] Update `${job.housing}` to `${job.housingStipend || 'Inquire'}`
- [ ] Update location display to handle full location string

#### Step 1.1.2: Update job detail modal
- [ ] Locate `showJobDetail()` function
- [ ] Update modal HTML template with same field mappings
- [ ] Handle null/undefined values with defaults
- [ ] Test modal displays correctly with sample API data

### Task 1.2: Update Specialty and State Displays (15 minutes)

#### Step 1.2.1: Fix specialty display
- [ ] Update specialty display to use API format directly
- [ ] Remove lowercase conversion (API uses proper case)
- [ ] Update filter options to match API values:
  - [ ] "emergency" → "Emergency Medicine"
  - [ ] "internal" → "Internal Medicine" 
  - [ ] "surgery" → "Surgery"
  - [ ] "radiology" → "Radiology"
  - [ ] "anesthesiology" → "Anesthesiology"

#### Step 1.2.2: Fix state display
- [ ] Update state filter options to use state codes:
  - [ ] "california" → "CA"
  - [ ] "texas" → "TX"
  - [ ] "florida" → "FL"
  - [ ] "new-york" → "NY"
  - [ ] "illinois" → "IL"

---

## Phase 2: Update Calculations and Filtering (40 minutes)

### Task 2.1: Update calculateTotalCompensation Function (10 minutes)

#### Step 2.1.1: Fix hourly rate calculation
- [ ] Locate `calculateTotalCompensation()` function
- [ ] Replace string parsing: `parseInt(job.salary.replace(/\$|\/hr/g, ''))`
- [ ] With API format: `(job.hourlyRateMin + job.hourlyRateMax) / 2`
- [ ] Update hours calculation to use default if missing
- [ ] Update housing calculation to handle null values

#### Step 2.1.2: Update calculateTotalCompensationValue
- [ ] Apply same changes to `calculateTotalCompensationValue()`
- [ ] Test sorting still works with new calculation

### Task 2.2: Convert to API-Based Loading (20 minutes)

#### Step 2.2.1: Replace static data with API call
- [ ] Comment out or remove `const jobsData = [...]` array
- [ ] Create new `loadJobsFromAPI()` function:
  ```javascript
  async function loadJobsFromAPI(page = 1) {
    // Show loading
    // Call API
    // Update jobs
    // Hide loading
  }
  ```
- [ ] Add `UI.showLoading()` at start
- [ ] Add `await apiClient.getJobs({ page, limit: 10 })`
- [ ] Update global `filteredJobs` with API response
- [ ] Call `renderJobs()` with API data
- [ ] Add `UI.hideLoading()` in finally block

#### Step 2.2.2: Update initialization
- [ ] Replace `renderJobs()` call in DOMContentLoaded
- [ ] With `loadJobsFromAPI()` call
- [ ] Add error handling for initial load

### Task 2.3: Update Filter Functions (10 minutes)

#### Step 2.3.1: Update filterJobs to use API
- [ ] Locate `filterJobs()` function
- [ ] Create filter parameters object:
  - [ ] `search` → keep as is
  - [ ] `specialty` → use API format directly
  - [ ] `state` → use state code directly
  - [ ] `minRate/maxRate` → parse from salary range filter
- [ ] Replace local filtering with `loadJobsFromAPI(1, filters)`
- [ ] Remove client-side filtering logic

#### Step 2.3.2: Update pagination
- [ ] Update `goToPage()` to call `loadJobsFromAPI(page, currentFilters)`
- [ ] Update `renderPagination()` to use API pagination response
- [ ] Use `pagination.currentPage`, `pagination.totalPages` from API

---

## Phase 3: Add Authentication UI (2 hours)

### Task 3.1: Create Login Modal (45 minutes)

#### Step 3.1.1: Add login modal HTML
- [ ] Add login modal after job detail modal:
  ```html
  <div class="modal" id="loginModal">
    <div class="modal-content">
      <button class="modal-close" onclick="closeLoginModal()">&times;</button>
      <h2>Login to Apply</h2>
      <!-- form here -->
    </div>
  </div>
  ```
- [ ] Add email input field with type="email"
- [ ] Add password input field with type="password"
- [ ] Add login button
- [ ] Add "Don't have an account? Register" link
- [ ] Style using existing modal CSS

#### Step 3.1.2: Add registration form
- [ ] Add registration fields (hidden by default):
  - [ ] First name
  - [ ] Last name
  - [ ] Email
  - [ ] Password
  - [ ] Role (default: 'locum')
- [ ] Add toggle between login/register forms
- [ ] Add form validation attributes (required, minlength)

#### Step 3.1.3: Implement modal functions
- [ ] Create `showLoginModal()` function
- [ ] Create `closeLoginModal()` function
- [ ] Create `toggleAuthForm()` to switch login/register
- [ ] Add escape key and overlay click handling

### Task 3.2: Implement Authentication Logic (45 minutes)

#### Step 3.2.1: Create login handler
- [ ] Create `async function handleLogin(event)`
- [ ] Prevent form submission default
- [ ] Get email and password values
- [ ] Show loading on button: `UI.showLoading(loginBtn)`
- [ ] Call `await apiClient.login(email, password)`
- [ ] On success: store token with `Auth.setToken()`
- [ ] Close modal and refresh page data
- [ ] Show success toast
- [ ] On error: show error message

#### Step 3.2.2: Create registration handler
- [ ] Create `async function handleRegister(event)`
- [ ] Get all form values
- [ ] Validate passwords match (if confirm field exists)
- [ ] Call `await apiClient.register(userData)`
- [ ] Show success message
- [ ] Switch to login form
- [ ] Clear registration form

#### Step 3.2.3: Update UI for auth state
- [ ] Add auth check on page load
- [ ] Add user info display in navigation
- [ ] Add logout button when logged in
- [ ] Hide/show elements based on auth state
- [ ] Create `updateAuthUI()` function

### Task 3.3: Integrate Authentication with Apply (30 minutes)

#### Step 3.3.1: Update applyToJob function
- [ ] Add auth check at start: `if (!Auth.isAuthenticated())`
- [ ] If not authenticated: `showLoginModal()` and return
- [ ] Store `pendingJobId` for after login
- [ ] Continue with application if authenticated

#### Step 3.3.2: Add API application submission
- [ ] Replace static success message with API call
- [ ] Create application data: `{ jobId, coverLetter: '' }`
- [ ] Call `await apiClient.applyToJob(applicationData)`
- [ ] Show real success message
- [ ] Update button to show "Applied" state
- [ ] Handle errors appropriately

#### Step 3.3.3: Add post-login continuation
- [ ] After successful login, check for `pendingJobId`
- [ ] If exists, automatically continue with application
- [ ] Clear `pendingJobId` after use

---

## Phase 4: Error Handling and Loading States (1 hour)

### Task 4.1: Add Loading States (20 minutes)

#### Step 4.1.1: Job list loading
- [ ] Add loading container div in HTML
- [ ] Show loading in `loadJobsFromAPI` start
- [ ] Hide loading in finally block
- [ ] Add loading CSS animation

#### Step 4.1.2: Button loading states
- [ ] Update Apply button during API call
- [ ] Disable button during loading
- [ ] Show spinner or "Applying..." text
- [ ] Restore button state on complete

### Task 4.2: Add Error Handling (25 minutes)

#### Step 4.2.1: Network error handling
- [ ] Wrap all API calls in try-catch
- [ ] Check for `error.message === 'Failed to fetch'`
- [ ] Show user-friendly network error message
- [ ] Add retry button for failed loads

#### Step 4.2.2: API error handling  
- [ ] Handle 401 (unauthorized) → show login modal
- [ ] Handle 404 (not found) → show "Job not found"
- [ ] Handle 400 (bad request) → show validation errors
- [ ] Handle 500 (server error) → show generic error
- [ ] Use `UI.showError()` for all error displays

#### Step 4.2.3: Add fallback for critical errors
- [ ] If initial load fails completely
- [ ] Show error message with retry option
- [ ] Log errors to console for debugging

### Task 4.3: Add Success Feedback (15 minutes)

#### Step 4.3.1: Success notifications
- [ ] Show success toast after login
- [ ] Show success toast after application
- [ ] Show info toast when filters applied
- [ ] Use consistent `UI.showSuccess()` calls

#### Step 4.3.2: Update UI state after actions
- [ ] Mark applied jobs visually
- [ ] Update apply button text/state
- [ ] Show application count if available

---

## Phase 5: Testing and Polish (1 hour)

### Task 5.1: Basic Functionality Testing (30 minutes)

#### Step 5.1.1: Test job loading
- [ ] Verify jobs load from API on page load
- [ ] Test pagination works correctly
- [ ] Test filtering updates results
- [ ] Test sorting functionality

#### Step 5.1.2: Test authentication flow
- [ ] Test registration with new user
- [ ] Test login with credentials
- [ ] Test logout functionality
- [ ] Test "Apply" requires login
- [ ] Test token persistence

#### Step 5.1.3: Test error scenarios
- [ ] Stop API server and test error handling
- [ ] Test with invalid credentials
- [ ] Test with malformed API responses
- [ ] Verify error messages display correctly

### Task 5.2: UI Polish and Cleanup (20 minutes)

#### Step 5.2.1: Remove static data
- [ ] Delete or comment out `jobsData` array
- [ ] Remove any hardcoded recruiter info
- [ ] Clean up unused functions
- [ ] Remove console.log statements

#### Step 5.2.2: Final UI touches
- [ ] Ensure loading states are smooth
- [ ] Check responsive design works
- [ ] Verify all modals close properly
- [ ] Test keyboard navigation (escape key)

### Task 5.3: Code Review and Documentation (10 minutes)

#### Step 5.3.1: Code cleanup
- [ ] Format code consistently
- [ ] Add comments for complex sections
- [ ] Group related functions together
- [ ] Check for any TODO comments

#### Step 5.3.2: Quick documentation
- [ ] Document any API requirements
- [ ] Note any known limitations
- [ ] List environment variables needed

---

## Quick Reference Checklist

### Before Starting
- [ ] API server running on port 4000
- [ ] Frontend server running on port 3000
- [ ] ApiClient, Auth, and UI modules loaded
- [ ] Test API endpoints working

### Key Changes Summary
1. **Direct field mapping** - No transformation layer
2. **API-based loading** - Replace static data
3. **Simple auth modal** - Basic login/register
4. **Essential error handling** - Network and API errors
5. **Minimal testing** - Focus on critical paths

### Files to Modify
- `frontend/job-board.html` - Main file with all changes

### Success Criteria
- [ ] Jobs load from API
- [ ] Pagination works
- [ ] Filters work with API
- [ ] Login/logout works
- [ ] Apply requires authentication
- [ ] Errors show user-friendly messages
- [ ] No console errors

---

**Total Time: 5-6 hours**  
**Simplified from 9 hours by removing data adaptation layer**