# Paycheck Calculator UX Test Instructions

## Test URL
https://locumtruerate-staging-66ba3177c382.herokuapp.com/paycheck-calculator.html

## Test Steps

### Page Load and Layout
1. Navigate to the paycheck calculator page
2. Verify the page loads completely with proper styling
3. Verify "Paycheck Calculator" is highlighted in navigation
4. Verify the main heading displays correctly
5. Check that the calculator form is prominently displayed

### Basic Calculator Functionality
6. Verify all input fields are present and labeled:
   - Regular hours per week
   - Overtime hours
   - Regular hourly rate
   - Overtime rate
   - Weekly stipends/benefits
7. Verify default values are populated in input fields
8. Check that calculation results display area is visible

### Input Field Testing
9. Click in the "Regular Hours" field and enter "40"
10. Verify the field accepts numeric input
11. Enter "45" in overtime hours field
12. Test regular rate field with value "85"
13. Test overtime rate field with "127.50" 
14. Enter "1200" in weekly stipends field
15. Verify all inputs update the calculations in real-time

### Calculation Accuracy Testing
16. With standard inputs (40 regular, 8 overtime, $85 rate, $127.50 OT rate, $1200 stipend):
    - Verify regular pay calculation (40 × $85 = $3,400)
    - Verify overtime pay calculation (8 × $127.50 = $1,020)
    - Verify total gross pay includes all components
17. Change regular hours to 50 and verify calculations update
18. Set overtime hours to 0 and verify overtime pay shows $0
19. Test with maximum values (60+ hours) and verify calculations

### Edge Case Testing
20. Enter "0" in regular hours and verify handling
21. Enter negative numbers and verify validation
22. Enter decimal values (e.g., 37.5 hours) and verify acceptance
23. Enter very large numbers and verify system handles appropriately
24. Clear all fields and verify calculator behavior

### Results Display Testing
25. Verify results show breakdown of:
    - Regular pay amount
    - Overtime pay amount
    - Stipend amount
    - Total gross weekly pay
26. Verify monetary amounts display with proper formatting ($X,XXX.XX)
27. Check that results update immediately when inputs change

### Tax and Deduction Features
28. Look for tax calculation options or toggles
29. Test any state tax dropdown if available
30. Verify federal tax withholding calculations if implemented
31. Check for net pay calculation after deductions

### Export and Save Features
32. Look for "Save Calculation" or "Export" buttons
33. Test print functionality if available
34. Check for email or share calculation options

### Error Handling
35. Enter non-numeric characters in number fields
36. Verify appropriate error messages display
37. Test with empty required fields
38. Verify form validation works correctly

### QA Report
- ✅ What worked:
- 🐞 Bugs found:
- ❓ Open questions: