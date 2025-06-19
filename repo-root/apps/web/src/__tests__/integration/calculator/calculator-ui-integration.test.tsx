import { screen, waitFor, within, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockCalculationResult } from '@/__tests__/utils/test-utils'
import { ContractCalculator } from '@/components/calculator/contract-calculator'
import { PaycheckCalculator } from '@/components/calculator/paycheck-calculator'
import { CalculatorLayout } from '@/components/calculator/calculator-layout'
import { ExportButton } from '@/components/calculator/export-button'
import { CalculationHistory } from '@/components/calculator/calculation-history'

// Mock calc-core
const mockCalculateContract = jest.fn()
const mockCalculatePaycheck = jest.fn()
const mockExportToPDF = jest.fn()
const mockExportToExcel = jest.fn()

jest.mock('@locumtruerate/calc-core', () => ({
  calculateContract: mockCalculateContract,
  calculatePaycheck: mockCalculatePaycheck,
  ExportManager: jest.fn(() => ({
    exportToPDF: mockExportToPDF,
    exportToExcel: mockExportToExcel,
    exportToCSV: jest.fn(),
    exportToJSON: jest.fn()
  })),
  ContractType: {
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
    MONTHLY: 'MONTHLY'
  },
  TaxFilingStatus: {
    SINGLE: 'SINGLE',
    MARRIED_FILING_JOINTLY: 'MARRIED_FILING_JOINTLY'
  }
}))

// Mock analytics
const mockTrackValidationError = jest.fn()
const mockTrackExportUsage = jest.fn()
const mockTrackMobileUsage = jest.fn()

jest.mock('@/hooks/use-analytics', () => ({
  useCalculatorAnalytics: () => ({
    trackCalculatorUsage: jest.fn(),
    trackCalculatorError: jest.fn(),
    trackCalculatorExport: mockTrackExportUsage,
    trackValidationError: mockTrackValidationError,
    trackMobileUsage: mockTrackMobileUsage
  })
}))

// Mock lead capture
const mockCreateLead = jest.fn()
jest.mock('@/trpc/react', () => ({
  api: {
    leads: {
      create: {
        useMutation: () => ({
          mutateAsync: mockCreateLead,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

// Mock accessibility hooks
const mockAnnounceToScreenReader = jest.fn()
jest.mock('@/hooks/use-accessibility', () => ({
  useAccessibility: () => ({
    announceToScreenReader: mockAnnounceToScreenReader,
    isReducedMotion: false,
    isHighContrast: false
  })
}))

// Responsive design mocks
const mockMatchMedia = (query: string) => ({
  matches: query.includes('max-width: 768px'), // Mock mobile
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn()
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(mockMatchMedia)
})

describe('Calculator UI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default calc-core responses
    mockCalculateContract.mockResolvedValue(createMockCalculationResult({
      grossPay: 312000,
      netPay: 234000,
      taxes: 78000
    }))
    
    mockCalculatePaycheck.mockResolvedValue(createMockCalculationResult({
      grossPay: 6000,
      netPay: 4500,
      taxes: 1500
    }))
  })

  describe('Form Validation and Error Display', () => {
    it('shows real-time validation errors', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test required field validation
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      
      // Focus and blur without entering value
      await user.click(hourlyRateInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/hourly rate is required/i)).toBeInTheDocument()
        expect(screen.getByText(/hourly rate is required/i)).toHaveAttribute('role', 'alert')
      })

      // Test invalid value validation
      await user.type(hourlyRateInput, '-50')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText(/hourly rate must be positive/i)).toBeInTheDocument()
      })

      expect(mockTrackValidationError).toHaveBeenCalledWith({
        field: 'hourlyRate',
        value: '-50',
        error: 'Must be positive number'
      })
    })

    it('validates interdependent fields correctly', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Set contract type to daily
      await user.selectOptions(screen.getByLabelText(/contract type/i), 'DAILY')

      // Try to enter hourly rate (should be invalid for daily contracts)
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/daily rate is required for daily contracts/i)).toBeInTheDocument()
      })

      // Switch to daily rate field
      const dailyRateInput = screen.getByLabelText(/daily rate/i)
      await user.type(dailyRateInput, '1200')

      // Should clear the error
      await waitFor(() => {
        expect(screen.queryByText(/daily rate is required/i)).not.toBeInTheDocument()
      })
    })

    it('handles complex validation scenarios', async () => {
      const user = userEvent.setup()
      render(<PaycheckCalculator />)

      // Test salary vs hourly wage validation
      await user.selectOptions(screen.getByLabelText(/employment type/i), 'hourly')
      
      const salaryInput = screen.getByLabelText(/annual salary/i)
      await user.type(salaryInput, '50000')

      const hourlyWageInput = screen.getByLabelText(/hourly wage/i)
      await user.type(hourlyWageInput, '25')

      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/cannot specify both salary and hourly wage/i)).toBeInTheDocument()
      })

      // Clear one field to resolve conflict
      await user.clear(salaryInput)

      await waitFor(() => {
        expect(screen.queryByText(/cannot specify both/i)).not.toBeInTheDocument()
      })
    })

    it('shows field-level help and tooltips', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test help tooltip
      const helpIcon = screen.getByRole('button', { name: /help for hourly rate/i })
      await user.click(helpIcon)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip).toBeInTheDocument()
      expect(tooltip).toHaveTextContent(/enter your expected hourly rate/i)

      // Test detailed help modal
      const detailedHelpButton = within(tooltip).getByRole('button', { name: /more info/i })
      await user.click(detailedHelpButton)

      const helpModal = screen.getByRole('dialog', { name: /hourly rate help/i })
      expect(helpModal).toBeInTheDocument()
      expect(helpModal).toHaveTextContent(/hourly rate is the amount you charge/i)
    })
  })

  describe('Real-time Calculation Updates', () => {
    it('updates calculations as user types', async () => {
      const user = userEvent.setup({ delay: 50 })
      render(<ContractCalculator enableRealTimeCalculation />)

      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      
      // Type hourly rate and watch for real-time updates
      await user.type(hourlyRateInput, '150')

      // Should show preliminary calculation
      await waitFor(() => {
        expect(screen.getByTestId('preliminary-gross-pay')).toHaveTextContent(/\$312,000/i)
      }, { timeout: 1000 })

      // Update hours per week
      const hoursInput = screen.getByLabelText(/hours per week/i)
      await user.type(hoursInput, '50')

      // Should update the calculation
      await waitFor(() => {
        expect(screen.getByTestId('preliminary-gross-pay')).toHaveTextContent(/\$390,000/i)
      })

      // Should debounce API calls
      await waitFor(() => {
        expect(mockCalculateContract).toHaveBeenCalledTimes(1)
      }, { timeout: 800 })
    })

    it('shows calculation progress indicators', async () => {
      const user = userEvent.setup()
      
      // Mock slow calculation
      mockCalculateContract.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve(createMockCalculationResult()), 2000)
        )
      )

      render(<ContractCalculator />)

      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Should show loading indicator
      expect(screen.getByTestId('calculation-loading')).toBeInTheDocument()
      expect(screen.getByText(/calculating.../i)).toBeInTheDocument()

      // Should show progress bar
      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '0')

      // Wait for calculation to complete
      await waitFor(() => {
        expect(screen.queryByTestId('calculation-loading')).not.toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('handles calculation interruption gracefully', async () => {
      const user = userEvent.setup()
      
      let resolveCalculation: (value: any) => void
      mockCalculateContract.mockImplementation(() => 
        new Promise(resolve => {
          resolveCalculation = resolve
        })
      )

      render(<ContractCalculator />)

      // Start first calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      expect(screen.getByTestId('calculation-loading')).toBeInTheDocument()

      // Start second calculation before first completes
      await user.clear(screen.getByLabelText(/hourly rate/i))
      await user.type(screen.getByLabelText(/hourly rate/i), '175')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Should cancel first calculation and start new one
      expect(screen.getByTestId('calculation-loading')).toBeInTheDocument()
      expect(mockCalculateContract).toHaveBeenCalledTimes(2)

      // Complete second calculation
      resolveCalculation!(createMockCalculationResult())

      await waitFor(() => {
        expect(screen.queryByTestId('calculation-loading')).not.toBeInTheDocument()
      })
    })
  })

  describe('Export Functionality Testing', () => {
    it('exports calculations in multiple formats', async () => {
      const user = userEvent.setup()
      
      // Mock successful export
      const mockBlob = new Blob(['fake content'], { type: 'application/pdf' })
      mockExportToPDF.mockResolvedValue(mockBlob)
      mockExportToExcel.mockResolvedValue(mockBlob)

      // Mock download functionality
      const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
      const mockRevokeObjectURL = jest.fn()
      const mockAnchorClick = jest.fn()

      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      const mockAnchor = {
        href: '',
        download: '',
        click: mockAnchorClick
      }
      
      Object.defineProperty(document, 'createElement', {
        value: () => mockAnchor,
        writable: true
      })

      render(
        <div>
          <ContractCalculator />
          <ExportButton 
            calculation={createMockCalculationResult()}
            formats={['pdf', 'excel', 'csv']}
          />
        </div>
      )

      // Perform calculation first
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Test PDF export
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i })
      await user.click(pdfOption)

      await waitFor(() => {
        expect(mockExportToPDF).toHaveBeenCalled()
        expect(mockAnchorClick).toHaveBeenCalled()
      })

      expect(mockTrackExportUsage).toHaveBeenCalledWith({
        format: 'pdf',
        calculationType: 'contract',
        fileSize: expect.any(Number)
      })

      // Test Excel export
      await user.click(exportButton)
      const excelOption = screen.getByRole('menuitem', { name: /excel/i })
      await user.click(excelOption)

      await waitFor(() => {
        expect(mockExportToExcel).toHaveBeenCalled()
      })
    })

    it('handles export customization options', async () => {
      const user = userEvent.setup()
      render(<ExportButton calculation={createMockCalculationResult()} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Click advanced options
      const advancedOptions = screen.getByRole('menuitem', { name: /advanced options/i })
      await user.click(advancedOptions)

      const optionsDialog = screen.getByRole('dialog', { name: /export options/i })
      expect(optionsDialog).toBeInTheDocument()

      // Configure export options
      await user.check(screen.getByLabelText(/include charts/i))
      await user.check(screen.getByLabelText(/include tax breakdown/i))
      await user.type(screen.getByLabelText(/file name/i), 'my-calculation')

      await user.click(screen.getByRole('button', { name: /export pdf/i }))

      expect(mockExportToPDF).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          includeCharts: true,
          includeTaxBreakdown: true,
          fileName: 'my-calculation'
        })
      )
    })

    it('shows export progress and handles errors', async () => {
      const user = userEvent.setup()
      
      // Mock slow export
      mockExportToPDF.mockImplementation(() => 
        new Promise((resolve, reject) => 
          setTimeout(() => reject(new Error('Export failed')), 1000)
        )
      )

      render(<ExportButton calculation={createMockCalculationResult()} />)

      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      const pdfOption = screen.getByRole('menuitem', { name: /pdf/i })
      await user.click(pdfOption)

      // Should show export progress
      expect(screen.getByText(/exporting.../i)).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toBeInTheDocument()

      // Should show error after failure
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /retry export/i })).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Mobile Responsiveness Testing', () => {
    beforeEach(() => {
      // Set mobile viewport
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

      // Mock mobile touch events
      Object.defineProperty(window, 'ontouchstart', {
        value: {},
        writable: true
      })
    })

    it('adapts layout for mobile screens', async () => {
      render(<CalculatorLayout><ContractCalculator /></CalculatorLayout>)

      // Should use mobile layout
      expect(screen.getByTestId('mobile-calculator-layout')).toBeInTheDocument()
      expect(screen.getByTestId('mobile-form-container')).toBeInTheDocument()

      // Should have collapsible sections
      const sections = screen.getAllByRole('button', { name: /toggle section/i })
      expect(sections.length).toBeGreaterThan(0)

      // Test section collapse/expand
      const user = userEvent.setup()
      const firstSection = sections[0]
      
      await user.click(firstSection)
      expect(firstSection).toHaveAttribute('aria-expanded', 'false')

      await user.click(firstSection)
      expect(firstSection).toHaveAttribute('aria-expanded', 'true')
    })

    it('optimizes input fields for mobile', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Check input optimization attributes
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      expect(hourlyRateInput).toHaveAttribute('inputmode', 'decimal')
      expect(hourlyRateInput).toHaveAttribute('pattern', '[0-9]*\\.?[0-9]+')

      const phoneInput = screen.getByLabelText(/phone/i)
      expect(phoneInput).toHaveAttribute('inputmode', 'tel')
      expect(phoneInput).toHaveAttribute('type', 'tel')

      // Test touch-friendly interactions
      await user.click(hourlyRateInput)
      
      // Should show large touch target for numeric input
      const numericKeypad = screen.getByTestId('numeric-keypad')
      expect(numericKeypad).toBeInTheDocument()
      expect(numericKeypad).toHaveClass('touch-friendly')

      // Track mobile usage
      expect(mockTrackMobileUsage).toHaveBeenCalledWith({
        action: 'input_focus',
        field: 'hourlyRate',
        device: 'mobile'
      })
    })

    it('handles mobile form submission flow', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Fill form using mobile-optimized inputs
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/hours per week/i), '40')

      // Submit calculation
      const calculateButton = screen.getByRole('button', { name: /calculate/i })
      expect(calculateButton).toHaveClass('mobile-primary-button')
      
      await user.click(calculateButton)

      // Should show mobile-optimized results
      await waitFor(() => {
        const resultsContainer = screen.getByTestId('mobile-results-container')
        expect(resultsContainer).toBeInTheDocument()
        expect(resultsContainer).toHaveClass('mobile-card-layout')
      })

      // Should have swipeable result cards
      const resultCards = screen.getAllByTestId('result-card')
      expect(resultCards[0]).toHaveAttribute('data-swipeable', 'true')
    })

    it('optimizes export flow for mobile', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <ContractCalculator />
          <ExportButton calculation={createMockCalculationResult()} />
        </div>
      )

      // Perform calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Test mobile export flow
      const exportButton = screen.getByRole('button', { name: /export/i })
      await user.click(exportButton)

      // Should show mobile-optimized export menu
      const exportMenu = screen.getByTestId('mobile-export-menu')
      expect(exportMenu).toBeInTheDocument()
      expect(exportMenu).toHaveClass('mobile-bottom-sheet')

      // Test share functionality
      const shareButton = screen.getByRole('button', { name: /share/i })
      await user.click(shareButton)

      // Should trigger native share API on mobile
      expect(mockTrackExportUsage).toHaveBeenCalledWith({
        format: 'share',
        calculationType: 'contract',
        device: 'mobile'
      })
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains proper focus management', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test tab order
      await user.tab()
      expect(screen.getByLabelText(/hourly rate/i)).toHaveFocus()

      await user.tab()
      expect(screen.getByLabelText(/hours per week/i)).toHaveFocus()

      // Test focus trapping in modals
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Open save dialog
      await user.click(screen.getByRole('button', { name: /save calculation/i }))

      const saveDialog = screen.getByRole('dialog')
      expect(saveDialog).toBeInTheDocument()

      // Focus should be trapped in dialog
      const firstFocusableElement = within(saveDialog).getByLabelText(/calculation name/i)
      expect(firstFocusableElement).toHaveFocus()

      // Tab to last element and ensure focus wraps
      await user.tab()
      await user.tab()
      const lastButton = within(saveDialog).getByRole('button', { name: /cancel/i })
      expect(lastButton).toHaveFocus()

      await user.tab()
      expect(firstFocusableElement).toHaveFocus()
    })

    it('provides comprehensive screen reader support', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test field descriptions
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      expect(hourlyRateInput).toHaveAttribute('aria-describedby')
      
      const descriptionId = hourlyRateInput.getAttribute('aria-describedby')
      const description = screen.getByTestId(descriptionId!)
      expect(description).toHaveTextContent(/enter your expected hourly rate/i)

      // Test calculation result announcements
      await user.type(hourlyRateInput, '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
          'Calculation complete. Gross pay: $312,000, Net pay: $234,000, Taxes: $78,000'
        )
      })

      // Test error announcements
      mockCalculateContract.mockRejectedValue(new Error('Invalid input'))
      
      await user.clear(hourlyRateInput)
      await user.type(hourlyRateInput, '-50')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(mockAnnounceToScreenReader).toHaveBeenCalledWith(
          'Calculation error: Invalid input'
        )
      })
    })

    it('supports keyboard-only navigation', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Navigate and interact using only keyboard
      await user.tab() // Hourly rate
      await user.type(screen.getByLabelText(/hourly rate/i), '150')

      await user.tab() // Hours per week
      await user.type(screen.getByLabelText(/hours per week/i), '40')

      await user.tab() // Duration
      await user.type(screen.getByLabelText(/contract duration/i), '12')

      // Skip to calculate button
      while (document.activeElement !== screen.getByRole('button', { name: /calculate/i })) {
        await user.tab()
      }

      await user.keyboard(' ') // Space to activate button

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Navigate to results
      await user.tab()
      const resultsRegion = screen.getByRole('region', { name: /calculation results/i })
      expect(resultsRegion).toContainElement(document.activeElement)
    })

    it('respects user preferences for reduced motion', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: jest.fn(() => ({
          matches: true, // prefers-reduced-motion: reduce
          media: 'prefers-reduced-motion: reduce',
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn()
        })),
        writable: true
      })

      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Animations should be disabled
      const calculator = screen.getByTestId('calculator-container')
      expect(calculator).toHaveClass('reduced-motion')

      // Perform calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Results should appear without animation
      await waitFor(() => {
        const results = screen.getByTestId('calculation-results')
        expect(results).toHaveClass('no-animation')
      })
    })
  })

  describe('Complex UI State Management', () => {
    it('handles multiple simultaneous UI interactions', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <ContractCalculator />
          <CalculationHistory />
        </div>
      )

      // Start typing in calculator
      const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
      await user.type(hourlyRateInput, '150')

      // Open history panel while typing
      const historyButton = screen.getByRole('button', { name: /history/i })
      await user.click(historyButton)

      const historyPanel = screen.getByTestId('history-panel')
      expect(historyPanel).toBeInTheDocument()

      // Continue editing calculator while history is open
      await user.type(screen.getByLabelText(/hours per week/i), '40')

      // Should maintain both states
      expect(hourlyRateInput).toHaveValue(150)
      expect(screen.getByLabelText(/hours per week/i)).toHaveValue(40)
      expect(historyPanel).toBeInTheDocument()

      // Start calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // History should still be open during calculation
      expect(historyPanel).toBeInTheDocument()
      expect(screen.getByTestId('calculation-loading')).toBeInTheDocument()
    })

    it('handles form state persistence during navigation', async () => {
      const user = userEvent.setup()
      render(
        <CalculatorLayout>
          <ContractCalculator />
          <PaycheckCalculator />
        </CalculatorLayout>
      )

      // Fill contract calculator
      await user.type(screen.getByLabelText(/hourly rate/i), '150')
      await user.type(screen.getByLabelText(/location/i), 'Dallas, TX')

      // Switch to paycheck calculator
      await user.click(screen.getByRole('tab', { name: /paycheck calculator/i }))

      // Fill paycheck calculator
      await user.type(screen.getByLabelText(/annual salary/i), '300000')

      // Switch back to contract calculator
      await user.click(screen.getByRole('tab', { name: /contract calculator/i }))

      // Values should be preserved
      expect(screen.getByDisplayValue('150')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Dallas, TX')).toBeInTheDocument()

      // Switch back to paycheck
      await user.click(screen.getByRole('tab', { name: /paycheck calculator/i }))
      expect(screen.getByDisplayValue('300000')).toBeInTheDocument()
    })

    it('manages complex form dependencies', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator />)

      // Test cascading field updates
      await user.selectOptions(screen.getByLabelText(/contract type/i), 'DAILY')

      // Should show daily rate field and hide hourly rate
      expect(screen.getByLabelText(/daily rate/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/hourly rate/i)).not.toBeInTheDocument()

      // Fill daily rate
      await user.type(screen.getByLabelText(/daily rate/i), '1200')

      // Change to monthly - should show monthly rate
      await user.selectOptions(screen.getByLabelText(/contract type/i), 'MONTHLY')
      
      expect(screen.getByLabelText(/monthly rate/i)).toBeInTheDocument()
      expect(screen.queryByLabelText(/daily rate/i)).not.toBeInTheDocument()

      // Previous daily rate should be cleared from form
      expect(screen.queryByDisplayValue('1200')).not.toBeInTheDocument()

      // Test location-dependent field updates
      await user.type(screen.getByLabelText(/location/i), 'New York, NY')

      // Should enable state tax fields for NY
      await waitFor(() => {
        expect(screen.getByLabelText(/state tax rate/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/local tax rate/i)).toBeInTheDocument()
      })

      // Change to Texas (no state tax)
      await user.clear(screen.getByLabelText(/location/i))
      await user.type(screen.getByLabelText(/location/i), 'Dallas, TX')

      // State tax fields should be hidden/disabled
      await waitFor(() => {
        expect(screen.queryByLabelText(/state tax rate/i)).not.toBeInTheDocument()
      })
    })
  })
})