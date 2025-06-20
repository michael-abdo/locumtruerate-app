#!/bin/bash

# Find all TypeScript/TSX files that likely need validation
echo "=== Finding files that likely need input validation ==="
echo ""

# Search for common patterns that indicate user input without validation
echo "1. Files with form submissions without validation:"
grep -r "onSubmit" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "validation" | grep -v "schema" | head -20

echo ""
echo "2. Files with onChange handlers (potential unvalidated inputs):"
grep -r "onChange.*=.*{" apps/web/src --include="*.tsx" | grep -v "validation" | grep -v "test" | head -20

echo ""
echo "3. Files with API calls passing user input:"
grep -r "fetch\|axios\|trpc.*mutate" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "test" | head -20

echo ""
echo "4. Files with SQL-like operations:"
grep -r "where\|select\|from\|order by" apps/web/src --include="*.tsx" --include="*.ts" | grep -i -v "comment" | head -20

echo ""
echo "5. Files handling payment/financial data:"
grep -r "payment\|card\|billing\|price\|amount" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "test" | head -20

echo ""
echo "6. Authentication/profile forms:"
grep -r "password\|email.*=\|profile\|signup\|signin" apps/web/src --include="*.tsx" --include="*.ts" | grep -v "test" | grep -v "validation" | head -20