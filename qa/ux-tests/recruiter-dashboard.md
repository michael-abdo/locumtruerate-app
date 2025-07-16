# Recruiter Dashboard QA Test

**Proceed without asking for confirmation. Run all steps through to the end without stopping.**

## Operator Capabilities

✅ Has access to:
- The rendered DOM
- Uploading files

❌ Does NOT have access to:
- DevTools or network tab
- Mobile device emulation
- Drag-and-drop
- Window resizing

## Test URL
https://locumtruerate-staging-66ba3177c382.herokuapp.com/recruiter-dashboard.html

## Test Steps

### Page Load and Initial State
1. Navigate to the test URL
   - Page loads without errors and shows recruiter dashboard
   - ✅ Pass | ❌ Fail

2. Verify page title and navigation
   - Browser tab shows "Recruiter Dashboard - LocumTrueRate"
   - Navigation shows "Dashboards" dropdown with "Recruiter" highlighted as active
   - ✅ Pass | ❌ Fail

### KPI Metrics Section
3. Check metrics cards display
   - Four KPI cards visible showing: Active Jobs, Total Applicants, Jobs Filled, and Client Satisfaction
   - All cards show numeric values with appropriate labels
   - ✅ Pass | ❌ Fail

4. Test Time Period selector
   - Click "Time Period" dropdown and select "This Week"
   - Values in KPI cards update and success toast appears
   - ✅ Pass | ❌ Fail

5. Test KPI refresh functionality
   - Click "Refresh" button (🔄) in metrics section
   - Loading state appears briefly, then success toast shows "KPI data refreshed"
   - ✅ Pass | ❌ Fail

### Quick Actions Section
6. Test Post New Job quick action
   - Click "Post New Job" card in Quick Actions
   - Modal opens with job posting form containing required fields
   - ✅ Pass | ❌ Fail

7. Test View All Applicants quick action
   - Click "View All Applicants" card in Quick Actions
   - Page smoothly scrolls to Recent Applicants section
   - ✅ Pass | ❌ Fail

8. Test Send Message quick action
   - Click "Send Message" card in Quick Actions
   - Compose message modal opens with To, Subject, and Message fields
   - ✅ Pass | ❌ Fail

9. Test View Analytics quick action
   - Click "View Analytics" card in Quick Actions
   - Page smoothly scrolls to Performance Analytics section
   - ✅ Pass | ❌ Fail

### Job Listings Management
10. Verify job listings table display
    - Table shows columns: Position, Facility, Location, Rate, Applicants, Posted, Status, Actions
    - Multiple job rows are visible with realistic data
    - ✅ Pass | ❌ Fail

11. Test job filtering
    - Click "Active" filter button above job table
    - Table filters to show only active jobs, button becomes highlighted
    - ✅ Pass | ❌ Fail

12. Test job sorting
    - Click "Rate" column header
    - Jobs reorder by rate with sort arrow indicator
    - ✅ Pass | ❌ Fail

13. Test job status change
    - Click status dropdown for any job row
    - Select different status (e.g., "Pending")
    - Status updates and success toast appears
    - ✅ Pass | ❌ Fail

14. Test job pagination
    - Scroll to bottom of job table
    - Pagination shows "Showing 1-25 of 28 jobs" (or similar)
    - ✅ Pass | ❌ Fail

15. Test Edit Job functionality
    - Click "Edit" button on any job row
    - Modal opens with job details pre-filled in form fields
    - ✅ Pass | ❌ Fail

### Applicant Management
16. Verify applicant cards display
    - Recent Applicants section shows applicant cards with name, specialty, rating, status
    - Each card has Review and Contact buttons
    - ✅ Pass | ❌ Fail

17. Test applicant search
    - Type "Michael" in applicant search box
    - Applicant list filters to show matching results
    - ✅ Pass | ❌ Fail

18. Test applicant search with no results
    - Type "xyz123" in applicant search box
    - Shows "No applicants match your filters" message with search icon
    - ✅ Pass | ❌ Fail

19. Test clear filters
    - Click "Clear" button after search
    - All applicants reappear and filter message disappears
    - ✅ Pass | ❌ Fail

20. Test applicant status change
    - Click status dropdown for any applicant
    - Select different status (e.g., "Interviewing")
    - Status pill updates to new status and success toast appears
    - ✅ Pass | ❌ Fail

21. Test View All applicants
    - Click "View All" button in Recent Applicants section
    - Modal opens showing comprehensive applicant list
    - ✅ Pass | ❌ Fail

22. Test Export List functionality
    - Click "Export List" button in Recent Applicants section
    - CSV file downloads to browser's download folder
    - ✅ Pass | ❌ Fail

### Message Center
23. Test message interface
    - Message Center section shows inbox with message previews
    - Messages have sender, subject, and timestamp
    - ✅ Pass | ❌ Fail

24. Test message selection
    - Click on any message in the list
    - Message content appears in preview pane on right
    - ✅ Pass | ❌ Fail

25. Test compose message
    - Click "+ Compose Message" button
    - Modal opens with To, Subject, and Message fields
    - ✅ Pass | ❌ Fail

### Performance Analytics
26. Test analytics chart display
    - Performance Analytics section shows chart with data visualization
    - Chart displays views, applications, and conversions data
    - ✅ Pass | ❌ Fail

27. Test analytics timeframe
    - Click "This Week" button in analytics section
    - Chart updates to show weekly data
    - ✅ Pass | ❌ Fail

### Modal Functionality
28. Test modal backdrop closing
    - Open any modal (e.g., Post New Job)
    - Click outside modal on dark background
    - Modal closes
    - ✅ Pass | ❌ Fail

29. Test modal escape key
    - Open any modal
    - Press Escape key
    - Modal closes
    - ✅ Pass | ❌ Fail

30. Test modal close button
    - Open any modal
    - Click X button in top-right of modal
    - Modal closes
    - ✅ Pass | ❌ Fail

### Form Validation
31. Test new job form validation
    - Open "Post New Job" modal
    - Click "Post Job" button without filling required fields
    - Form shows validation errors and prevents submission
    - ✅ Pass | ❌ Fail

32. Test new job form submission
    - Fill all required fields in "Post New Job" modal
    - Click "Post Job" button
    - Success toast appears and modal closes
    - ✅ Pass | ❌ Fail

### Accessibility and Focus
33. Test keyboard navigation
    - Press Tab key multiple times
    - Focus moves through interactive elements with visible outline
    - ✅ Pass | ❌ Fail

34. Test focus within modals
    - Open any modal
    - Press Tab key
    - Focus moves through modal elements with visible outlines
    - ✅ Pass | ❌ Fail

### Profile and Settings
35. Test profile menu
    - Click profile avatar in top-right navigation
    - Dropdown menu appears with profile options
    - ✅ Pass | ❌ Fail

36. Test profile settings
    - Click "Profile Settings" from profile menu
    - Modal opens with profile editing form
    - ✅ Pass | ❌ Fail

### Data Export and Actions
37. Test data export
    - Click "Export Data" in Quick Actions
    - Export process initiates with appropriate feedback
    - ✅ Pass | ❌ Fail

38. Test market rates
    - Click "Market Rates" in Quick Actions
    - Modal opens showing market rate information
    - ✅ Pass | ❌ Fail

### Toast Notifications
39. Test notification display
    - Perform any action that triggers notification (e.g., change job status)
    - Toast notification appears in top-right corner
    - Toast auto-dismisses after 3 seconds
    - ✅ Pass | ❌ Fail

### Final State Check
40. Verify page remains functional
    - After all tests, page still loads and responds normally
    - No JavaScript errors visible in normal browser interface
    - ✅ Pass | ❌ Fail

## QA Report

### QA Report
- ✅ All tests passed:
  - [To be filled by operator based on test results]
- ❌ Failed tests:
  - [To be filled by operator if any failures occur]
- 🧪 Retest required:
  - [Only if ❌ failures exist; otherwise omit]
- ✅ QA Status: **[Complete/Incomplete based on results]**