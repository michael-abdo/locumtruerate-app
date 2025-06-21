import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockCalculationResult, waitForLoadingToFinish } from '@/__tests__/utils/test-utils'
import { ContractCalculator } from '@/components/calculator/contract-calculator'
import { PaycheckCalculator } from '@/components/calculator/paycheck-calculator'
import { 
  ContractCalculationEngine, 
  PaycheckCalculationEngine,
  ContractType,
  FilingStatus,
  type ContractInput,
  type PaycheckInput 
} from '@locumtruerate/calc-core'

// Mock calc-core calculations
jest.mock('@locumtruerate/calc-core', () => ({
  ContractCalculationEngine: { calculate: jest.fn() },
  PaycheckCalculationEngine: { calculate: jest.fn() },
  ContractType: {
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
    MONTHLY: 'MONTHLY'
  },
  TaxFilingStatus: {
    SINGLE: 'SINGLE',
    MARRIED_FILING_JOINTLY: 'MARRIED_FILING_JOINTLY',
    MARRIED_FILING_SEPARATELY: 'MARRIED_FILING_SEPARATELY',
    HEAD_OF_HOUSEHOLD: 'HEAD_OF_HOUSEHOLD'
  }
}))

// Mock analytics
const mockTrackCalculatorUsage = jest.fn()
const mockTrackCalculatorError = jest.fn()
const mockTrackCalculatorExport = jest.fn()
jest.mock('@/hooks/use-analytics', () => ({
  useCalculatorAnalytics: () => ({
    trackCalculatorUsage: mockTrackCalculatorUsage,
    trackCalculatorError: mockTrackCalculatorError,
    trackCalculatorExport: mockTrackCalculatorExport
  })
}))

// Mock state management hooks
const mockSaveContractCalculation = jest.fn()
const mockSavePaycheckCalculation = jest.fn()
const mockLoadCalculation = jest.fn()
jest.mock('@/hooks/calculator/useCalculatorState', () => ({
  useCalculatorState: () => ({
    currentContractResult: null,
    currentPaycheckResult: null,
    history: [],
    savedCalculations: [],
    isLoadingHistory: false,
    isSavingCalculation: false,
    error: null,
    saveContractCalculation: mockSaveContractCalculation,
    savePaycheckCalculation: mockSavePaycheckCalculation,
    loadCalculation: mockLoadCalculation,
    refreshHistory: jest.fn(),
    refreshSavedCalculations: jest.fn()
  })
}))

// Mock persistence hooks
const mockSaveToDatabase = jest.fn()
const mockExportCalculation = jest.fn()
jest.mock('@/hooks/calculator/useCalculatorPersistence', () => ({
  useCalculatorPersistence: () => ({
    isSaving: false,
    isExporting: false,
    error: null,
    userCalculations: [],
    saveToDatabase: mockSaveToDatabase,
    exportCalculation: mockExportCalculation,
    refetchCalculations: jest.fn()
  })
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/calculator',
    query: {}
  })
}))

describe('Calculator End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock return values
    ;(calculateContract as jest.Mock).mockResolvedValue(createMockCalculationResult({
      grossPay: 312000,
      netPay: 234000,
      taxes: 78000,
      hourlyRate: 150,
      weeklyHours: 40
    }))
    
    ;(calculatePaycheck as jest.Mock).mockResolvedValue(createMockCalculationResult({
      grossPay: 6000,
      netPay: 4500,
      taxes: 1500,
      hourlyRate: 150,
      weeklyHours: 40
    }))
  })

  describe('Contract Calculator End-to-End Flow', () => {
    it('completes full contract calculation workflow', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Step 1: Fill out contract form
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/hours per week/i), '40')
      await user.type(screen.getByLabelText(/contract duration/i), '12')
      await user.type(screen.getByLabelText(/location/i), 'Dallas, TX')
      
      // Add expenses
      await user.click(screen.getByRole('button', { name: /add expenses/i }))
      await user.type(screen.getByLabelText(/travel expenses/i), '5000')
      await user.type(screen.getByLabelText(/housing allowance/i), '3000')

      // Step 2: Submit calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Step 3: Verify calculation was called correctly
      await waitFor(() => {
        expect(calculateContract).toHaveBeenCalledWith({
          hourlyRate: 150,
          hoursPerWeek: 40,
          duration: 12,
          location: 'Dallas, TX',
          contractType: ContractType.HOURLY,
          expenses: {
            travel: 5000,
            housing: 3000,
            malpractice: 0
          }
        })
      })

      // Step 4: Verify results are displayed
      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
        expect(screen.getByText(/\$234,000/)).toBeInTheDocument()
        expect(screen.getByText(/\$78,000/)).toBeInTheDocument()
      })

      // Step 5: Verify analytics tracking
      expect(mockTrackCalculatorUsage).toHaveBeenCalledWith({
        type: 'contract',
        duration: expect.any(Number),
        inputData: expect.any(Object)
      })

      // Step 6: Save calculation
      await user.click(screen.getByRole('button', { name: /save calculation/i }))
      
      const saveDialog = screen.getByRole('dialog')
      await user.type(within(saveDialog).getByLabelText(/calculation name/i), 'Dallas Contract')
      await user.click(within(saveDialog).getByRole('button', { name: /save/i }))

      expect(mockSaveContractCalculation).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          name: 'Dallas Contract'
        })
      )
    })

    it('handles contract calculation with comparison mode', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Enable comparison mode
      await user.click(screen.getByRole('button', { name: /compare contracts/i }))

      // Fill first contract
      const contract1Section = screen.getByTestId('contract-1')
      await user.type(within(contract1Section).getByLabelText(/hourly rate/i), '150')
      await user.type(within(contract1Section).getByLabelText(/location/i), 'Dallas, TX')

      // Fill second contract
      const contract2Section = screen.getByTestId('contract-2')
      await user.type(within(contract2Section).getByLabelText(/hourly rate/i), '175')
      await user.type(within(contract2Section).getByLabelText(/location/i), 'NYC, NY')

      // Calculate both
      await user.click(screen.getByRole('button', { name: /calculate all/i }))

      await waitFor(() => {
        expect(calculateContract).toHaveBeenCalledTimes(2)
      })

      // Run comparison
      await user.click(screen.getByRole('button', { name: /compare results/i }))

      // Verify comparison results are shown
      await waitFor(() => {
        expect(screen.getByText(/comparison results/i)).toBeInTheDocument()
        expect(screen.getByText(/recommended contract/i)).toBeInTheDocument()
      })
    })

    it('handles contract calculation errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock calculation to throw error
      ;(calculateContract as jest.Mock).mockRejectedValue(
        new Error('Invalid tax calculation parameters')
      )

      render(<ContractCalculator />)

      await user.type(screen.getByLabelText(/hourly rate/i), '-50')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/calculation error/i)).toBeInTheDocument()
        expect(screen.getByText(/invalid tax calculation parameters/i)).toBeInTheDocument()
      })

      expect(mockTrackCalculatorError).toHaveBeenCalledWith({
        type: 'contract',
        error: 'Invalid tax calculation parameters',
        inputData: expect.any(Object)
      })
    })
  })

  describe('Paycheck Calculator End-to-End Flow', () => {
    it('completes full paycheck calculation workflow', async () => {
      const user = userEvent.setup()
      render(<PaycheckCalculator />)

      // Step 1: Fill out paycheck form
      await user.type(screen.getByLabelText(/annual salary/i), '300000')
      await user.selectOptions(screen.getByLabelText(/pay frequency/i), 'bi-weekly')
      await user.selectOptions(screen.getByLabelText(/filing status/i), 'SINGLE')
      await user.type(screen.getByLabelText(/state/i), 'Texas')
      await user.type(screen.getByLabelText(/allowances/i), '2')

      // Add pre-tax deductions
      await user.click(screen.getByRole('button', { name: /add deductions/i }))
      await user.type(screen.getByLabelText(/401k contribution/i), '1000')
      await user.type(screen.getByLabelText(/health insurance/i), '500')

      // Step 2: Submit calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Step 3: Verify calculation was called correctly
      await waitFor(() => {
        expect(calculatePaycheck).toHaveBeenCalledWith({
          annualSalary: 300000,
          payFrequency: 'bi-weekly',
          filingStatus: TaxFilingStatus.SINGLE,
          state: 'Texas',
          allowances: 2,
          preDeductions: {
            retirement401k: 1000,
            healthInsurance: 500
          }
        })
      })

      // Step 4: Verify results are displayed
      await waitFor(() => {
        expect(screen.getByText(/\$6,000/)).toBeInTheDocument() // Gross pay
        expect(screen.getByText(/\$4,500/)).toBeInTheDocument() // Net pay
        expect(screen.getByText(/\$1,500/)).toBeInTheDocument() // Taxes
      })

      // Step 5: View tax breakdown
      await user.click(screen.getByRole('button', { name: /tax breakdown/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/federal tax/i)).toBeInTheDocument()
        expect(screen.getByText(/social security/i)).toBeInTheDocument()
        expect(screen.getByText(/medicare/i)).toBeInTheDocument()
      })

      // Step 6: Export calculation
      await user.click(screen.getByRole('button', { name: /export/i }))
      await user.click(screen.getByRole('menuitem', { name: /pdf/i }))

      expect(mockExportCalculation).toHaveBeenCalledWith(
        expect.any(Object),
        'pdf',
        expect.any(Object)
      )
    })

    it('handles different pay frequencies correctly', async () => {
      const user = userEvent.setup()
      render(<PaycheckCalculator />)

      // Test weekly pay frequency
      await user.type(screen.getByLabelText(/annual salary/i), '156000')
      await user.selectOptions(screen.getByLabelText(/pay frequency/i), 'weekly')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(calculatePaycheck).toHaveBeenCalledWith(
          expect.objectContaining({
            annualSalary: 156000,
            payFrequency: 'weekly'
          })
        )
      })

      // Test monthly pay frequency
      await user.selectOptions(screen.getByLabelText(/pay frequency/i), 'monthly')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(calculatePaycheck).toHaveBeenLastCalledWith(
          expect.objectContaining({
            payFrequency: 'monthly'
          })
        )
      })
    })
  })

  describe('Cross-Calculator Integration', () => {
    it('allows switching between calculator types with data persistence', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Fill out contract form
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/location/i), 'Dallas, TX')

      // Switch to paycheck calculator
      await user.click(screen.getByRole('tab', { name: /paycheck calculator/i }))

      // Verify we're now in paycheck calculator
      expect(screen.getByLabelText(/annual salary/i)).toBeInTheDocument()

      // Fill paycheck form
      await user.type(screen.getByLabelText(/annual salary/i), '300000')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Switch back to contract calculator
      await user.click(screen.getByRole('tab', { name: /contract calculator/i }))

      // Verify contract data is still there
      expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dallas, TX')).toBeInTheDocument()
    })

    it('handles calculator history integration', async () => {
      const user = userEvent.setup()
      
      // Mock history with previous calculations
      const mockHistory = [
        {
          id: '1',
          type: 'contract' as const,
          name: 'Previous Contract',
          result: createMockCalculationResult(),
          timestamp: new Date().toISOString()
        }
      ]

      // Mock useCalculatorState to return history
      jest.mocked(mockLoadCalculation).mockResolvedValue(mockHistory[0])

      render(<ContractCalculator />)

      // Open history panel
      await user.click(screen.getByRole('button', { name: /calculation history/i }))

      // Load previous calculation
      const historyItem = screen.getByText('Previous Contract')
      await user.click(historyItem)

      expect(mockLoadCalculation).toHaveBeenCalledWith('1')

      // Verify calculation is loaded
      await waitFor(() => {
        expect(screen.getByText(/calculation loaded/i)).toBeInTheDocument()
      })
    })
  })

  describe('Mobile Responsiveness Integration', () => {
    beforeEach(() => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      })
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667
      })
    })

    it('adapts calculator layout for mobile screens', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Verify mobile-specific layout elements
      expect(screen.getByTestId('mobile-calculator-container')).toBeInTheDocument()

      // Test collapsible sections on mobile
      const advancedSection = screen.getByRole('button', { name: /advanced options/i })
      await user.click(advancedSection)

      expect(screen.getByTestId('advanced-options-panel')).toBeVisible()
    })

    it('handles mobile form input validation', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test mobile keyboard optimization
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      expect(hourlyRateInput).toHaveAttribute('inputmode', 'decimal')

      // Test mobile-friendly validation messages
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      const errorMessage = await screen.findByText(/hourly rate is required/i)
      expect(errorMessage).toHaveClass('mobile-error-message')
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains accessibility throughout calculation workflow', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test keyboard navigation
      await user.tab()
      expect(screen.getByLabelText(/hourly rate/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/hours per week/i)).toHaveFocus()

      // Test screen reader announcements
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        const resultsRegion = screen.getByRole('region', { name: /calculation results/i })
        expect(resultsRegion).toHaveAttribute('aria-live', 'polite')
      })

      // Test error announcements
      ;(calculateContract as jest.Mock).mockRejectedValue(new Error('Test error'))
      
      await user.clear(screen.getByLabelText(/hourly rate/i))
      await user.type(screen.getByLabelText(/hourly rate/i), '-50')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        const errorRegion = screen.getByRole('alert')
        expect(errorRegion).toBeInTheDocument()
        expect(errorRegion).toHaveTextContent(/test error/i)
      })
    })

    it('provides proper labeling for complex form inputs', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test fieldset labeling
      const locationFieldset = screen.getByRole('group', { name: /location information/i })
      expect(locationFieldset).toBeInTheDocument()

      // Test described by relationships
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      expect(hourlyRateInput).toHaveAttribute('aria-describedby')
      
      const descriptionId = hourlyRateInput.getAttribute('aria-describedby')
      const description = screen.getByTestId(descriptionId!)
      expect(description).toHaveTextContent(/enter your hourly rate/i)
    })
  })

  describe('Performance Integration', () => {
    it('handles large calculation datasets efficiently', async () => {
      const user = userEvent.setup()
      
      // Mock large calculation result
      const largeResult = createMockCalculationResult({
        breakdown: {
          federal: 45000,
          state: 15000,
          social: 12000,
          medicare: 6000,
          detailed: Array.from({ length: 1000 }, (_, i) => ({
            month: i + 1,
            gross: 26000,
            net: 19500,
            taxes: 6500
          }))
        }
      })
      
      ;(calculateContract as jest.Mock).mockResolvedValue(largeResult)

      render(<ContractCalculator />)

      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      
      const startTime = performance.now()
      await user.click(screen.getByRole('button', { name: /calculate/i }))
      
      await waitFor(() => {
        expect(screen.getByText(/\$45,000/)).toBeInTheDocument()
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Ensure rendering completes within reasonable time
      expect(renderTime).toBeLessThan(2000) // 2 seconds max
    })

    it('optimizes re-renders during form input', async () => {
      const user = userEvent.setup()
      
      let renderCount = 0
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderCount++
        return <>{children}</>
      }

      render(<ContractCalculator />, { wrapper: TestWrapper })

      const initialRenderCount = renderCount

      // Type in multiple fields rapidly
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/hours per week/i), '40')
      await user.type(screen.getByLabelText(/contract duration/i), '12')

      // Should not cause excessive re-renders
      expect(renderCount - initialRenderCount).toBeLessThan(10)
    })
  })
})