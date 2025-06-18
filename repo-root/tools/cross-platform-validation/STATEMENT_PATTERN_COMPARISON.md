# Statement vs Pattern Count Comparison Matrix

## Current Logic Disconnect Analysis

### Problem Summary
The analyzer has a fundamental architecture flaw where statement categorization (during AST traversal) is disconnected from pattern analysis (which happens afterward). This results in ALL statements being categorized as "shared" by default, regardless of detected patterns.

### Comparison Matrix: Demo Components

| Component | Total Statements | Patterns Detected | Current Result | Expected Result | Logic Disconnect |
|-----------|-----------------|-------------------|----------------|-----------------|-----------------|
| **button.tsx** | 28 | 2 web (className) | 100% shared | ~85-90% shared | ✅ Patterns ignored |
| **floating-support-button.tsx** | 173 | 25+ web patterns | 100% shared | ~60-70% shared | ✅ Patterns ignored |
| **input.tsx** | 35 | 6 web (className, onChange) | 100% shared | ~70-80% shared | ✅ Patterns ignored |
| **modal.tsx** | 82 | 15+ web (createPortal, DOM) | 100% shared | ~50-60% shared | ✅ Patterns ignored |
| **support-dashboard.tsx** | 243 | 40+ web patterns | 100% shared | ~40-50% shared | ✅ Patterns ignored |
| **support-widget.tsx** | 96 | 20+ web patterns | 100% shared | ~55-65% shared | ✅ Patterns ignored |

### Comparison Matrix: Test Components

| Component | Total Statements | Patterns Detected | Current Result | Expected Result | Logic Disconnect |
|-----------|-----------------|-------------------|----------------|-----------------|-----------------|
| **web-heavy.tsx** | 117 | 55+ web patterns | 100% shared | ~55-65% shared | ✅ Patterns ignored |
| **native-heavy.tsx** | 143 | 85+ native patterns | 100% shared | ~60-70% shared | ✅ Patterns ignored |
| **shared-pure.tsx** | 36 | 0 platform patterns | 100% shared | 100% shared | ✅ Correct by accident |
| **mixed.tsx** | 52 | 5 web + 3 native | 100% shared | ~75-85% shared | ✅ Patterns ignored |

## Code Flow Analysis

### Current Flawed Flow
```
1. AST Traversal (analyzeAST)
   └── Statement Visitor
       └── Default: result.shared.statements++ (ALWAYS)
       └── visitedLines.add(lineNumber)
       
2. Pattern Analysis (analyzeLinePatterns) - DISCONNECTED
   └── Detects patterns but doesn't affect statement counts
   └── Only populates metadata arrays
   
3. Result Calculation
   └── reusabilityScore = shared / total = 100% (ALWAYS)
```

### Required Fixed Flow
```
1. AST Traversal (analyzeAST)
   └── Statement Visitor
       └── categorizeStatementByPattern(node)
           ├── Check web patterns → result.webSpecific.statements++
           ├── Check native patterns → result.nativeSpecific.statements++
           └── No patterns → result.shared.statements++
       └── visitedLines.add(lineNumber)
       
2. Result Calculation
   └── reusabilityScore = shared / total (REALISTIC)
```

## Key Observations

1. **Pattern Detection Works**: The analyzer correctly identifies platform-specific patterns
2. **Counting is Broken**: Detected patterns don't influence statement categorization
3. **Architecture Flaw**: Two-phase approach prevents real-time categorization
4. **False Positives**: Every component appears 100% reusable regardless of content

## Impact Analysis

### Current State
- All components: 100% reusability ❌
- No differentiation between pure and platform-specific code
- Impossible to prioritize refactoring efforts
- Misleading metrics for cross-platform readiness

### After Fix
- Web-heavy components: 40-65% reusability ✅
- Native-heavy components: 60-70% reusability ✅
- Pure shared components: 100% reusability ✅
- Mixed components: 75-85% reusability ✅

## Pattern-Statement Mapping Examples

### Example 1: className Pattern
```typescript
// Current: Counted as shared
<div className="flex items-center">

// Should be: Counted as webSpecific
// Pattern match: /className\s*=/
```

### Example 2: StyleSheet Pattern
```typescript
// Current: Counted as shared
const styles = StyleSheet.create({...})

// Should be: Counted as nativeSpecific
// Pattern match: /StyleSheet\.create/
```

### Example 3: Pure React
```typescript
// Current: Counted as shared (correct)
const [state, setState] = useState()

// Should be: Counted as shared (correct)
// No platform patterns
```

## Next Steps

1. Implement `categorizeStatementByPattern()` helper method
2. Integrate pattern checking into AST traversal
3. Remove disconnected `analyzeLinePatterns()` phase
4. Validate with test components
5. Re-baseline all demo components with accurate metrics