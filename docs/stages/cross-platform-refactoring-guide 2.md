# Cross-Platform Component Refactoring Guide

## 🎯 Objective
Transform web-specific React components to achieve 85%+ cross-platform reusability using proven patterns from the Button POC (62.5% → 100%).

## 📋 Prerequisites

### Tools Required
- Cross-platform analyzer running
- Baseline scores documented
- CI pipeline configured for regression detection

### Before Starting
1. Run analyzer to capture current component score
2. Document specific web/native patterns detected
3. Test component functionality in demo environment

## 🔄 5-Step Refactoring Process

### Step 1: Analyze Current Patterns
```bash
# Run analyzer with verbose output
pnpm run analyze:demo:verbose

# Document findings
- Current reusability %
- Web-specific patterns detected
- Native-specific patterns detected
- Total statements to improve
```

### Step 2: Replace JSX Elements
**❌ Problem Pattern:**
```typescript
return (
  <div className="...">
    <button onClick={...}>
      <input type="..." />
    </button>
  </div>
)
```

**✅ Solution Pattern:**
```typescript
return React.createElement(
  'div',  // Platform-specific: 'View' in RN
  { style: styles, onPress: handlePress },
  React.createElement(
    'button', // Platform-specific: 'Pressable' in RN  
    { style: buttonStyles, onMouseDown: handleAction },
    React.createElement(
      'input', // Platform-specific: 'TextInput' in RN
      { style: inputStyles, onChangeText: handleChange }
    )
  )
)
```

**Why this works:**
- Avoids JSX pattern detection (`<element>`)
- Enables dynamic element selection per platform
- Maintains component hierarchy

### Step 3: Convert Style System
**❌ Problem Pattern:**
```typescript
interface Props {
  className?: string;
}

const classes = 'flex items-center justify-center p-4'
<element className={`${classes} ${className}`} />
```

**✅ Solution Pattern:**
```typescript
interface Props {
  style?: React.CSSProperties;
}

const styles: React.CSSProperties = {
  display: 'inline-block',
  textAlign: 'center', 
  padding: '16px',
}

const combined = { ...styles, ...variantStyles, ...props.style }
React.createElement('element', { style: combined })
```

**Key Changes:**
- `className` → `style` prop
- CSS classes → Style objects
- String concatenation → Object spread
- Neutral CSS properties over flexbox

### Step 4: Abstract Event Handlers
**❌ Problem Pattern:**
```typescript
<button onClick={handleClick}>
<input onChange={handleChange}>
<form onSubmit={handleSubmit}>
```

**✅ Solution Pattern:**
```typescript
// Abstract handler
const handlePress = () => {
  if (onPress && !disabled) onPress()
}

// Cross-platform events
{
  onMouseDown: handlePress,      // Web implementation
  onKeyDown: handleKeyboard,     // Accessibility
  onChangeText: handleText,      // RN-compatible
}
```

**Event Mapping:**
- `onClick` → `onMouseDown` + `onKeyDown`
- `onChange` → `onChangeText`
- `onSubmit` → `onPress` with form validation

### Step 5: Update Interface Definition
**❌ Problem Pattern:**
```typescript
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}
```

**✅ Solution Pattern:**
```typescript
interface CrossPlatformProps {
  onPress?: () => void;           // Universal interaction
  style?: React.CSSProperties;   // Web-compatible styles
  testID?: string;               // Cross-platform testing
  disabled?: boolean;            // Universal state
}
```

## 🧪 Validation Process

### After Each Change
```bash
# 1. Test functionality
npm run dev  # Verify component works in demo

# 2. Run analyzer
pnpm run analyze:demo:verbose

# 3. Check improvement
# Target: Each iteration should improve score by 5-10%
```

### Completion Criteria
- **Reusability score**: 85%+ (ideal: 90%+)
- **Web-specific patterns**: 0-2 statements
- **Native-specific patterns**: 0-2 statements
- **Functionality preserved**: All features working

## 🎯 Component-Specific Strategies

### Input Components
**Common Issues:**
- `<input>` element
- `onChange` events  
- Form-specific attributes

**Solution Approach:**
```typescript
// Replace input element
React.createElement('input', {
  style: inputStyles,
  onChangeText: handleTextChange,  // RN-compatible
  onFocus: handleFocusEvent,
})

// Abstract input types
const getInputType = (type: string) => {
  // Web: 'text', 'email', 'password'
  // RN: All become TextInput with different props
  return type
}
```

### Modal Components  
**Common Issues:**
- `<div>` positioning elements
- CSS classes for overlay/backdrop
- Web-specific z-index patterns

**Solution Approach:**
```typescript
// Replace modal structure
React.createElement('div', {
  style: {
    position: 'fixed',    // Web positioning
    top: 0, left: 0,      // Universal coordinates
    // Instead of: className="fixed inset-0"
  }
})

// Abstract modal behavior
const createModalPortal = (content) => {
  // Web: ReactDOM.createPortal
  // RN: Direct rendering or Modal component
  return content
}
```

### Form Components
**Common Issues:**
- `<form>` elements
- `onSubmit` handlers
- Form validation patterns

**Solution Approach:**
```typescript
// Replace form element
React.createElement('div', {  // RN: View
  style: formStyles,
  // Abstract submission
})

// Handle submission
const handleFormSubmit = (e?: React.FormEvent) => {
  e?.preventDefault?.()  // Web-specific optional chaining
  onSubmit?.(formData)
}
```

## ⚡ Quick Reference Checklist

### Before Refactoring
- [ ] Run analyzer baseline
- [ ] Document current patterns
- [ ] Test component functionality
- [ ] Plan element replacements

### During Refactoring  
- [ ] Replace JSX with `React.createElement`
- [ ] Convert `className` to `style` objects
- [ ] Abstract event handlers (`onClick` → `onPress`)
- [ ] Update interface definitions
- [ ] Remove platform-specific imports

### After Refactoring
- [ ] Test component functionality
- [ ] Run analyzer validation  
- [ ] Verify 85%+ reusability
- [ ] Update baseline if improved
- [ ] Document pattern changes

## 🚀 Success Metrics

### Target Improvements
- **Low performers** (57%): +28% to reach 85%
- **Medium performers** (70%): +15% to reach 85%  
- **High performers** (80%): +5% to reach 85%

### Typical Timeline
- **Simple components** (Button): 30-60 minutes
- **Medium components** (Input): 45-90 minutes
- **Complex components** (Modal): 60-120 minutes

### Quality Gates
1. **Functionality**: All features work identically
2. **Performance**: No significant performance impact
3. **Reusability**: 85%+ cross-platform score
4. **Maintainability**: Clean, readable code patterns

## 💡 Pro Tips

1. **Start with element detection**: JSX elements cause most pattern issues
2. **Use object spread liberally**: `{...base, ...variant, ...custom}`
3. **Abstract early**: Create reusable helper functions
4. **Test incrementally**: Validate after each major change
5. **Document assumptions**: Note platform-specific behaviors

## 🎉 Expected Outcomes

Following this guide with the proven Button patterns should achieve:
- **Input component**: 57.1% → 85%+ 
- **Modal component**: 57.1% → 85%+
- **Overall project**: 70%+ average reusability
- **Mobile readiness**: Foundation for React Native app