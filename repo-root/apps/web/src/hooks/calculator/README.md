# Calculator State Management Hooks

This directory contains React hooks for managing calculator state, persistence, and comparisons in the LocumTrueRate calculators.

## Available Hooks

### 1. `useCalculatorState`

Manages the current calculation results and history using IndexedDB or localStorage.

```tsx
import { useCalculatorState } from '@/hooks/calculator'

function MyCalculator() {
  const {
    currentContractResult,
    currentPaycheckResult,
    history,
    savedCalculations,
    saveContractCalculation,
    savePaycheckCalculation,
    loadCalculation,
    deleteCalculation,
    toggleFavorite,
    searchCalculations,
    getAnalytics
  } = useCalculatorState({
    storage: 'indexedDB', // or 'localStorage'
    autoSave: true,
    maxHistoryItems: 20
  })

  // Save a contract calculation
  const handleSave = async () => {
    await saveContractCalculation(contractInput, contractResult, {
      name: 'Dallas Emergency Medicine Contract',
      tags: ['emergency', 'texas', 'high-pay'],
      isFavorite: true
    })
  }
}
```

### 2. `useCalculatorPersistence`

Handles database persistence, exports, and sharing via tRPC.

```tsx
import { useCalculatorPersistence } from '@/hooks/calculator'

function MyCalculator() {
  const {
    isSaving,
    isExporting,
    userCalculations,
    saveToDatabase,
    exportCalculation,
    exportMultiple,
    shareCalculation,
    importCalculations
  } = useCalculatorPersistence({
    onSaveSuccess: (calc) => console.log('Saved!', calc),
    onExportSuccess: (format) => console.log('Exported as', format)
  })

  // Export to PDF
  const handleExport = async () => {
    await exportCalculation(calculation, 'pdf', {
      includeCharts: true,
      fileName: 'my-calculation.pdf'
    })
  }

  // Share calculation
  const handleShare = async () => {
    const result = await shareCalculation(calculationId, {
      expiresInDays: 30,
      isPublic: false
    })
    console.log('Share link:', result.shareableLink)
  }
}
```

### 3. `useCalculatorComparison`

Manages multiple contract comparisons with the ComparisonEngine.

```tsx
import { useCalculatorComparison } from '@/hooks/calculator'

function ContractComparison() {
  const {
    comparisons,
    comparisonResult,
    comparisonState,
    addToComparison,
    removeFromComparison,
    runComparison,
    rankByCriteria,
    getMetrics,
    calculateBreakEven
  } = useCalculatorComparison({
    maxComparisons: 4,
    autoCalculate: true
  })

  // Add contracts to compare
  const handleAddContract = () => {
    addToComparison(contractInput, {
      name: 'Contract A',
      result: contractResult // optional, will auto-calculate if not provided
    })
  }

  // Run comparison
  const handleCompare = async () => {
    if (comparisonState.canCompare) {
      await runComparison()
      const metrics = getMetrics()
      console.log('Best contract:', metrics.bestContracts.overall)
    }
  }

  // Rank by different criteria
  const rankings = rankByCriteria('netPay') // or 'hourlyRate', 'benefits', 'overall', 'location'
}
```

## Integration with Calculator Components

### Example: Contract Calculator with State Management

```tsx
import { ContractCalculator } from '@/components/calculator'
import { useCalculatorState, useCalculatorPersistence } from '@/hooks/calculator'

export function EnhancedContractCalculator() {
  const calculatorState = useCalculatorState()
  const persistence = useCalculatorPersistence()

  const handleCalculationComplete = async (input, result) => {
    // Save to local history
    const saved = await calculatorState.saveContractCalculation(input, result, {
      name: `${input.location.city} - $${input.hourlyRate}/hr`,
      tags: [input.contractType, input.location.state]
    })

    // Optionally save to database
    if (user?.id) {
      await persistence.saveToDatabase(saved)
    }
  }

  return (
    <div>
      <ContractCalculator 
        onCalculate={handleCalculationComplete}
        initialValues={calculatorState.currentContractResult?.input}
      />
      
      <CalculationHistory 
        items={calculatorState.history}
        onLoad={calculatorState.loadCalculation}
        onDelete={calculatorState.deleteCalculation}
        onToggleFavorite={calculatorState.toggleFavorite}
      />
    </div>
  )
}
```

## Database Schema

The hooks work with the following Prisma schema:

```prisma
model SavedCalculation {
  id              String   @id @default(cuid())
  userId          String
  type            String   // 'contract', 'paycheck', 'comparison'
  input           Json     // The input parameters
  result          Json     // The calculation results
  name            String?  // User-provided name
  tags            String[] @default([])
  isFavorite      Boolean  @default(false)
  isPublic        Boolean  @default(false)
  shareableLink   String?  @unique
  expiresAt       DateTime?
  metadata        Json?    // Any additional data
  timestamp       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## API Routes

The persistence hook uses these tRPC routes:

- `calculations.save` - Save a new calculation
- `calculations.update` - Update an existing calculation
- `calculations.delete` - Delete a calculation
- `calculations.getUserCalculations` - Get user's saved calculations
- `calculations.getCalculation` - Get a single calculation
- `calculations.share` - Create a shareable link
- `calculations.getStats` - Get user's calculation statistics

## Features

- **Local Storage**: Uses IndexedDB/localStorage for offline access
- **Cloud Sync**: Syncs with PostgreSQL database when online
- **Export Formats**: PDF, Excel, CSV, JSON
- **Sharing**: Generate shareable links with expiration
- **Comparison**: Compare up to 4 contracts side-by-side
- **Analytics**: Track calculation usage and patterns
- **Import/Export**: Backup and restore calculations
- **Search**: Full-text search across saved calculations
- **Tags**: Organize calculations with custom tags
- **Favorites**: Mark important calculations

## Migration Guide

To run the database migration for the SavedCalculation model:

```bash
cd packages/database
pnpm prisma migrate dev --name add-saved-calculations
```