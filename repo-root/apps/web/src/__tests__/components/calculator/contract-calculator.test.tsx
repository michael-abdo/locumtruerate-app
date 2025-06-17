import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockCalculationResult } from '@/__tests__/utils/test-utils'
import { ContractCalculator } from '@/components/calculator/contract-calculator'

// Mock the calc-core package
const mockCalculateContract = jest.fn()
jest.mock('@locum-calc/calc-core', () => ({
  calculateContract: mockCalculateContract,
  ContractType: {
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
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

describe('ContractCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCalculateContract.mockReturnValue(createMockCalculationResult())
  })
  
  it('renders calculator form with all fields', () => {
    render(<ContractCalculator />)
    
    expect(screen.getByLabelText(/hourly rate/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hours per week/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contract duration/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument()
  })
  
  it('handles basic contract calculation', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Fill form
    await user.type(screen.getByLabelText(/hourly rate/i), '150')
    await user.type(screen.getByLabelText(/hours per week/i), '40')
    await user.type(screen.getByLabelText(/contract duration/i), '12')
    await user.type(screen.getByLabelText(/location/i), 'Dallas, TX')
    
    // Submit calculation
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    expect(mockCalculateContract).toHaveBeenCalledWith({
      hourlyRate: 150,
      hoursPerWeek: 40,
      duration: 12,
      location: 'Dallas, TX',
      contractType: 'HOURLY'
    })
    
    expect(mockTrackCalculatorUsage).toHaveBeenCalled()
  })
  
  it('displays calculation results', async () => {
    const user = userEvent.setup()
    const mockResult = createMockCalculationResult({
      grossPay: 312000,
      netPay: 234000,
      taxes: 78000
    })
    
    mockCalculateContract.mockReturnValue(mockResult)
    
    render(<ContractCalculator />)
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/hourly rate/i), '150')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$234,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$78,000/)).toBeInTheDocument()
    })
  })
  
  it('handles contract type selection', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    const contractTypeSelect = screen.getByLabelText(/contract type/i)
    await user.selectOptions(contractTypeSelect, 'DAILY')
    
    await user.type(screen.getByLabelText(/daily rate/i), '1200')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    expect(mockCalculateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        contractType: 'DAILY',
        dailyRate: 1200
      })
    )
  })
  
  it('validates required fields', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Try to submit without filling required fields
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    expect(screen.getByText(/hourly rate is required/i)).toBeInTheDocument()
    expect(mockCalculateContract).not.toHaveBeenCalled()
  })
  
  it('handles calculation errors', async () => {
    const user = userEvent.setup()
    mockCalculateContract.mockImplementation(() => {
      throw new Error('Invalid calculation parameters')
    })
    
    render(<ContractCalculator />)
    
    await user.type(screen.getByLabelText(/hourly rate/i), '-50')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/calculation error/i)).toBeInTheDocument()
    })
    
    expect(mockTrackCalculatorError).toHaveBeenCalled()
  })
  
  it('shows tax breakdown details', async () => {
    const user = userEvent.setup()
    const mockResult = createMockCalculationResult({
      breakdown: {
        federal: 45000,
        state: 15000,
        social: 12000,
        medicare: 6000
      }
    })
    
    mockCalculateContract.mockReturnValue(mockResult)
    
    render(<ContractCalculator />)
    
    await user.type(screen.getByLabelText(/hourly rate/i), '150')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    // Expand tax breakdown
    await user.click(screen.getByRole('button', { name: /tax breakdown/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/federal.*\$45,000/i)).toBeInTheDocument()
      expect(screen.getByText(/state.*\$15,000/i)).toBeInTheDocument()
      expect(screen.getByText(/social security.*\$12,000/i)).toBeInTheDocument()
      expect(screen.getByText(/medicare.*\$6,000/i)).toBeInTheDocument()
    })
  })
  
  it('handles expenses and deductions', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Add expenses
    await user.click(screen.getByRole('button', { name: /add expenses/i }))
    
    await user.type(screen.getByLabelText(/travel expenses/i), '5000')
    await user.type(screen.getByLabelText(/housing allowance/i), '3000')
    await user.type(screen.getByLabelText(/malpractice insurance/i), '2000')
    
    await user.type(screen.getByLabelText(/hourly rate/i), '150')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    expect(mockCalculateContract).toHaveBeenCalledWith(
      expect.objectContaining({
        expenses: {
          travel: 5000,
          housing: 3000,
          malpractice: 2000
        }
      })
    )
  })
  
  it('allows saving calculation results', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Perform calculation first
    await user.type(screen.getByLabelText(/hourly rate/i), '150')
    await user.click(screen.getByRole('button', { name: /calculate/i }))
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save calculation/i })).toBeInTheDocument()
    })
    
    await user.click(screen.getByRole('button', { name: /save calculation/i }))
    
    // Should open save dialog
    expect(screen.getByText(/save calculation/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/calculation name/i)).toBeInTheDocument()
  })
  
  it('handles comparison mode', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Enable comparison mode
    await user.click(screen.getByRole('button', { name: /compare contracts/i }))
    
    // Should show two calculation panels
    expect(screen.getAllByLabelText(/hourly rate/i)).toHaveLength(2)
    expect(screen.getByText(/contract a/i)).toBeInTheDocument()
    expect(screen.getByText(/contract b/i)).toBeInTheDocument()
  })
  
  it('resets form when reset button is clicked', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    // Fill form
    const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
    await user.type(hourlyRateInput, '150')
    
    expect(hourlyRateInput).toHaveValue(150)
    
    // Reset form
    await user.click(screen.getByRole('button', { name: /reset/i }))
    
    expect(hourlyRateInput).toHaveValue(null)
  })
  
  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<ContractCalculator />)
    
    const hourlyRateInput = screen.getByLabelText(/hourly rate/i)
    
    // Tab through form fields
    await user.tab()
    expect(hourlyRateInput).toHaveFocus()
    
    await user.tab()
    expect(screen.getByLabelText(/hours per week/i)).toHaveFocus()
  })
})