# Test Components - Expected Statement Counts

This document provides the ground truth for expected analyzer results on our test components. These counts are used to validate the analyzer's accuracy after fixing the statement-pattern logic disconnect.

## Overview

| Component | Total Lines | Web Patterns | Native Patterns | Expected Web Statements | Expected Native Statements | Expected Shared Statements | Expected Reusability % |
|-----------|-------------|--------------|-----------------|-------------------------|----------------------------|---------------------------|------------------------|
| web-heavy.tsx | ~200 | 55+ | 0 | 35-45 | 0 | 45-55 | 55-65% |
| native-heavy.tsx | ~320 | 0 | 85+ | 0 | 50-60 | 80-90 | 60-70% |
| shared-pure.tsx | ~280 | 0 | 0 | 0 | 0 | 95-105 | 100% |
| mixed.tsx | ~200 | 5 | 3 | 8-12 | 3-6 | 75-85 | 75-85% |

## Detailed Component Analysis

### 1. web-heavy.tsx

**File Description**: Modal component with extensive web-specific patterns
**Total Lines**: ~200 lines
**Total AST Statements**: ~90-100 statements

**Pattern Breakdown**:
- **className patterns**: 28 occurrences (lines with CSS class usage)
- **onClick patterns**: 5 occurrences (event handler assignments)
- **document API patterns**: 3 occurrences (document.body.style, etc.)
- **window API patterns**: 3 occurrences (window.addEventListener, etc.)
- **localStorage patterns**: 2 occurrences (localStorage.getItem/setItem)
- **Web HTML elements**: 15+ occurrences (div, button, input, etc.)

**Expected Results After Fix**:
- **Web Statements**: 35-45 (statements on lines with web patterns)
- **Native Statements**: 0 (no React Native patterns)
- **Shared Statements**: 45-55 (React hooks, utility functions, shared logic)
- **Total Statements**: 90-100
- **Reusability Percentage**: 55-65% (shared/total)

**Validation Method**: Count statements on lines containing web patterns vs. lines with shared React/TS patterns.

### 2. native-heavy.tsx

**File Description**: React Native screen component with platform-specific code
**Total Lines**: ~320 lines
**Total AST Statements**: ~140-150 statements

**Pattern Breakdown**:
- **StyleSheet.create patterns**: 6 occurrences (multiple style objects)
- **Platform API patterns**: 6 occurrences (Platform.OS, Platform.select)
- **AsyncStorage patterns**: 3 occurrences (AsyncStorage methods)
- **React Native components**: 20+ occurrences (View, Text, TouchableOpacity, etc.)
- **onPress patterns**: 6 occurrences (React Native event handlers)
- **styles.* patterns**: 25+ occurrences (style object references)
- **Layout patterns**: 15+ occurrences (flexDirection, justifyContent, etc.)

**Expected Results After Fix**:
- **Web Statements**: 0 (no web patterns)
- **Native Statements**: 50-60 (statements on lines with React Native patterns)
- **Shared Statements**: 80-90 (React hooks, interfaces, shared utility functions)
- **Total Statements**: 140-150
- **Reusability Percentage**: 60-70% (shared/total)

**Validation Method**: Count statements on lines containing React Native patterns vs. lines with shared React/TS patterns.

### 3. shared-pure.tsx

**File Description**: Pure business logic component with only cross-platform code
**Total Lines**: ~280 lines
**Total AST Statements**: ~95-105 statements

**Pattern Breakdown**:
- **React patterns**: 10+ occurrences (useState, useEffect, etc.)
- **TypeScript patterns**: 20+ occurrences (interfaces, types, exports)
- **Utility functions**: 15+ occurrences (pure functions)
- **Array methods**: 20+ occurrences (.map, .filter, .reduce, etc.)
- **NO web-specific patterns**: 0 occurrences
- **NO React Native patterns**: 0 occurrences

**Expected Results After Fix**:
- **Web Statements**: 0 (no web patterns)
- **Native Statements**: 0 (no React Native patterns)
- **Shared Statements**: 95-105 (all statements are shared/cross-platform)
- **Total Statements**: 95-105
- **Reusability Percentage**: 100% (all code is cross-platform)

**Validation Method**: Verify no statements are categorized as platform-specific; all should be shared.

### 4. mixed.tsx

**File Description**: Component with both web and React Native patterns
**Total Lines**: ~200 lines
**Total AST Statements**: ~90-100 statements

**Pattern Breakdown**:
- **Web patterns**: 5 occurrences
  - className: 3 occurrences
  - onClick: 1 occurrence
  - Web HTML elements: 1 occurrence
- **Native patterns**: 3 occurrences
  - StyleSheet.create: 1 occurrence
  - Platform.OS: 1 occurrence
  - React Native components: 1 occurrence
- **Shared patterns**: 15+ occurrences (hooks, utilities, types)

**Expected Results After Fix**:
- **Web Statements**: 8-12 (statements on lines with web patterns)
- **Native Statements**: 3-6 (statements on lines with React Native patterns)
- **Shared Statements**: 75-85 (statements with no platform-specific patterns)
- **Total Statements**: 90-100
- **Reusability Percentage**: 75-85% (shared/total)

**Validation Method**: Count statements on lines with web patterns, lines with native patterns, and lines with only shared patterns.

## Manual Verification Process

### Step 1: Line-by-Line Pattern Analysis
1. For each component, go through line by line
2. Identify lines containing platform-specific patterns
3. Count AST statements on those lines
4. Categorize as web, native, or shared

### Step 2: Statement Counting Rules
- **Web Statement**: Any statement on a line containing web-specific patterns
- **Native Statement**: Any statement on a line containing React Native patterns  
- **Shared Statement**: Any statement on a line containing only shared patterns
- **Conflict Resolution**: If a line has both web and native patterns, categorize by first pattern found

### Step 3: Calculation Verification
```
Total Statements = Web Statements + Native Statements + Shared Statements
Reusability % = (Shared Statements / Total Statements) * 100
```

### Step 4: Pattern Priority Hierarchy
1. **Web patterns** take precedence over shared patterns on same line
2. **Native patterns** take precedence over shared patterns on same line
3. **Web vs Native conflict**: First detected pattern wins
4. **Import statements**: Categorized by import source (react-dom = web, react-native = native)

## Current Analyzer Issues (To Be Fixed)

### Problem 1: Statement Categorization
- **Current**: All statements default to "shared" during AST traversal
- **Expected**: Statements categorized based on patterns during traversal
- **Impact**: All components show 100% reusability (false positives)

### Problem 2: Pattern-Statement Disconnect
- **Current**: Pattern analysis happens after AST traversal
- **Expected**: Pattern analysis integrated into statement categorization
- **Impact**: Pattern counts correct, but statement counts wrong

### Problem 3: Line Counting Difference
- **Current**: Analyzer uses `content.split('\\n').length`
- **Unix wc -l**: Counts newline characters
- **Difference**: +1 line per file (methodological, not error)

## Post-Fix Validation Checklist

- [ ] web-heavy.tsx shows 55-65% reusability (not 100%)
- [ ] native-heavy.tsx shows 60-70% reusability (not 100%)
- [ ] shared-pure.tsx shows 100% reusability (unchanged)
- [ ] mixed.tsx shows 75-85% reusability (not 100%)
- [ ] Statement counts align with pattern detection
- [ ] No components show 0 web/native statements when patterns exist
- [ ] CLI tool displays realistic percentages
- [ ] JSON output contains accurate statement categorization

## Test Validation Commands

```bash
# Run analyzer on test components
cd tools/cross-platform-validation
node bin/validate-reuse.js --source ./test-components --output ./test-results --verbose

# Check specific component
node bin/validate-reuse.js --source ./test-components/web-heavy.tsx --verbose

# Compare with manual counts
node -e "
const fs = require('fs');
const analysis = JSON.parse(fs.readFileSync('./test-results/code-reuse-analysis-[DATE].json'));
console.log('Results vs Expected:');
analysis.byComponent.forEach(comp => {
  console.log(\`\${comp.componentName}: \${comp.reusable.percentage.toFixed(1)}% reusable\`);
});
"
```

---

**Last Updated**: June 17, 2025  
**Purpose**: Validation baseline for analyzer logic fix  
**Next Update**: After analyzer fix implementation