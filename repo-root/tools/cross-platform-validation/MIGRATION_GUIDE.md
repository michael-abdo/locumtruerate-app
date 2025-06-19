# Migration Guide - Analyzer JSON Output Changes

**Date**: June 18, 2025  
**Version**: 1.0.0 → 1.1.0  
**Breaking Changes**: None (structure unchanged, only values corrected)  

## 📋 Overview

The code reuse analyzer fix corrects the calculation logic but maintains the exact same JSON output structure. Systems consuming the JSON output will not break, but they need to adjust to the new accurate values.

## 🔄 What Changed

### Value Changes (No Structure Changes)

| Field | Before Fix | After Fix | Impact |
|-------|------------|-----------|---------|
| `reusable.percentage` | Always 100% | 53.8% - 100% | Dashboards need new scale |
| `platformSpecific.web.statements` | Always 0 | 0-10 (realistic) | Alerts need new thresholds |
| `platformSpecific.native.statements` | Always 0 | 0-6 (realistic) | Priority calculations affected |
| `overall.targetMet` | Always true | true/false (realistic) | Status indicators need update |
| `overall.componentsAboveTarget` | All components | Variable | Progress tracking affected |

### Example JSON Comparison

**Before Fix** (incorrect):
```json
{
  "filePath": "support-widget.tsx",
  "reusable": {
    "percentage": 100,  // ALWAYS 100%
    "statements": 123
  },
  "platformSpecific": {
    "web": {
      "statements": 0,  // ALWAYS 0
      "patterns": [/* 81 patterns detected but ignored */]
    }
  }
}
```

**After Fix** (accurate):
```json
{
  "filePath": "support-widget.tsx",
  "reusable": {
    "percentage": 83.87096774193549,  // REALISTIC
    "statements": 52
  },
  "platformSpecific": {
    "web": {
      "statements": 10,  // ACCURATE COUNT
      "patterns": [/* 81 patterns detected and counted */]
    }
  }
}
```

## 🛠️ Migration Steps

### 1. Dashboard Updates

**Old Logic**:
```javascript
// Assuming 100% is normal
if (component.reusable.percentage < 100) {
  showWarning(); // Never triggered
}
```

**New Logic**:
```javascript
// 85% is the target, not 100%
if (component.reusable.percentage < 85) {
  showWarning(); // Now meaningful
}
```

### 2. Progress Tracking

**Old Calculation**:
```javascript
const progress = componentsAboveTarget / totalComponents;
// Always 100% (6/6)
```

**New Calculation**:
```javascript
const progress = componentsAboveTarget / totalComponents;
// Realistic (e.g., 5/9 = 55.6%)
```

### 3. Alert Thresholds

**Update alert conditions**:
- **Critical**: < 60% reusability (was never triggered)
- **Warning**: < 85% reusability (new target)
- **Success**: ≥ 85% reusability (not 100%)

### 4. Visualization Scales

**Charts and graphs need new scales**:
- **Y-axis**: 0-100% (not just showing 100%)
- **Color coding**: 
  - Red: < 60%
  - Yellow: 60-84%
  - Green: ≥ 85%

## 📊 Component Priority Calculation

### Old Priority Logic
All components appeared equal (100% reusable), so priority was arbitrary.

### New Priority Logic
```javascript
function calculatePriority(component) {
  const reusability = component.reusable.percentage;
  
  if (reusability < 60) return 'CRITICAL';
  if (reusability < 70) return 'HIGH';
  if (reusability < 85) return 'MEDIUM';
  return 'LOW';
}
```

## 🔍 Identifying Pre-Fix Data

To detect if you're looking at pre-fix data:

```javascript
function isPreFixData(analysisResult) {
  // Pre-fix data has ALL components at exactly 100%
  const allAt100 = analysisResult.byComponent.every(
    comp => comp.reusable.percentage === 100
  );
  
  // Pre-fix data has NO web/native statements despite patterns
  const noStatements = analysisResult.byComponent.every(
    comp => comp.platformSpecific.web.statements === 0 &&
            comp.platformSpecific.native.statements === 0 &&
            (comp.platformSpecific.web.patterns.length > 0 ||
             comp.platformSpecific.native.patterns.length > 0)
  );
  
  return allAt100 && noStatements;
}
```

## 📈 Historical Data Handling

### Recommendation for Historical Data
1. **Archive pre-fix data** with clear labeling
2. **Don't mix** pre-fix and post-fix data in trends
3. **Start new baselines** from the fix date
4. **Document the discontinuity** in reports

### Example Migration Script
```javascript
async function migrateHistoricalData() {
  const analyses = await loadAllAnalyses();
  
  for (const analysis of analyses) {
    if (isPreFixData(analysis)) {
      // Archive with clear naming
      await saveToArchive(analysis, 'pre-analyzer-fix');
      
      // Remove from active datasets
      await removeFromActive(analysis);
      
      // Log for audit trail
      console.log(`Archived pre-fix analysis: ${analysis.date}`);
    }
  }
}
```

## ✅ Validation Checklist

After migrating, verify:

- [ ] Dashboards show varied percentages (not all 100%)
- [ ] Alerts trigger for components below 85%
- [ ] Priority calculations reflect actual reusability
- [ ] Historical trends start fresh from fix date
- [ ] Progress indicators show realistic values
- [ ] Color coding matches new thresholds
- [ ] Pre-fix data is clearly archived/labeled

## 🚨 Common Pitfalls

1. **Don't assume backward compatibility** for business logic
2. **Don't average** pre-fix and post-fix data
3. **Don't set targets** based on old 100% baselines
4. **Don't ignore** components now showing < 85%

## 📝 Support

For questions about the migration:
1. Review the ANALYZER_FIX_DOCUMENTATION.md
2. Check analyzer unit tests for expected behavior
3. Compare your results with the test fixtures

The fix ensures accurate data for meaningful cross-platform development decisions.