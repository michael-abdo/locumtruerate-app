# Normalized Contract Calculator QA Testing

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

## Test Environment
- **URL**: https://locumtruerate-staging-66ba3177c382.herokuapp.com/normalized-calculator.html
- **Purpose**: Validate normalized calculator with all new compensation fields
- **Test Run**: Post-deployment validation

## QA Test Steps

1. Navigate to the normalized calculator page
   - Page loads with "Normalized Contract Calculator" header visible
   - ✅ Pass | ❌ Fail + reason

2. Verify default values are populated in all form fields
   - All existing fields show defaults, new fields show 0 or appropriate defaults
   - ✅ Pass | ❌ Fail + reason

3. Test Overtime Rate field functionality
   - Change "Overtime Rate" to $150, verify field accepts input
   - ✅ Pass | ❌ Fail + reason

4. Verify Overtime Rate calculation updates
   - Results panel shows overtime compensation calculated correctly
   - ✅ Pass | ❌ Fail + reason

5. Test Beeper Call Rate field
   - Change "Hourly Beeper Call Rate" to $25, verify field accepts input
   - ✅ Pass | ❌ Fail + reason

6. Test Beeper Call Hours field
   - Change "Beeper Call Hours per Week" to 40, verify field accepts input
   - ✅ Pass | ❌ Fail + reason

7. Verify Beeper Call compensation calculation
   - Results panel shows "Beeper Call Pay" with correct calculation (rate × hours × working weeks)
   - ✅ Pass | ❌ Fail + reason

8. Test Daily Food Stipend field
   - Change "Daily Food Stipend" to $75, verify field accepts input
   - ✅ Pass | ❌ Fail + reason

9. Verify Food Stipend total calculation
   - Results panel shows "Food Stipend" with correct weekly total (daily × 7 × working weeks)
   - ✅ Pass | ❌ Fail + reason

10. Test Weeks Off field
    - Change "Weeks Off" to 2, verify field accepts input
    - ✅ Pass | ❌ Fail + reason

11. Verify Weeks Off affects working weeks calculation
    - All weekly-based calculations use (contract weeks - weeks off) for working weeks
    - ✅ Pass | ❌ Fail + reason

12. Test Shifts per Week field
    - Change "Shifts per Week" to 4, verify field accepts input
    - ✅ Pass | ❌ Fail + reason

13. Test Daily Round Trip Miles field
    - Change "Daily Round Trip Miles" to 50, verify field accepts input
    - ✅ Pass | ❌ Fail + reason

14. Verify Mileage Reimbursement calculation
    - Results panel shows "Mileage Reimbursement" using IRS rate ($0.67/mile)
    - ✅ Pass | ❌ Fail + reason

15. Test Completion Bonus field
    - Change "Completion Bonus" to $5000, verify field accepts input
    - ✅ Pass | ❌ Fail + reason

16. Verify Completion Bonus in results
    - Results panel shows "Completion Bonus" with entered amount
    - ✅ Pass | ❌ Fail + reason

17. Test comprehensive calculation with all fields populated
    - Fill all new fields with test values, verify immediate recalculation
    - ✅ Pass | ❌ Fail + reason

18. Verify True Hourly Rate includes all compensation
    - True Hourly Rate reflects total of all compensation types divided by total hours
    - ✅ Pass | ❌ Fail + reason

19. Verify Total Contract Value accuracy
    - Total includes base pay, housing, travel, other stipends, overtime, beeper, food, mileage, bonus
    - ✅ Pass | ❌ Fail + reason

20. Test all existing functionality still works
    - Original contract calculator features (save, export, email) function correctly
    - ✅ Pass | ❌ Fail + reason

21. Verify all new compensation types display in results
    - Results show separate lines for: Overtime, Beeper Call, Food Stipend, Mileage, Completion Bonus
    - ✅ Pass | ❌ Fail + reason

22. Test field validation for new fields
    - New fields reject negative values, accept decimal inputs appropriately
    - ✅ Pass | ❌ Fail + reason

23. Test real-time calculation updates with new fields
    - Changing any new field triggers immediate recalculation of all results
    - ✅ Pass | ❌ Fail + reason

24. Verify mathematical accuracy of normalized calculations
    - All calculations are mathematically correct with complex scenarios
    - ✅ Pass | ❌ Fail + reason

25. Test edge cases with new fields
    - Set Weeks Off equal to Contract Length, verify calculations handle zero working weeks
    - ✅ Pass | ❌ Fail + reason

26. Test tooltips for new fields
    - All new fields have informative tooltips explaining their purpose
    - ✅ Pass | ❌ Fail + reason

27. Verify navigation links work
    - Navigation menu includes "Normalized Calculator" link and it's marked as active
    - ✅ Pass | ❌ Fail + reason

28. Test comprehensive scenario
    - Use realistic values: $100 base, $150 overtime, $30 beeper, 20 beeper hours, $50 food, 1 week off, 4 shifts, 30 miles, $2000 bonus
    - ✅ Pass | ❌ Fail + reason

29. Verify save/load works with new fields
    - Save calculation with new fields, reload, verify all values preserved
    - ✅ Pass | ❌ Fail + reason

30. Test export functionality includes new fields
    - PDF/CSV export includes all new compensation types and calculations
    - ✅ Pass | ❌ Fail + reason

### QA Report

✅ All tests passed: 
[To be filled during test execution]

❌ Failed tests: 
[To be filled if any failures occur]

🧪 Retest required: 
[Only if ❌ failures exist; otherwise omit]

✅ QA Status: **Pending**

🆔 Run ID: NC-QA-20250729-202500-9145
🕒 Completed At: [To be filled upon completion]