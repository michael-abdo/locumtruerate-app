# Job Board UX Test Instructions

## Test URL
https://locumtruerate-staging-66ba3177c382.herokuapp.com/job-board.html

## Test Steps

### Page Load and Navigation
1. Navigate to the job board page from the homepage
2. Verify the page loads completely with "Job Board" in the navigation highlighted
3. Verify the page title shows "Job Board - ContractCalc Pro"
4. Verify the main heading displays "Find Your Perfect Locum Position"

### Search and Filter Controls
5. Locate the search bar at the top and verify placeholder text
6. Enter "nurse" in the search bar and press Enter
7. Verify search results filter appropriately
8. Clear the search and verify all jobs return
9. Test location filter dropdown:
   - Click location dropdown
   - Select "California" and verify jobs filter
   - Select "All Locations" to reset
10. Test specialty filter dropdown:
    - Click specialty dropdown
    - Select "Emergency Medicine" and verify filtering
    - Select "All Specialties" to reset
11. Test contract type filter:
    - Select "13-week" contract type
    - Verify jobs filter appropriately
    - Reset to "All Types"

### Job Listings Display
12. Verify job cards display with all required information:
    - Hospital name and location
    - Specialty and position type
    - Contract duration
    - Hourly rate and total compensation
    - Housing stipend amount
    - "View Details" button
13. Count total number of job listings displayed
14. Verify job cards have consistent styling and layout

### Job Card Interactions
15. Hover over different job cards and verify hover effects work
16. Click "View Details" on the first job listing
17. Verify detail modal or page opens with expanded job information
18. Close the detail view and try another job listing
19. Test "Save Job" functionality if available on job cards

### Sorting and Pagination
20. Look for sort options (by salary, location, date posted)
21. Test sorting functionality if available
22. Check for pagination controls at bottom of job listings
23. Test pagination if multiple pages exist

### Mobile Responsiveness Testing
24. Resize browser window to mobile width
25. Verify job cards stack vertically
26. Verify filters remain accessible on mobile
27. Test search functionality on mobile view

### Contact and Application Flow
28. Click on a high-paying job opportunity
29. Look for application or contact information
30. Verify recruiter contact details are displayed
31. Test any "Apply Now" or "Contact Recruiter" buttons

### QA Report
- ✅ What worked:
- 🐞 Bugs found:
- ❓ Open questions: