import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/__tests__/utils/test-utils'
import { AdvancedSearch } from '@/components/search/advanced-search'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams
}))

// Mock the tRPC provider
jest.mock('@/providers/trpc-provider', () => ({
  trpc: {
    search: {
      suggestions: {
        useMutation: () => ({
          mutate: jest.fn(),
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

describe('AdvancedSearch', () => {
  const mockOnSearch = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  const defaultProps = {
    onSearch: mockOnSearch,
    initialFilters: {}
  }
  
  it('renders search form with all fields', () => {
    render(<AdvancedSearch {...defaultProps} />)
    
    expect(screen.getByPlaceholderText(/search jobs, specialties/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/location/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
  })
  
  it('handles basic search input', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText(/search jobs, specialties/i)
    const searchButton = screen.getByRole('button', { name: /search/i })
    
    await user.type(searchInput, 'emergency medicine')
    await user.click(searchButton)
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'emergency medicine'
    })
  })
  
  it('handles location search', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    const locationInput = screen.getByPlaceholderText(/location/i)
    const searchButton = screen.getByRole('button', { name: /search/i })
    
    await user.type(locationInput, 'Dallas, TX')
    await user.click(searchButton)
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      location: 'Dallas, TX'
    })
  })
  
  it('opens and closes advanced filters', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    const filtersButton = screen.getByRole('button', { name: /filters/i })
    
    // Initially filters should be hidden
    expect(screen.queryByText(/advanced filters/i)).not.toBeInTheDocument()
    
    // Open filters
    await user.click(filtersButton)
    expect(screen.getByText(/advanced filters/i)).toBeInTheDocument()
    
    // Close filters
    const closeButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText(/advanced filters/i)).not.toBeInTheDocument()
    })
  })
  
  it('handles specialty filter selection', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Select specialty
    const specialtySelect = screen.getByDisplayValue(/all specialties/i)
    await user.selectOptions(specialtySelect, 'Emergency Medicine')
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      category: 'Emergency Medicine'
    })
  })
  
  it('handles job type filter selection', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Select job type
    const jobTypeSelect = screen.getByDisplayValue(/all types/i)
    await user.selectOptions(jobTypeSelect, 'LOCUM')
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      type: 'LOCUM'
    })
  })
  
  it('handles salary range input', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Set salary range
    const minSalaryInput = screen.getByPlaceholderText(/min/i)
    const maxSalaryInput = screen.getByPlaceholderText(/max/i)
    
    await user.type(minSalaryInput, '200000')
    await user.type(maxSalaryInput, '400000')
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      salaryMin: 200000,
      salaryMax: 400000
    })
  })
  
  it('handles remote work checkbox', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check remote work
    const remoteCheckbox = screen.getByRole('checkbox', { name: /remote positions/i })
    await user.click(remoteCheckbox)
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      remote: true
    })
  })
  
  it('handles urgent openings checkbox', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Check urgent openings
    const urgentCheckbox = screen.getByRole('checkbox', { name: /urgent openings/i })
    await user.click(urgentCheckbox)
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      urgent: true
    })
  })
  
  it('clears all filters', async () => {
    const user = userEvent.setup()
    const initialFilters = {
      query: 'emergency',
      location: 'Dallas',
      category: 'Emergency Medicine',
      remote: true
    }
    
    render(<AdvancedSearch {...defaultProps} initialFilters={initialFilters} />)
    
    // Open filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    // Clear all filters
    await user.click(screen.getByRole('button', { name: /clear all/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({})
  })
  
  it('shows filter count badge when filters are active', async () => {
    const initialFilters = {
      query: 'emergency',
      location: 'Dallas',
      category: 'Emergency Medicine'
    }
    
    render(<AdvancedSearch {...defaultProps} initialFilters={initialFilters} />)
    
    // Should show badge with count of active filters
    expect(screen.getByText('3')).toBeInTheDocument()
  })
  
  it('handles enter key press in search input', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    const searchInput = screen.getByPlaceholderText(/search jobs, specialties/i)
    
    await user.type(searchInput, 'emergency medicine')
    await user.keyboard('{Enter}')
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'emergency medicine'
    })
  })
  
  it('handles enter key press in location input', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    const locationInput = screen.getByPlaceholderText(/location/i)
    
    await user.type(locationInput, 'Dallas, TX')
    await user.keyboard('{Enter}')
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      location: 'Dallas, TX'
    })
  })
  
  it('combines multiple filters correctly', async () => {
    const user = userEvent.setup()
    render(<AdvancedSearch {...defaultProps} />)
    
    // Fill basic search
    await user.type(screen.getByPlaceholderText(/search jobs, specialties/i), 'physician')
    await user.type(screen.getByPlaceholderText(/location/i), 'Texas')
    
    // Open and set advanced filters
    await user.click(screen.getByRole('button', { name: /filters/i }))
    
    const specialtySelect = screen.getByDisplayValue(/all specialties/i)
    await user.selectOptions(specialtySelect, 'Emergency Medicine')
    
    const remoteCheckbox = screen.getByRole('checkbox', { name: /remote positions/i })
    await user.click(remoteCheckbox)
    
    // Apply filters
    await user.click(screen.getByRole('button', { name: /apply filters/i }))
    
    expect(mockOnSearch).toHaveBeenCalledWith({
      query: 'physician',
      location: 'Texas',
      category: 'Emergency Medicine',
      remote: true
    })
  })
})