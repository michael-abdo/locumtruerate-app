# Button Component Baseline Analysis - Current 62.5% Score

## Analyzer Results Summary
- **Total Statements**: 8
- **Web-Specific Statements**: 3 (37.5% of total)
- **Reusable Statements**: 5 (62.5% of total)
- **Target**: 85%+ (need to convert 2+ web statements to reusable)

## Web-Specific Patterns Detected

### 1. className Attribute (Lines 15, 35)
```typescript
className = '',  // Line 15 - web-specific prop
className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}  // Line 35
```
**Issue**: React Native doesn't support className attribute
**Solution**: Replace with StyleSheet objects

### 2. HTML button Element (Lines 34-39)
```typescript
<button
  className={...}
  {...props}
>
  {children}
</button>
```
**Issue**: HTML elements don't exist in React Native
**Solution**: Use Pressable or TouchableOpacity

### 3. Web-Specific Interface (Line 5)
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>
```
**Issue**: ButtonHTMLAttributes is web-only
**Solution**: Create generic cross-platform interface

## CSS Classes That Need Conversion

### Base Classes (Line 18)
```typescript
const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
```

### Variant Classes (Lines 21-25)
```typescript
primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
```

### Size Classes (Lines 28-31)
```typescript
sm: 'px-3 py-1.5 text-sm',
md: 'px-4 py-2 text-sm',
lg: 'px-6 py-3 text-base',
```

## Refactoring Strategy

1. **Replace HTML button** → `Pressable` with proper platform detection
2. **Convert className to styles** → StyleSheet.create() objects
3. **Abstract event handling** → onPress instead of onClick
4. **Remove web-specific types** → Generic props interface

## Expected Outcome
Converting these 3 web-specific patterns should increase Button score from **62.5% → 85%+**

## Component Complexity Assessment
- **Lines**: 41 (small, low risk)
- **Complexity**: 1 (very simple)
- **Dependencies**: 1 (only React)
- **Risk Level**: ⭐ Very Low

Perfect candidate for POC validation.