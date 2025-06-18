# Calculator Component Architecture Plan

## Executive Summary

This document defines the comprehensive architecture for the True Rate Calculator, integrating with the existing calc-core package while maintaining mobile-first design principles and cross-platform compatibility.

## Architecture Overview

### System Integration
```
┌─────────────────────────────────────┐
│          User Interface             │
│  ┌─────────────┬─────────────────┐  │
│  │   Mobile    │    Desktop      │  │
│  │   Layout    │    Layout       │  │
│  └─────────────┴─────────────────┘  │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│      Calculator Components         │
│  ┌──────────┬──────────┬─────────┐ │
│  │  Input   │  Logic   │ Results │ │
│  │ Components│ Layer   │Display  │ │
│  └──────────┴──────────┴─────────┘ │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│        calc-core Package           │
│  ┌──────────────────────────────┐  │
│  │  ContractCalculationEngine   │  │
│  │  PaycheckCalculationEngine   │  │
│  │  TaxCalculator              │  │
│  │  LocationDataProvider       │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Component Hierarchy

### Primary Components Architecture
```
TrueRateCalculator (Container)
├── CalculatorLayout (Responsive wrapper)
├── CalculatorInputs (Form container)
│   ├── BasicInputs (Essential fields)
│   │   ├── HourlyRateInput
│   │   ├── ScheduleInputs
│   │   └── LocationInput
│   ├── AdvancedInputs (Expandable section)
│   │   ├── DeductionInputs
│   │   ├── TaxInputs
│   │   └── BenefitsInputs
│   └── ActionButtons
│       ├── CalculateButton
│       ├── SaveButton
│       └── CompareButton
├── CalculatorResults (Results display)
│   ├── SummaryCard (Main result)
│   ├── BreakdownTable (Detailed view)
│   ├── ComparisonChart (Visual comparison)
│   └── ExportOptions
└── CalculatorHistory (Saved calculations)
    ├── RecentCalculations
    ├── FavoriteCalculations
    └── CalculationNotes
```

## Core Component Specifications

### 1. TrueRateCalculator (Main Container)
```typescript
interface TrueRateCalculatorProps {
  // Configuration
  mode?: 'basic' | 'advanced' | 'comparison';
  initialData?: Partial<CalculatorInputs>;
  
  // Callbacks
  onCalculationComplete?: (result: CalculationResult) => void;
  onSave?: (calculation: SavedCalculation) => void;
  onCompare?: (calculations: CalculationComparison) => void;
  
  // Features
  enableHistory?: boolean;
  enableExport?: boolean;
  enableComparison?: boolean;
}

interface CalculatorInputs {
  // Basic inputs
  hourlyRate: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  location?: {
    zipCode: string;
    state: string;
    costIndex: number;
  };
  
  // Advanced inputs
  deductions: {
    malpracticeInsurance?: number;
    healthInsurance?: number;
    retirement401k?: number;
    otherExpenses?: number;
  };
  
  taxes: {
    federalRate?: number;
    stateRate?: number;
    selfEmploymentTax?: boolean;
  };
  
  benefits: {
    healthInsuranceValue?: number;
    retirementMatching?: number;
    paidTimeOff?: number;
  };
}

interface CalculationResult {
  // Core results
  grossAnnualIncome: number;
  netAnnualIncome: number;
  trueHourlyRate: number;
  
  // Detailed breakdown
  totalDeductions: number;
  totalTaxes: number;
  effectiveTaxRate: number;
  locationAdjustment: number;
  
  // Comparisons
  industryComparison?: {
    percentile: number;
    averageRate: number;
    suggestion: string;
  };
  
  // Metadata
  calculatedAt: Date;
  inputHash: string;
}
```

### 2. CalculatorLayout (Responsive Container)
```typescript
interface CalculatorLayoutProps {
  children: {
    inputs: React.ReactNode;
    results: React.ReactNode;
    actions?: React.ReactNode;
  };
  
  layout?: 'mobile' | 'tablet' | 'desktop' | 'auto';
  sticky?: 'results' | 'actions' | 'none';
}

// Layout breakpoints and behavior
const layoutConfig = {
  mobile: {
    // Stack vertically: Results → Inputs → Actions
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    order: {
      results: 1,    // Show results first on mobile
      inputs: 2,
      actions: 3
    }
  },
  
  tablet: {
    // Two columns: Inputs | Results
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    gridTemplateAreas: `
      "inputs results"
      "actions actions"
    `
  },
  
  desktop: {
    // Optimal layout: Inputs (2fr) | Results (1fr)
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '32px',
    gridTemplateAreas: `
      "inputs results"
      "actions results"
    `
  }
};
```

### 3. Input Components Architecture

#### HourlyRateInput
```typescript
interface HourlyRateInputProps {
  value: number;
  onChange: (value: number) => void;
  specialty?: string;
  location?: string;
  suggestions?: {
    min: number;
    max: number;
    average: number;
    percentiles: { p25: number; p50: number; p75: number; };
  };
}

const HourlyRateInput: React.FC<HourlyRateInputProps> = ({
  value,
  onChange,
  suggestions,
  specialty,
  location
}) => {
  return (
    <div className="rate-input-container">
      {/* Rate suggestion banner */}
      {suggestions && (
        <div className="suggestions-banner">
          <span className="suggestion-text">
            {specialty} rates in {location}: ${suggestions.min}-${suggestions.max}/hr
          </span>
          <div className="percentile-markers">
            <span onClick={() => onChange(suggestions.p25)}>25th: ${suggestions.p25}</span>
            <span onClick={() => onChange(suggestions.p50)}>50th: ${suggestions.p50}</span>
            <span onClick={() => onChange(suggestions.p75)}>75th: ${suggestions.p75}</span>
          </div>
        </div>
      )}
      
      {/* Main rate input */}
      <CurrencyInput
        label="Hourly Rate"
        value={value}
        onChange={onChange}
        placeholder="Enter your hourly rate"
        min={50}
        max={500}
        step={5}
        aria-describedby="rate-help"
      />
      
      <div id="rate-help" className="input-help">
        This is your gross hourly rate before deductions and taxes
      </div>
    </div>
  );
};
```

#### ScheduleInputs (Grouped Component)
```typescript
interface ScheduleInputsProps {
  hoursPerWeek: number;
  weeksPerYear: number;
  onHoursChange: (hours: number) => void;
  onWeeksChange: (weeks: number) => void;
}

const ScheduleInputs: React.FC<ScheduleInputsProps> = ({
  hoursPerWeek,
  weeksPerYear,
  onHoursChange,
  onWeeksChange
}) => {
  const commonSchedules = [
    { label: "Part-time", hours: 20, weeks: 50 },
    { label: "Standard", hours: 40, weeks: 50 },
    { label: "Heavy", hours: 50, weeks: 48 },
    { label: "Intensive", hours: 60, weeks: 46 }
  ];
  
  return (
    <fieldset className="schedule-inputs">
      <legend>Work Schedule</legend>
      
      {/* Quick presets */}
      <div className="schedule-presets">
        {commonSchedules.map(schedule => (
          <button
            key={schedule.label}
            type="button"
            className={`preset-button ${
              hoursPerWeek === schedule.hours && weeksPerYear === schedule.weeks 
                ? 'active' : ''
            }`}
            onClick={() => {
              onHoursChange(schedule.hours);
              onWeeksChange(schedule.weeks);
            }}
          >
            {schedule.label}
            <span className="preset-details">
              {schedule.hours}h/wk × {schedule.weeks}wk
            </span>
          </button>
        ))}
      </div>
      
      {/* Custom inputs */}
      <div className="schedule-custom">
        <NumberInput
          label="Hours per week"
          value={hoursPerWeek}
          onChange={onHoursChange}
          min={1}
          max={80}
          step={1}
        />
        
        <NumberInput
          label="Weeks per year"
          value={weeksPerYear}
          onChange={onWeeksChange}
          min={1}
          max={52}
          step={1}
        />
      </div>
      
      {/* Live calculation preview */}
      <div className="schedule-preview">
        Total annual hours: {hoursPerWeek * weeksPerYear}
      </div>
    </fieldset>
  );
};
```

### 4. Results Display Architecture

#### SummaryCard (Primary Result)
```typescript
interface SummaryCardProps {
  result: CalculationResult;
  comparison?: {
    previous?: number;
    industry?: number;
  };
  loading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  result,
  comparison,
  loading
}) => {
  if (loading) {
    return <SummaryCardSkeleton />;
  }
  
  return (
    <div className="summary-card">
      {/* Main result */}
      <div className="main-result">
        <h3 className="result-label">Your True Hourly Rate</h3>
        <div className="result-value">
          <span className="currency">$</span>
          <span className="amount">{result.trueHourlyRate.toFixed(2)}</span>
          <span className="unit">/hour</span>
        </div>
        
        {/* Trend indicator */}
        {comparison?.previous && (
          <div className={`trend ${
            result.trueHourlyRate > comparison.previous ? 'positive' : 'negative'
          }`}>
            {result.trueHourlyRate > comparison.previous ? '↗' : '↘'}
            ${Math.abs(result.trueHourlyRate - comparison.previous).toFixed(2)}
            vs. previous calculation
          </div>
        )}
      </div>
      
      {/* Key metrics */}
      <div className="key-metrics">
        <div className="metric">
          <span className="metric-label">Annual Net</span>
          <span className="metric-value">
            ${result.netAnnualIncome.toLocaleString()}
          </span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Effective Tax Rate</span>
          <span className="metric-value">
            {(result.effectiveTaxRate * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="metric">
          <span className="metric-label">Total Deductions</span>
          <span className="metric-value">
            ${result.totalDeductions.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Industry comparison */}
      {comparison?.industry && (
        <div className="industry-comparison">
          <div className="comparison-bar">
            <div 
              className="your-position"
              style={{ left: `${(result.trueHourlyRate / comparison.industry) * 100}%` }}
            />
            <span className="industry-label">
              Industry Average: ${comparison.industry}/hr
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
```

## Integration with calc-core Package

### Calculator Engine Integration
```typescript
// Hook for integrating with calc-core
import { 
  ContractCalculationEngine,
  PaycheckCalculationEngine,
  TaxCalculator,
  LocationDataProvider
} from '@locumtruerate/calc-core';

export const useCalculatorEngine = () => {
  const [engine] = useState(() => new ContractCalculationEngine());
  const [taxCalc] = useState(() => new TaxCalculator());
  const [locationData] = useState(() => new LocationDataProvider());
  
  const calculateTrueRate = useCallback(async (inputs: CalculatorInputs) => {
    // Location adjustment
    const locationAdjustment = await locationData.getCostAdjustment(
      inputs.location?.zipCode || ''
    );
    
    // Base calculation
    const contract = {
      type: 'HOURLY' as const,
      rate: inputs.hourlyRate,
      hoursPerWeek: inputs.hoursPerWeek,
      weeksPerYear: inputs.weeksPerYear,
      location: inputs.location?.zipCode
    };
    
    const baseCalculation = engine.calculateContract(contract);
    
    // Tax calculation
    const taxResult = taxCalc.calculateTaxes({
      income: baseCalculation.grossAnnual,
      deductions: inputs.deductions,
      state: inputs.location?.state,
      selfEmployed: inputs.taxes?.selfEmploymentTax
    });
    
    // True rate calculation
    const netAnnual = baseCalculation.grossAnnual - taxResult.totalTaxes - 
      (inputs.deductions.malpracticeInsurance || 0) -
      (inputs.deductions.healthInsurance || 0) -
      (inputs.deductions.otherExpenses || 0);
      
    const totalHours = inputs.hoursPerWeek * inputs.weeksPerYear;
    const trueHourlyRate = netAnnual / totalHours;
    
    return {
      grossAnnualIncome: baseCalculation.grossAnnual,
      netAnnualIncome: netAnnual,
      trueHourlyRate,
      totalDeductions: taxResult.totalTaxes + 
        (inputs.deductions.malpracticeInsurance || 0) +
        (inputs.deductions.healthInsurance || 0) +
        (inputs.deductions.otherExpenses || 0),
      totalTaxes: taxResult.totalTaxes,
      effectiveTaxRate: taxResult.effectiveRate,
      locationAdjustment: locationAdjustment.multiplier,
      calculatedAt: new Date(),
      inputHash: generateInputHash(inputs)
    };
  }, [engine, taxCalc, locationData]);
  
  return { calculateTrueRate };
};
```

### Real-time Calculation Hook
```typescript
export const useRealTimeCalculation = (inputs: CalculatorInputs) => {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { calculateTrueRate } = useCalculatorEngine();
  
  // Debounced calculation
  useEffect(() => {
    if (!inputs.hourlyRate || !inputs.hoursPerWeek) {
      setResult(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const timeoutId = setTimeout(async () => {
      try {
        const calculationResult = await calculateTrueRate(inputs);
        setResult(calculationResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [inputs, calculateTrueRate]);
  
  return { result, loading, error };
};
```

## State Management Architecture

### Calculator State Structure
```typescript
interface CalculatorState {
  // Input state
  inputs: CalculatorInputs;
  inputsValid: boolean;
  inputErrors: Record<string, string>;
  
  // Calculation state
  result: CalculationResult | null;
  calculating: boolean;
  calculationError: string | null;
  
  // UI state
  expandedSections: string[];
  mode: 'basic' | 'advanced' | 'comparison';
  showHistory: boolean;
  
  // Comparison state
  comparisons: CalculationResult[];
  activeComparison: string | null;
  
  // History state
  savedCalculations: SavedCalculation[];
  favorites: string[];
}

// State management with useReducer
type CalculatorAction = 
  | { type: 'UPDATE_INPUT'; field: keyof CalculatorInputs; value: any }
  | { type: 'SET_RESULT'; result: CalculationResult }
  | { type: 'SET_CALCULATING'; calculating: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'TOGGLE_SECTION'; section: string }
  | { type: 'CHANGE_MODE'; mode: 'basic' | 'advanced' | 'comparison' }
  | { type: 'ADD_COMPARISON'; result: CalculationResult }
  | { type: 'SAVE_CALCULATION'; calculation: SavedCalculation };

const calculatorReducer = (
  state: CalculatorState,
  action: CalculatorAction
): CalculatorState => {
  switch (action.type) {
    case 'UPDATE_INPUT':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          [action.field]: action.value
        },
        // Clear errors for updated field
        inputErrors: {
          ...state.inputErrors,
          [action.field]: undefined
        }
      };
      
    case 'SET_RESULT':
      return {
        ...state,
        result: action.result,
        calculating: false,
        calculationError: null
      };
      
    case 'TOGGLE_SECTION':
      return {
        ...state,
        expandedSections: state.expandedSections.includes(action.section)
          ? state.expandedSections.filter(s => s !== action.section)
          : [...state.expandedSections, action.section]
      };
      
    default:
      return state;
  }
};
```

## Responsive Design Strategy

### Mobile-First Layout Implementation
```typescript
const CalculatorLayout: React.FC<CalculatorLayoutProps> = ({ children }) => {
  const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) setViewport('desktop');
      else if (width >= 768) setViewport('tablet');
      else setViewport('mobile');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const layoutClasses = {
    mobile: 'calculator-layout-mobile',
    tablet: 'calculator-layout-tablet',
    desktop: 'calculator-layout-desktop'
  };
  
  return (
    <div className={`calculator-layout ${layoutClasses[viewport]}`}>
      {viewport === 'mobile' ? (
        <>
          <div className="results-section">{children.results}</div>
          <div className="inputs-section">{children.inputs}</div>
          <div className="actions-section">{children.actions}</div>
        </>
      ) : (
        <div className="grid-layout">
          <div className="inputs-column">{children.inputs}</div>
          <div className="results-column">
            {children.results}
            {children.actions}
          </div>
        </div>
      )}
    </div>
  );
};
```

## Performance Optimization Strategy

### Lazy Loading Implementation
```typescript
// Lazy load advanced features
const AdvancedInputs = lazy(() => import('./AdvancedInputs'));
const ComparisonChart = lazy(() => import('./ComparisonChart'));
const CalculatorHistory = lazy(() => import('./CalculatorHistory'));

// Component splitting for better performance
const Calculator = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <div>
      <BasicCalculator />
      
      {showAdvanced && (
        <Suspense fallback={<AdvancedInputsSkeleton />}>
          <AdvancedInputs />
        </Suspense>
      )}
      
      {showHistory && (
        <Suspense fallback={<HistorySkeleton />}>
          <CalculatorHistory />
        </Suspense>
      )}
    </div>
  );
};
```

### Memoization Strategy
```typescript
// Memoize expensive components
const MemoizedResultsDisplay = memo(ResultsDisplay, (prevProps, nextProps) => {
  return (
    prevProps.result?.inputHash === nextProps.result?.inputHash &&
    prevProps.loading === nextProps.loading
  );
});

// Memoize calculation functions
const useCalculatorMemo = () => {
  return useMemo(() => ({
    calculateTrueRate: memoize(calculateTrueRate, {
      cacheKey: (inputs) => generateInputHash(inputs),
      maxSize: 50
    })
  }), []);
};
```

## Testing Strategy

### Component Testing
```typescript
// Calculator component tests
describe('TrueRateCalculator', () => {
  it('calculates true rate correctly', async () => {
    const inputs = {
      hourlyRate: 100,
      hoursPerWeek: 40,
      weeksPerYear: 50
    };
    
    render(<TrueRateCalculator initialData={inputs} />);
    
    await waitFor(() => {
      expect(screen.getByText(/true hourly rate/i)).toBeInTheDocument();
    });
    
    // Should show calculated result
    expect(screen.getByText(/\$\d+\.\d{2}\/hour/)).toBeInTheDocument();
  });
  
  it('updates results in real-time', async () => {
    render(<TrueRateCalculator />);
    
    const rateInput = screen.getByLabelText(/hourly rate/i);
    fireEvent.change(rateInput, { target: { value: '150' } });
    
    await waitFor(() => {
      expect(screen.getByText(/\$150/)).toBeInTheDocument();
    }, { timeout: 500 });
  });
});
```

## Implementation Timeline

### Week 3 Implementation Plan
```
Day 1-2: Core Infrastructure
- Set up component structure
- Implement CalculatorLayout
- Create basic input components
- Integrate with calc-core

Day 3-4: Main Calculator Features
- Build HourlyRateInput with suggestions
- Implement ScheduleInputs
- Create SummaryCard results display
- Add real-time calculation

Day 5-7: Polish & Testing
- Mobile responsiveness testing
- Accessibility compliance
- Performance optimization
- Cross-platform validation
```

## Success Metrics

### Technical Metrics
- [ ] Page load time <2 seconds
- [ ] Calculation response time <100ms
- [ ] Bundle size <150KB
- [ ] Accessibility score 100%

### User Experience Metrics
- [ ] Task completion rate >95%
- [ ] Error rate <2%
- [ ] Mobile usability score >90
- [ ] User satisfaction >4.5/5

## Conclusion

This architecture provides:
1. **Seamless calc-core Integration**: Direct use of existing calculation engines
2. **Mobile-First Design**: Progressive enhancement from mobile to desktop
3. **Real-time Experience**: Immediate feedback on input changes
4. **Cross-Platform Ready**: Shared components and logic
5. **Performance Optimized**: Lazy loading and memoization strategies

Ready for implementation in Week 3 with clear component boundaries and integration points.