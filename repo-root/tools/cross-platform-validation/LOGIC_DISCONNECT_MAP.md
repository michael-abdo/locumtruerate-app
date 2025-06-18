# Logic Disconnect Mapping: AST Traversal vs Pattern Analysis

## Critical Code Analysis

### The Flawed Statement Visitor (lines 178-187)
```typescript
// Count all statements for shared code
Statement: (nodePath) => {
  const lineNumber = nodePath.node.loc?.start.line || 0;
  if (!visitedLines.has(lineNumber)) {
    // Default to shared unless already categorized
    result.shared.statements++;
    result.shared.lines++;
    visitedLines.add(lineNumber);
  }
}
```

**PROBLEM**: This visitor runs for EVERY statement in the AST and:
1. Always increments `result.shared.statements++`
2. Always increments `result.shared.lines++`
3. Adds line to `visitedLines` preventing any future categorization

### The Disconnected Pattern Analysis (lines 199-226)
```typescript
private analyzeLinePatterns(lines: string[], result: any) {
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check web patterns
    for (const pattern of this.config.platformPatterns.web.patterns) {
      if (pattern.test(line)) {
        result.webSpecific.patterns.push({
          pattern: pattern.source,
          line: lineNumber,
          code: line.trim(),
          reason: 'Web-specific pattern detected'
        });
        break;
      }
    }
    // Similar for native patterns...
  });
}
```

**PROBLEM**: This method:
1. Runs AFTER AST traversal is complete
2. Only populates pattern metadata arrays
3. NEVER updates statement/line counts
4. Has no access to AST nodes or statement context

## The Fatal Sequence

### Current Execution Order:
```
1. traverse(ast, {...})                    // AST Traversal starts
2. ImportDeclaration visitor               // Checks imports (works correctly)
3. MemberExpression visitor                // Checks API calls (works correctly)
4. Statement visitor                       // BROKEN: Always counts as shared
   - Line 10: <div className="...">        → shared++ (WRONG!)
   - Line 20: StyleSheet.create({})        → shared++ (WRONG!)
   - Line 30: const [state] = useState()   → shared++ (CORRECT)
5. analyzeLinePatterns()                   // Runs after, detects patterns but can't fix counts
   - Line 10: Detects className pattern    → adds to metadata only
   - Line 20: Detects StyleSheet pattern   → adds to metadata only
```

### Result:
- webSpecific.statements = 0 (never incremented)
- nativeSpecific.statements = 0 (never incremented)
- shared.statements = 100 (all statements)
- patterns arrays are populated but ignored in calculations

## Why visitedLines Prevents Fix

The `visitedLines` Set is the lock that prevents correction:

```typescript
// In Statement visitor:
if (!visitedLines.has(lineNumber)) {
  result.shared.statements++;
  visitedLines.add(lineNumber);  // LOCKS this line
}

// Later in analyzeLinePatterns:
// Even if we wanted to recategorize, the line is already visited!
```

## The Required Integration

### What Needs to Happen:
```typescript
Statement: (nodePath) => {
  const lineNumber = nodePath.node.loc?.start.line || 0;
  if (!visitedLines.has(lineNumber)) {
    const nodeCode = generate(nodePath.node).code;
    
    // Check patterns IN REAL TIME
    if (this.hasWebPattern(nodeCode)) {
      result.webSpecific.statements++;
      result.webSpecific.lines++;
      result.webSpecific.patterns.push({...});
    } else if (this.hasNativePattern(nodeCode)) {
      result.nativeSpecific.statements++;
      result.nativeSpecific.lines++;
      result.nativeSpecific.patterns.push({...});
    } else {
      result.shared.statements++;
      result.shared.lines++;
    }
    
    visitedLines.add(lineNumber);
  }
}
```

## Import/API Detection Works Correctly

The import and API detection works because they:
1. Have specific AST node types (ImportDeclaration, MemberExpression)
2. Check patterns and categorize in real-time
3. Update counts immediately during traversal

Example:
```typescript
ImportDeclaration: (nodePath) => {
  const source = nodePath.node.source.value;
  if (this.config.platformPatterns.web.imports.includes(source)) {
    result.webSpecific.imports.push(source);
    result.webSpecific.lines++;  // Correctly increments
  }
}
```

## Summary

**The Core Issue**: Statement categorization happens in AST traversal with no pattern knowledge, while pattern detection happens afterward with no ability to update counts.

**The Fix**: Integrate pattern detection into the Statement visitor so categorization happens in real-time based on actual code content.