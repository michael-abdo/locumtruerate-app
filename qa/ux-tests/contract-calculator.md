# Contract Calculator UX Test Instructions

## Test URL
https://locumtruerate-staging-66ba3177c382.herokuapp.com/contract-calculator.html

## Test Steps

### Page Load and Interface
1. Navigate to the contract calculator page
2. Verify the page loads with complete styling and layout
3. Verify "Contract Calculator" is highlighted in navigation
4. Check main heading displays "Contract Analysis Calculator" or similar
5. Verify the calculator interface is prominently displayed

### Input Field Verification
6. Verify all required input fields are present:
   - Hourly rate ($)
   - Hours per week
   - Contract length (weeks)
   - Housing stipend ($/week)
   - Travel reimbursement ($)
   - Meal allowance (if applicable)
   - Other benefits/stipends
7. Check that all fields have clear labels and placeholder text
8. Verify default values are pre-populated

### Basic Calculation Testing
9. Enter standard contract values:
   - Hourly rate: $85
   - Hours per week: 40
   - Contract length: 13 weeks
   - Housing stipend: $1,200/week
   - Travel reimbursement: $1,000
10. Verify calculations appear immediately
11. Check that results show:
    - Weekly gross pay
    - Total contract value
    - Total stipends/benefits
    - True hourly rate (including all benefits)

### Advanced Input Testing
12. Test different contract lengths:
    - 8-week contract
    - 13-week contract
    - 26-week contract
13. Test various hourly rates:
    - Low rate: $60/hour
    - Medium rate: $85/hour
    - High rate: $120/hour
14. Test different housing stipends:
    - No housing: $0
    - Partial housing: $800/week
    - Full housing: $1,500/week

### Calculation Accuracy Verification
15. With $85/hour, 40 hours/week, 13 weeks:
    - Verify weekly pay = $3,400
    - Verify total contract = $44,200 (before stipends)
16. Add $1,200 housing × 13 weeks = $15,600
17. Add $1,000 travel reimbursement
18. Verify total package calculation includes all components
19. Verify true hourly rate calculation: total package ÷ total hours

### Comparison Features
20. Look for contract comparison tools
21. Test "Save Contract" or "Compare Contracts" functionality
22. Verify multiple contract scenarios can be compared side-by-side
23. Test export or sharing of comparison results

### Tax and Net Pay Features
24. Check for tax calculation options
25. Test state tax selections if available
26. Verify federal withholding calculations
27. Check net pay vs gross pay displays

### Edge Cases and Validation
28. Enter 0 hours per week and verify error handling
29. Enter negative values and check validation
30. Test with very high values (200+ hours/week)
31. Enter decimal values and verify proper handling
32. Test with empty required fields

### Results Export and Sharing
33. Look for "Print Results" functionality
34. Test "Email Results" if available
35. Check for PDF export options
36. Verify "Save Calculation" works properly

### Mobile Responsiveness
37. Resize browser to mobile width
38. Verify calculator remains usable on mobile
39. Test input fields work properly on mobile
40. Verify results display correctly on smaller screens

### QA Report
- ✅ What worked:
- 🐞 Bugs found:
- ❓ Open questions: