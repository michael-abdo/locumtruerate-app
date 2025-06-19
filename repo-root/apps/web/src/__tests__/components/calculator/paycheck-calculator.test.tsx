import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockCalculationResult } from '@/__tests__/utils/test-utils'
import { PaycheckCalculator } from '@/components/calculator/paycheck-calculator'

// Mock the calc-core package
const mockCalculatePaycheck = jest.fn()
jest.mock('@locumtruerate/calc-core', () => ({
  calculatePaycheck: mockCalculatePaycheck,
  PayPeriod: {
    WEEKLY: 'WEEKLY',
    BIWEEKLY: 'BIWEEKLY',
    MONTHLY: 'MONTHLY'
  }
}))

// Mock analytics hooks
const mockTrackCalculatorUsage = jest.fn()
const mockTrackCalculatorError = jest.fn()
jest.mock('@/hooks/use-analytics', () => ({
  useCalculatorAnalytics: () => ({
    trackCalculatorUsage: mockTrackCalculatorUsage,
    trackCalculatorError: mockTrackCalculatorError,
    trackCalculatorExport: jest.fn()
  })
}))

describe('PaycheckCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCalculatePaycheck.mockReturnValue(createMockCalculationResult({
      grossPay: 5000,
      netPay: 3800,
      taxes: 1200
    }))
  })
  
  it('renders paycheck calculator form with all fields', () => {
    render(<PaycheckCalculator />)
    
    expect(screen.getByLabelText(/gross salary/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/pay period/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/filing status/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /calculate paycheck/i })).toBeInTheDocument()
  })
  
  it('handles basic paycheck calculation', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Fill form
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.selectOptions(screen.getByLabelText(/pay period/i), 'BIWEEKLY')
    await user.selectOptions(screen.getByLabelText(/filing status/i), 'SINGLE')
    await user.selectOptions(screen.getByLabelText(/state/i), 'TX')
    
    // Submit calculation
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith({
      grossSalary: 120000,
      payPeriod: 'BIWEEKLY',
      filingStatus: 'SINGLE',
      state: 'TX',
      allowances: 0
    })
    
    expect(mockTrackCalculatorUsage).toHaveBeenCalled()
  })
  
  it('displays paycheck calculation results', async () => {
    const user = userEvent.setup()
    const mockResult = createMockCalculationResult({
      grossPay: 4615,
      netPay: 3420,
      taxes: 1195,
      breakdown: {
        federal: 692,
        state: 0,
        social: 286,
        medicare: 67
      }
    })
    
    mockCalculatePaycheck.mockReturnValue(mockResult)
    
    render(<PaycheckCalculator />)
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/\$4,615/)).toBeInTheDocument()
      expect(screen.getByText(/\$3,420/)).toBeInTheDocument()
      expect(screen.getByText(/\$1,195/)).toBeInTheDocument()
    })
  })
  
  it('handles different pay periods', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Test weekly pay period
    await user.selectOptions(screen.getByLabelText(/pay period/i), 'WEEKLY')
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        payPeriod: 'WEEKLY'
      })
    )
  })
  
  it('handles different filing statuses', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Test married filing jointly
    await user.selectOptions(screen.getByLabelText(/filing status/i), 'MARRIED_JOINTLY')
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        filingStatus: 'MARRIED_JOINTLY'
      })
    )
  })
  
  it('handles state-specific tax calculations', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Test California (state with income tax)
    await user.selectOptions(screen.getByLabelText(/state/i), 'CA')
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        state: 'CA'
      })
    )
  })
  
  it('handles allowances and exemptions', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Add allowances
    await user.type(screen.getByLabelText(/allowances/i), '2')
    await user.type(screen.getByLabelText(/additional exemptions/i), '1000')
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        allowances: 2,
        additionalExemptions: 1000
      })
    )
  })
  
  it('handles pre-tax deductions', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Add pre-tax deductions
    await user.click(screen.getByRole('button', { name: /add deductions/i }))
    
    await user.type(screen.getByLabelText(/401k contribution/i), '500')
    await user.type(screen.getByLabelText(/health insurance/i), '200')
    await user.type(screen.getByLabelText(/dental insurance/i), '25')
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        preTaxDeductions: {
          retirement401k: 500,
          healthInsurance: 200,
          dentalInsurance: 25
        }
      })
    )
  })
  
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(screen.getByText(/gross salary is required/i)).toBeInTheDocument()
    expect(mockCalculatePaycheck).not.toHaveBeenCalled()
  })
  
  it('handles calculation errors gracefully', async () => {
    const user = userEvent.setup()
    mockCalculatePaycheck.mockImplementation(() => {
      throw new Error('Invalid salary amount')
    })
    
    render(<PaycheckCalculator />)
    
    await user.type(screen.getByLabelText(/gross salary/i), '-50000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/calculation error/i)).toBeInTheDocument()
    })
    
    expect(mockTrackCalculatorError).toHaveBeenCalled()
  })
  
  it('shows detailed tax breakdown', async () => {
    const user = userEvent.setup()
    const mockResult = createMockCalculationResult({
      breakdown: {
        federal: 692,
        state: 234,
        social: 286,
        medicare: 67,
        sdi: 45
      }
    })
    
    mockCalculatePaycheck.mockReturnValue(mockResult)
    
    render(<PaycheckCalculator />)
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    // Expand tax breakdown
    await user.click(screen.getByRole('button', { name: /view breakdown/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/federal income tax.*\$692/i)).toBeInTheDocument()
      expect(screen.getByText(/state income tax.*\$234/i)).toBeInTheDocument()
      expect(screen.getByText(/social security.*\$286/i)).toBeInTheDocument()
      expect(screen.getByText(/medicare.*\$67/i)).toBeInTheDocument()
    })
  })
  
  it('handles year-to-date calculations', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Enable YTD mode
    await user.click(screen.getByRole('checkbox', { name: /year to date/i }))
    
    await user.type(screen.getByLabelText(/ytd gross/i), '60000')
    await user.type(screen.getByLabelText(/ytd taxes/i), '12000')
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        ytdGross: 60000,
        ytdTaxes: 12000
      })
    )
  })
  
  it('allows comparison with different scenarios', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Enable comparison mode
    await user.click(screen.getByRole('button', { name: /compare scenarios/i }))
    
    // Should show two calculation panels
    expect(screen.getAllByLabelText(/gross salary/i)).toHaveLength(2)
    expect(screen.getByText(/scenario a/i)).toBeInTheDocument()
    expect(screen.getByText(/scenario b/i)).toBeInTheDocument()
  })
  
  it('exports calculation results', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Perform calculation first
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('button', { name: /export/i }))
    
    // Should show export options
    expect(screen.getByText(/export format/i)).toBeInTheDocument()
    expect(screen.getByText(/pdf/i)).toBeInTheDocument()
    expect(screen.getByText(/excel/i)).toBeInTheDocument()
  })
  
  it('shows annual projection', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/annual projection/i)).toBeInTheDocument()
      expect(screen.getByText(/\$120,000/)).toBeInTheDocument() // Annual gross
    })
  })
  
  it('handles overtime calculations', async () => {
    const user = userEvent.setup()
    render(<PaycheckCalculator />)
    
    // Add overtime hours
    await user.click(screen.getByRole('button', { name: /add overtime/i }))
    
    await user.type(screen.getByLabelText(/overtime hours/i), '10')
    await user.type(screen.getByLabelText(/overtime rate multiplier/i), '1.5')
    
    await user.type(screen.getByLabelText(/gross salary/i), '120000')
    await user.click(screen.getByRole('button', { name: /calculate paycheck/i }))
    
    expect(mockCalculatePaycheck).toHaveBeenCalledWith(
      expect.objectContaining({
        overtimeHours: 10,
        overtimeMultiplier: 1.5
      })
    )
  })
})