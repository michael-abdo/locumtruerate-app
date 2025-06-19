import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResults } from '@/app/search/results/page'

// Mock the router
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush
  }),
  useSearchParams: () => new URLSearchParams('q=emergency+medicine&location=dallas')
}))

// Mock the TRPC provider
const mockSearchResults = {
  jobs: [
    {
      id: '1',
      title: 'Emergency Medicine Physician',
      company: { name: 'Metro General Hospital' },
      location: { city: 'Dallas', state: 'TX' },
      salary: { min: 280000, max: 350000 },
      posted: '2024-01-15',
      type: 'Full-time'
    },
    {
      id: '2', 
      title: 'ER Doctor - Night Shift',
      company: { name: 'Dallas Medical Center' },
      location: { city: 'Dallas', state: 'TX' },
      salary: { min: 300000, max: 400000 },
      posted: '2024-01-14',
      type: 'Full-time'
    }
  ],
  total: 25,
  pages: 3,
  facets: {
    locations: [
      { name: 'Dallas, TX', count: 15 },
      { name: 'Houston, TX', count: 8 }
    ],
    companies: [
      { name: 'Metro General Hospital', count: 3 },
      { name: 'Dallas Medical Center', count: 5 }
    ]
  }
}

const mockTrackSearchUsage = jest.fn()

jest.mock('@/providers/trpc-provider', () => ({
  trpc: {
    search: {
      jobs: {
        useQuery: () => ({
          data: mockSearchResults,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

describe('SearchResults Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders search results correctly', async () => {
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()
      expect(screen.getByText('ER Doctor - Night Shift')).toBeInTheDocument()
      expect(screen.getByText(/25 results/i)).toBeInTheDocument()
    })
  })

  it('displays job details correctly', async () => {
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText('Metro General Hospital')).toBeInTheDocument()
      expect(screen.getByText('Dallas, TX')).toBeInTheDocument()
      expect(screen.getByText(/280k.*350k/i)).toBeInTheDocument()
    })
  })

  it('handles job filtering by location', async () => {
    const user = userEvent.setup()
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText(/locations/i)).toBeInTheDocument()
    })
    
    // Click on Dallas filter
    const dallasFilter = screen.getByText(/dallas.*15/i)
    await user.click(dallasFilter)
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('location=Dallas')
    )
  })
})