# Calculator Integration Tests

This directory contains comprehensive integration tests for the calculator workflow, covering end-to-end functionality, state management, UI interactions, API integrations, and lead capture.

## Test Files Overview

### 1. `calculator-end-to-end.test.tsx`
**Complete end-to-end flows testing**

#### Test Coverage:
- **Contract Calculator Flow**: Form submission, calculation results, state persistence
- **Paycheck Calculator Flow**: Different pay frequencies, tax calculations, deductions
- **Cross-Calculator Integration**: Switching between calculators with data persistence
- **Mobile Responsiveness**: Adaptive layouts, touch interactions, mobile keyboards
- **Accessibility**: Screen reader support, keyboard navigation, focus management
- **Performance**: Large datasets, render optimization, concurrent calculations

#### Key Scenarios:
- ✅ Contract calculation with expenses and deductions
- ✅ Paycheck calculation with various filing statuses
- ✅ Comparison mode between multiple contracts
- ✅ Error handling and validation
- ✅ Export functionality integration
- ✅ Mobile-first responsive behavior
- ✅ Accessibility compliance (WCAG 2.1 AA)

### 2. `calculator-state-integration.test.tsx`
**State management and data persistence testing**

#### Test Coverage:
- **useCalculatorState Hook**: History management, favorites, search functionality
- **useCalculatorPersistence Hook**: Database operations, export/import, sharing
- **useCalculatorComparison Hook**: Contract comparison, ranking, break-even analysis
- **Cross-Hook Integration**: State synchronization between different hooks
- **Data Persistence**: localStorage and IndexedDB persistence across page refreshes

#### Key Scenarios:
- ✅ Loading and saving calculation history
- ✅ Managing favorites and tags
- ✅ Search and filter functionality
- ✅ Export calculations in multiple formats
- ✅ Share calculations with expiration
- ✅ Import calculations from files
- ✅ Contract comparison and ranking
- ✅ State persistence across browser sessions

### 3. `calculator-ui-integration.test.tsx`
**UI interactions and responsive design testing**

#### Test Coverage:
- **Form Validation**: Real-time validation, interdependent fields, complex scenarios
- **Real-time Updates**: Live calculation updates, progress indicators, debouncing
- **Export Functionality**: Multiple formats, customization options, error handling
- **Mobile Responsiveness**: Layout adaptation, touch interactions, mobile keyboards
- **Accessibility**: Focus management, screen reader support, keyboard navigation
- **Complex UI State**: Multiple simultaneous interactions, form state persistence

#### Key Scenarios:
- ✅ Real-time form validation with error display
- ✅ Interdependent field validation (contract type affects rate fields)
- ✅ Live calculation updates with debouncing
- ✅ Export customization and progress tracking
- ✅ Mobile-optimized input fields and layouts
- ✅ Comprehensive accessibility support
- ✅ Complex form state management

### 4. `calculator-api-integration.test.tsx`
**API interactions and database operations testing**

#### Test Coverage:
- **Saving Calculations**: Database persistence, validation, error handling
- **Loading Calculations**: User-specific data, filtering, pagination
- **Updating/Deleting**: CRUD operations with proper authorization
- **Sharing Functionality**: Link generation, permissions, expiration
- **User Management**: Session handling, authorization, quotas
- **Performance**: Concurrent requests, retry logic, large payloads

#### Key Scenarios:
- ✅ Save calculations with metadata and validation
- ✅ Load user calculations with filtering
- ✅ Update calculation properties and tags
- ✅ Delete calculations with authorization checks
- ✅ Share calculations with generated links
- ✅ Handle API errors and network issues
- ✅ User isolation and security
- ✅ Performance optimization

### 5. `calculator-lead-capture-integration.test.tsx`
**Lead capture and conversion tracking testing**

#### Test Coverage:
- **Calculator-to-Lead Flow**: Trigger conditions, modal display, form pre-filling
- **Lead Form**: Validation, metadata inclusion, specialty-specific content
- **Zapier Integration**: Webhook delivery, authentication, retry logic
- **Conversion Tracking**: Funnel metrics, drop-off analysis, scoring
- **Multi-Calculator**: Cross-calculator lead capture, comparison users
- **Error Handling**: Submission failures, duplicates, validation

#### Key Scenarios:
- ✅ Trigger lead capture after high-value calculations
- ✅ Pre-fill forms with calculation metadata
- ✅ Submit leads with complete tracking data
- ✅ Send authenticated webhooks to Zapier
- ✅ Track conversion funnels and drop-offs
- ✅ Score leads based on calculation patterns
- ✅ Handle multi-calculator user journeys
- ✅ Graceful error handling and recovery

## Test Architecture

### Mocking Strategy
- **calc-core**: Mock calculation engines for predictable results
- **tRPC**: Mock API calls with realistic responses and error scenarios
- **External APIs**: Mock Zapier webhooks, geolocation, clipboard
- **Authentication**: Mock Clerk user sessions and permissions
- **Browser APIs**: Mock localStorage, IndexedDB, matchMedia

### Test Utilities
- **Custom Render**: Includes all necessary providers (React Query, Theme, Analytics)
- **Mock Creators**: Generate realistic calculation results and user data
- **Async Helpers**: Wait for loading states, animations, and API calls
- **Form Utilities**: Fill and submit forms with validation testing
- **Accessibility Helpers**: Test keyboard navigation and screen reader support

### Data Flow Testing
1. **User Input** → Form validation → Real-time updates
2. **Calculation** → calc-core engine → Results display
3. **State Management** → Local storage → Database persistence
4. **Lead Capture** → Form submission → Webhook delivery
5. **Analytics** → Event tracking → Conversion metrics

## Mobile-First Testing

### Responsive Breakpoints
- **Mobile**: 320px - 767px (primary focus)
- **Tablet**: 768px - 1023px
- **Desktop**: 1024px+ (enhancement)

### Mobile-Specific Tests
- ✅ Touch-friendly input fields and buttons
- ✅ Collapsible sections for small screens
- ✅ Mobile keyboard optimization (inputmode, pattern)
- ✅ Native share API integration
- ✅ Swipe gestures for result cards
- ✅ Bottom sheet modals for exports

## Accessibility Testing

### WCAG 2.1 AA Compliance
- ✅ Keyboard navigation and focus management
- ✅ Screen reader compatibility and announcements
- ✅ Color contrast and high contrast mode
- ✅ Reduced motion preferences
- ✅ Form labeling and error association
- ✅ Live regions for dynamic content

### Assistive Technology Support
- ✅ NVDA/JAWS screen reader testing
- ✅ Voice control navigation
- ✅ Switch navigation support
- ✅ Zoom and magnification compatibility

## Performance Testing

### Optimization Verification
- ✅ Component re-render minimization
- ✅ Large dataset handling (1000+ calculations)
- ✅ Debounced input handling
- ✅ Lazy loading of heavy components
- ✅ Memory leak prevention
- ✅ Bundle size optimization

### Load Testing Scenarios
- ✅ Concurrent calculations
- ✅ Large export operations
- ✅ Rapid form input changes
- ✅ Multiple browser tabs
- ✅ Network connection changes

## Error Scenarios

### Comprehensive Error Handling
- ✅ Network failures and timeouts
- ✅ Invalid calculation parameters
- ✅ Authorization and permission errors
- ✅ Quota limits and rate limiting
- ✅ Validation failures
- ✅ Browser compatibility issues

### Recovery Mechanisms
- ✅ Automatic retry with exponential backoff
- ✅ Graceful degradation for offline use
- ✅ User-friendly error messages
- ✅ Fallback calculations and data sources

## Running the Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Setup test environment
cp .env.example .env.test
```

### Individual Test Suites
```bash
# End-to-end flow tests
pnpm test calculator-end-to-end.test.tsx

# State management tests
pnpm test calculator-state-integration.test.tsx

# UI interaction tests
pnpm test calculator-ui-integration.test.tsx

# API integration tests
pnpm test calculator-api-integration.test.tsx

# Lead capture tests
pnpm test calculator-lead-capture-integration.test.tsx
```

### Full Integration Test Suite
```bash
# Run all calculator integration tests
pnpm test __tests__/integration/calculator/

# Run with coverage
pnpm test:coverage __tests__/integration/calculator/

# Run in watch mode
pnpm test:watch __tests__/integration/calculator/
```

### Cross-Platform Testing
```bash
# Mobile simulation
pnpm test:mobile calculator-ui-integration.test.tsx

# Accessibility testing
pnpm test:a11y calculator-end-to-end.test.tsx

# Performance testing
pnpm test:perf calculator-state-integration.test.tsx
```

## Coverage Goals

### Target Coverage Metrics
- **Line Coverage**: ≥90%
- **Branch Coverage**: ≥85%
- **Function Coverage**: ≥90%
- **Statement Coverage**: ≥90%

### Critical Path Coverage
- ✅ 100% coverage of calculator workflows
- ✅ 100% coverage of lead capture flows
- ✅ 100% coverage of API error scenarios
- ✅ 100% coverage of mobile interactions
- ✅ 100% coverage of accessibility features

## Continuous Integration

### Test Pipeline
1. **Lint and Type Check**: ESLint, TypeScript, Prettier
2. **Unit Tests**: Component and hook testing
3. **Integration Tests**: Full workflow testing
4. **E2E Tests**: Browser automation testing
5. **Accessibility Tests**: axe-core validation
6. **Performance Tests**: Lighthouse CI

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No accessibility violations
- Performance budgets respected
- Mobile responsiveness verified

## Maintenance

### Regular Updates
- **Monthly**: Update test data and scenarios
- **Quarterly**: Review and update mocks
- **Semi-annually**: Comprehensive test review
- **Annually**: Architecture and strategy review

### Monitoring
- Test execution time tracking
- Flaky test identification
- Coverage trend analysis
- Performance regression detection