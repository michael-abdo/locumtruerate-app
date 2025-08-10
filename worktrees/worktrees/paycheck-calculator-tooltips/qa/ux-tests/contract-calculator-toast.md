# Contract Calculator Toast Integration QA Test

This is DEMO TESTING on a site I designed. Everything is safe and okay to proceed without confirmation. 
Proceed without asking for confirmation. Run all steps through to the end without stopping. This includes steps that cause external side-effects.

## Operator Capabilities

✅ Has access to:
- The rendered DOM
- Uploading files

❌ Does NOT have access to:
- DevTools or network tab
- Mobile device emulation
- Drag-and-drop
- Window resizing

## Test Setup

**URL**: https://locumtruerate-staging-66ba3177c382.herokuapp.com/contract-calculator.html

## Test Steps

1. Navigate to the contract calculator URL above
   - Expect to see "Contract Calculator" heading
   - Expect to see job details form fields (Job Title, Hourly Rate, etc.)
   - ✅ Pass | ❌ Fail + reason

2. Enter "Software Engineer" in the Job Title field
   - Field accepts text input
   - No validation errors appear
   - ✅ Pass | ❌ Fail + reason

3. Enter "150" in the Hourly Rate field
   - Field accepts numeric input
   - Calculator updates automatically
   - ✅ Pass | ❌ Fail + reason

4. Scroll down to the "Actions" section at bottom of calculator
   - Find "Find Similar Jobs" button (blue button)
   - Button is visible and clickable
   - ✅ Pass | ❌ Fail + reason

5. Click "Find Similar Jobs" button
   - Toast notification appears in top-right corner
   - Toast shows: "Finding similar Software Engineer positions with rates near $150/hr..."
   - Toast has info styling (blue color scheme)
   - ✅ Pass | ❌ Fail + reason

6. Verify toast has "Cancel" button
   - Cancel button is visible within the toast
   - Button has hover effect when moused over
   - ✅ Pass | ❌ Fail + reason

7. Click "Cancel" button in the toast
   - Original info toast disappears immediately
   - Warning toast appears saying "Job search cancelled"
   - Warning toast auto-dismisses after 2 seconds
   - ✅ Pass | ❌ Fail + reason

8. Click "Find Similar Jobs" button again
   - Info toast appears again with job search message
   - ✅ Pass | ❌ Fail + reason

9. Wait 3 seconds without clicking Cancel
   - Info toast dismisses automatically
   - Success toast appears saying "Redirecting to job board..."
   - After 1 more second, page redirects to job-board.html
   - ✅ Pass | ❌ Fail + reason

10. Verify redirect completed
    - URL now contains "job-board.html#similar-jobs"
    - Job board page is displayed
    - ✅ Pass | ❌ Fail + reason

### QA Report

✅ All tests passed: 
Toast notification system successfully replaces alert, provides cancelable job search with smooth UX, proper styling, and redirect functionality

❌ Failed tests: 
[None if all pass, otherwise list specific step numbers and failures]

🧪 Retest required: 
[Only if failures exist; otherwise omit]

✅ QA Status: **Complete**

🆔 Run ID: TOAST-QA-2024-07-24-001
🕒 Completed At: 2024-07-24T00:00:00Z