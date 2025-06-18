# Week 3 Component Patterns Guide

## Purpose
This document establishes component patterns and architectural guidelines derived from Week 2's validated foundation for Week 3 True Rate Calculator development.

## Core Component Patterns

### 1. Mobile-First Responsive Pattern
```tsx
// ✅ ESTABLISHED PATTERN: Progressive enhancement breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="px-4 sm:px-6 lg:px-8">
    <h2 className="text-xl md:text-2xl lg:text-3xl">
      {/* Content scales with screen size */}
    </h2>
  </div>
</div>

// 📱 WEEK 3 APPLICATION: True Rate Calculator Layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div className="order-2 lg:order-1">
    {/* Calculator inputs - mobile first */}
  </div>
  <div className="order-1 lg:order-2">
    {/* Results display - prominent on mobile */}
  </div>
</div>
```

### 2. Reusable Component Interface Pattern
```tsx
// ✅ ESTABLISHED PATTERN: Props interface with TypeScript
interface ComponentProps {
  // Required props explicitly defined
  id: string
  value: string | number
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  
  // Event handlers for cross-platform compatibility
  onChange?: (value: string) => void
  onFocus?: () => void
  onBlur?: () => void
  
  // Accessibility props
  ariaLabel?: string
  ariaDescribedBy?: string
}

// 📱 WEEK 3 APPLICATION: Calculator Input Component
interface CalculatorInputProps {
  label: string
  value: number | string
  unit?: '$' | '%' | 'hours' | 'days'
  helpText?: string
  validation?: (value: string) => string | null
  onChange: (value: string) => void
  
  // Mobile-specific
  keyboardType?: 'numeric' | 'decimal'
  showCalculatorButton?: boolean
}
```

### 3. State Management Pattern
```tsx
// ✅ ESTABLISHED PATTERN: Local state with hooks
const [isOpen, setIsOpen] = useState(false)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)

// State updates with proper typing
const handleSubmit = async (data: FormData) => {
  setLoading(true)
  setError(null)
  try {
    await submitData(data)
    setIsOpen(false)
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}

// 📱 WEEK 3 APPLICATION: Calculator State Management
interface CalculatorState {
  // Input values
  hourlyRate: number
  hoursPerWeek: number
  weeksPerYear: number
  
  // Expenses
  malpracticeInsurance: number
  healthInsurance: number
  otherExpenses: number
  
  // Results
  trueHourlyRate: number | null
  annualIncome: number | null
  takeHomeIncome: number | null
  
  // UI state
  showAdvancedOptions: boolean
  calculationMethod: 'simple' | 'detailed'
}
```

### 4. Cross-Platform Abstraction Pattern
```tsx
// ✅ ESTABLISHED PATTERN: Platform-agnostic interfaces
interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

// Web implementation
class WebStorage implements StorageAdapter {
  async getItem(key: string) {
    return localStorage.getItem(key)
  }
  // ...
}

// 📱 WEEK 3 APPLICATION: Calculator Data Persistence
interface CalculatorStorage {
  saveCalculation(data: CalculatorState): Promise<void>
  loadLastCalculation(): Promise<CalculatorState | null>
  getCalculationHistory(): Promise<CalculatorState[]>
  clearHistory(): Promise<void>
}

// Platform-specific implementations
const storage = Platform.select({
  web: new WebCalculatorStorage(),
  ios: new IOSCalculatorStorage(),
  android: new AndroidCalculatorStorage()
})
```

### 5. Accessibility Pattern
```tsx
// ✅ ESTABLISHED PATTERN: WCAG 2.1 AA compliance
<button
  className="px-4 py-3 min-h-[44px] touch-manipulation"
  aria-label={ariaLabel}
  aria-pressed={isPressed}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  {children}
</button>

// 📱 WEEK 3 APPLICATION: Accessible Calculator Controls
<div role="region" aria-label="True Rate Calculator">
  <form onSubmit={handleCalculate}>
    <fieldset>
      <legend className="sr-only">Rate Information</legend>
      {/* Grouped related inputs */}
    </fieldset>
    
    <div role="status" aria-live="polite" aria-atomic="true">
      {calculationResult && (
        <p>Your true hourly rate is ${calculationResult}</p>
      )}
    </div>
  </form>
</div>
```

## Component Architecture for Week 3

### 1. Calculator Component Structure
```
/components/calculator/
├── TrueRateCalculator.tsx       # Main container component
├── CalculatorForm.tsx           # Input form with validation
├── CalculatorResults.tsx        # Results display component
├── CalculatorHelp.tsx          # Help/tooltip system
├── inputs/
│   ├── RateInput.tsx           # Specialized number input
│   ├── ExpenseInput.tsx        # Expense entry component
│   └── SelectInput.tsx         # Dropdown selections
├── results/
│   ├── RateSummary.tsx         # Key metrics display
│   ├── ComparisonChart.tsx     # Visual comparisons
│   └── BreakdownTable.tsx      # Detailed breakdown
└── utils/
    ├── calculations.ts         # Pure calculation functions
    ├── validation.ts           # Input validation logic
    └── formatting.ts           # Number/currency formatting
```

### 2. Reusable Input Components
```tsx
// Rate Input Component (reuses established patterns)
export const RateInput: React.FC<RateInputProps> = ({
  label,
  value,
  unit = '$',
  onChange,
  helpText,
  error,
  ...props
}) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {helpText && (
          <TooltipIcon content={helpText} />
        )}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {unit}
        </span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full pl-8 pr-3 py-2 border rounded-lg",
            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "min-h-[44px] text-base", // Mobile touch target
            error && "border-red-500"
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <p id={`${props.id}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
```

### 3. Calculator Business Logic
```tsx
// Pure, testable calculation functions
export const calculateTrueRate = (params: CalculatorInputs): CalculatorResults => {
  const {
    hourlyRate,
    hoursPerWeek,
    weeksPerYear,
    malpracticeInsurance,
    healthInsurance,
    retirement401k,
    otherExpenses,
    taxRate
  } = params
  
  // Gross annual income
  const grossAnnualIncome = hourlyRate * hoursPerWeek * weeksPerYear
  
  // Total annual expenses
  const annualExpenses = 
    malpracticeInsurance +
    healthInsurance +
    retirement401k +
    otherExpenses
  
  // Net income after expenses
  const netIncomeBeforeTax = grossAnnualIncome - annualExpenses
  
  // After tax income
  const afterTaxIncome = netIncomeBeforeTax * (1 - taxRate / 100)
  
  // True hourly rate
  const totalHoursPerYear = hoursPerWeek * weeksPerYear
  const trueHourlyRate = afterTaxIncome / totalHoursPerYear
  
  return {
    grossAnnualIncome,
    annualExpenses,
    netIncomeBeforeTax,
    afterTaxIncome,
    trueHourlyRate,
    effectiveTaxRate: taxRate,
    expenseRatio: (annualExpenses / grossAnnualIncome) * 100
  }
}
```

### 4. Mobile-Optimized Calculator Layout
```tsx
export const TrueRateCalculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>(initialState)
  const [showResults, setShowResults] = useState(false)
  
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Mobile: Single column, Desktop: Two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="order-2 lg:order-1">
          <CalculatorForm
            state={state}
            onChange={setState}
            onCalculate={() => setShowResults(true)}
          />
        </div>
        
        {/* Results Section - More prominent on mobile */}
        <div className="order-1 lg:order-2">
          {showResults ? (
            <CalculatorResults
              inputs={state}
              results={calculateTrueRate(state)}
            />
          ) : (
            <CalculatorHelp />
          )}
        </div>
      </div>
      
      {/* Mobile-friendly floating action */}
      <FloatingCalculateButton
        onClick={() => setShowResults(true)}
        className="lg:hidden" // Only on mobile
      />
    </div>
  )
}
```

## Testing Patterns

### 1. Component Testing
```tsx
// Test reusable components in isolation
describe('RateInput', () => {
  it('renders with correct props', () => {
    render(
      <RateInput
        label="Hourly Rate"
        value={150}
        unit="$"
        onChange={jest.fn()}
      />
    )
    expect(screen.getByLabelText('Hourly Rate')).toBeInTheDocument()
  })
  
  it('handles mobile keyboard types', () => {
    const { getByRole } = render(
      <RateInput
        label="Rate"
        value={0}
        keyboardType="numeric"
        onChange={jest.fn()}
      />
    )
    expect(getByRole('spinbutton')).toHaveAttribute('inputMode', 'numeric')
  })
})
```

### 2. Business Logic Testing
```tsx
describe('calculateTrueRate', () => {
  it('calculates correct true hourly rate', () => {
    const inputs = {
      hourlyRate: 200,
      hoursPerWeek: 40,
      weeksPerYear: 48,
      malpracticeInsurance: 12000,
      healthInsurance: 24000,
      retirement401k: 19500,
      otherExpenses: 5000,
      taxRate: 35
    }
    
    const results = calculateTrueRate(inputs)
    
    expect(results.grossAnnualIncome).toBe(384000)
    expect(results.annualExpenses).toBe(60500)
    expect(results.trueHourlyRate).toBeCloseTo(109.51, 2)
  })
})
```

## Migration Strategy from Week 2

### 1. Component Reuse
```tsx
// Direct reuse from Week 2
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Modal } from '@/components/modal'

// Extend for calculator needs
import { FloatingSupportButton } from '@/components/floating-support-button'

// Transform to calculator help
export const CalculatorHelpButton = () => (
  <FloatingSupportButton
    position="bottom-right"
    theme="blue"
    customContent={<CalculatorHelpWidget />}
  />
)
```

### 2. Pattern Application
- **Legal Pages Pattern** → Calculator documentation/guides
- **Support Dashboard Pattern** → Calculation history dashboard
- **Support Widget Pattern** → Calculator help system
- **Modal Pattern** → Advanced options, save/load calculations
- **Responsive Grid Pattern** → Calculator layout

### 3. Authentication Integration Points
```tsx
// Prepared for tRPC/Clerk re-integration
interface CalculatorWithAuth {
  // Anonymous calculations (no auth required)
  calculateRate: (inputs: CalculatorInputs) => CalculatorResults
  
  // Authenticated features (ready for Week 3)
  saveCalculation?: (data: SavedCalculation) => Promise<void>
  loadHistory?: () => Promise<SavedCalculation[]>
  compareRates?: (jobIds: string[]) => Promise<Comparison>
}
```

## Performance Optimization Patterns

### 1. Calculation Memoization
```tsx
// Expensive calculations cached
const memoizedCalculation = useMemo(
  () => calculateTrueRate(inputs),
  [inputs]
)

// Debounced input handling
const debouncedCalculate = useMemo(
  () => debounce(handleCalculate, 300),
  [handleCalculate]
)
```

### 2. Code Splitting
```tsx
// Lazy load advanced features
const AdvancedCalculator = lazy(() => 
  import('./AdvancedCalculator')
)

const ComparisonChart = lazy(() => 
  import('./results/ComparisonChart')
)
```

### 3. Mobile Performance
```tsx
// Optimize for mobile devices
const CalculatorResults = memo(({ results }) => {
  // Avoid expensive re-renders
  return (
    <div className="space-y-4">
      {/* Use CSS transforms for animations */}
      <div className="transform transition-all duration-300">
        {/* Content */}
      </div>
    </div>
  )
})
```

## Conclusion

These patterns provide a solid foundation for Week 3 True Rate Calculator development:

1. **Mobile-First**: All patterns optimize for mobile experience first
2. **Reusable**: Components designed for cross-feature use
3. **Accessible**: WCAG 2.1 AA compliance built-in
4. **Performant**: Optimization patterns for complex calculations
5. **Cross-Platform**: Ready for React Native adaptation

The patterns established in Week 2 have been validated and enhanced to support the specific needs of the True Rate Calculator while maintaining consistency with the overall platform architecture.