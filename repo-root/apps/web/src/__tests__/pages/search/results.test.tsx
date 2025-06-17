import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockJob } from '@/__tests__/utils/test-utils'
import SearchResults from '@/app/search/results/page'

// Mock next/navigation
const mockPush = jest.fn()
const mockSearchParams = new URLSearchParams('q=emergency+medicine&location=dallas')

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams
}))

// Mock search results data
const mockSearchResults = {
  jobs: [
    createMockJob({ 
      id: '1', 
      title: 'Emergency Medicine Physician',
      location: 'Dallas, TX',
      salaryMin: 300000,
      salaryMax: 450000
    }),
    createMockJob({ 
      id: '2', 
      title: 'Emergency Room Doctor',
      location: 'Dallas, TX',
      salaryMin: 280000,
      salaryMax: 420000
    }),
    createMockJob({ 
      id: '3', 
      title: 'ER Physician - Night Shift',
      location: 'Dallas, TX',
      salaryMin: 320000,
      salaryMax: 480000
    })
  ],
  total: 3,
  pages: 1,
  facets: {
    categories: [
      { name: 'Emergency Medicine', count: 3 },
      { name: 'Critical Care', count: 1 }
    ],
    locations: [
      { name: 'Dallas, TX', count: 3 },
      { name: 'Fort Worth, TX', count: 2 }
    ],
    salaryRanges: [
      { range: '200k-300k', count: 1 },
      { range: '300k-400k', count: 2 },
      { range: '400k+', count: 1 }
    ]
  }
}

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

// Mock analytics hooks
const mockTrackSearchUsage = jest.fn()
jest.mock('@/hooks/use-analytics', () => ({
  usePageAnalytics: () => ({
    trackSearchUsage: mockTrackSearchUsage,
    trackUserEngagement: jest.fn()
  }),
  useJobAnalytics: () => ({
    trackJobInteraction: jest.fn()
  })
}))

describe('SearchResults', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders search results page with job listings', async () => {
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText(/search results/i)).toBeInTheDocument()
      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()
      expect(screen.getByText('Emergency Room Doctor')).toBeInTheDocument()
      expect(screen.getByText('ER Physician - Night Shift')).toBeInTheDocument()
    })
  })
  
  it('displays search query and results count', async () => {
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText(/emergency medicine/i)).toBeInTheDocument()
      expect(screen.getByText(/3 results/i)).toBeInTheDocument()
    })
  })
  
  it('shows job cards with essential information', async () => {
    render(<SearchResults />)
    
    await waitFor(() => {
      // Check for salary ranges
      expect(screen.getByText(/\$300,000.*\$450,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$280,000.*\$420,000/)).toBeInTheDocument()
      
      // Check for locations
      expect(screen.getAllByText('Dallas, TX')).toHaveLength(3)
      
      // Check for company names
      expect(screen.getAllByText('Metro General Hospital')).toHaveLength(3)
    })
  })
  
  it('handles job card click navigation', async () => {
    const user = userEvent.setup()
    render(<SearchResults />)
    
    await waitFor(() => {
      const jobCard = screen.getByText('Emergency Medicine Physician')
      expect(jobCard).toBeInTheDocument()
    })
    
    const jobCard = screen.getByText('Emergency Medicine Physician').closest('[data-testid=\"job-card\"]')
    if (jobCard) {
      await user.click(jobCard)
      expect(mockPush).toHaveBeenCalledWith('/jobs/emergency-medicine-physician-1')
    }
  })
  
  it('displays and handles search filters', async () => {
    const user = userEvent.setup()
    render(<SearchResults />)
    
    await waitFor(() => {
      expect(screen.getByText(/filters/i)).toBeInTheDocument()
      expect(screen.getByText(/emergency medicine.*3/i)).toBeInTheDocument()
      expect(screen.getByText(/dallas, tx.*3/i)).toBeInTheDocument()
    })
    
    // Click on a filter
    const categoryFilter = screen.getByText(/emergency medicine.*3/i)
    await user.click(categoryFilter)
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('category=Emergency Medicine')
    )\n  })\n  \n  it('handles salary range filtering', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/salary range/i)).toBeInTheDocument()\n    })\n    \n    // Select salary range\n    const salaryFilter = screen.getByText(/300k-400k.*2/i)\n    await user.click(salaryFilter)\n    \n    expect(mockPush).toHaveBeenCalledWith(\n      expect.stringContaining('salaryMin=300000&salaryMax=400000')\n    )\n  })\n  \n  it('provides sorting options', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    const sortSelect = screen.getByLabelText(/sort by/i)\n    await user.selectOptions(sortSelect, 'salary-high')\n    \n    expect(mockPush).toHaveBeenCalledWith(\n      expect.stringContaining('sort=salary-high')\n    )\n  })\n  \n  it('handles pagination', async () => {\n    const user = userEvent.setup()\n    \n    // Mock multiple pages of results\n    const mockMultiPageResults = {\n      ...mockSearchResults,\n      total: 50,\n      pages: 5\n    }\n    \n    jest.doMock('@/providers/trpc-provider', () => ({\n      trpc: {\n        search: {\n          jobs: {\n            useQuery: () => ({\n              data: mockMultiPageResults,\n              isLoading: false,\n              error: null\n            })\n          }\n        }\n      }\n    }))\n    \n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/50 results/i)).toBeInTheDocument()\n    })\n    \n    // Click next page\n    const nextButton = screen.getByRole('button', { name: /next/i })\n    await user.click(nextButton)\n    \n    expect(mockPush).toHaveBeenCalledWith(\n      expect.stringContaining('page=2')\n    )\n  })\n  \n  it('shows no results message when appropriate', () => {\n    // Mock empty results\n    jest.doMock('@/providers/trpc-provider', () => ({\n      trpc: {\n        search: {\n          jobs: {\n            useQuery: () => ({\n              data: { jobs: [], total: 0, pages: 0, facets: {} },\n              isLoading: false,\n              error: null\n            })\n          }\n        }\n      }\n    }))\n    \n    render(<SearchResults />)\n    \n    expect(screen.getByText(/no jobs found/i)).toBeInTheDocument()\n    expect(screen.getByText(/try adjusting your search/i)).toBeInTheDocument()\n  })\n  \n  it('handles loading state', () => {\n    // Mock loading state\n    jest.doMock('@/providers/trpc-provider', () => ({\n      trpc: {\n        search: {\n          jobs: {\n            useQuery: () => ({\n              data: null,\n              isLoading: true,\n              error: null\n            })\n          }\n        }\n      }\n    }))\n    \n    render(<SearchResults />)\n    \n    expect(screen.getByTestId('loading')).toBeInTheDocument()\n  })\n  \n  it('handles search error state', () => {\n    // Mock error state\n    jest.doMock('@/providers/trpc-provider', () => ({\n      trpc: {\n        search: {\n          jobs: {\n            useQuery: () => ({\n              data: null,\n              isLoading: false,\n              error: new Error('Search service unavailable')\n            })\n          }\n        }\n      }\n    }))\n    \n    render(<SearchResults />)\n    \n    expect(screen.getByText(/search error/i)).toBeInTheDocument()\n    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()\n  })\n  \n  it('allows saving job searches', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    const saveSearchButton = screen.getByRole('button', { name: /save search/i })\n    await user.click(saveSearchButton)\n    \n    // Should open save search dialog\n    expect(screen.getByText(/save this search/i)).toBeInTheDocument()\n    expect(screen.getByLabelText(/search name/i)).toBeInTheDocument()\n  })\n  \n  it('shows job alerts option', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    const alertButton = screen.getByRole('button', { name: /create job alert/i })\n    await user.click(alertButton)\n    \n    // Should open job alert dialog\n    expect(screen.getByText(/job alert/i)).toBeInTheDocument()\n    expect(screen.getByLabelText(/email frequency/i)).toBeInTheDocument()\n  })\n  \n  it('provides quick apply functionality', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      const quickApplyButton = screen.getAllByRole('button', { name: /quick apply/i })[0]\n      expect(quickApplyButton).toBeInTheDocument()\n    })\n    \n    const quickApplyButton = screen.getAllByRole('button', { name: /quick apply/i })[0]\n    await user.click(quickApplyButton)\n    \n    // Should open quick apply modal\n    expect(screen.getByText(/quick application/i)).toBeInTheDocument()\n  })\n  \n  it('tracks search analytics', async () => {\n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      expect(mockTrackSearchUsage).toHaveBeenCalledWith(\n        'emergency medicine',\n        3,\n        expect.objectContaining({\n          filters: expect.objectContaining({\n            location: 'dallas'\n          })\n        })\n      )\n    })\n  })\n  \n  it('shows related searches suggestions', async () => {\n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/related searches/i)).toBeInTheDocument()\n      expect(screen.getByText(/emergency medicine dallas/i)).toBeInTheDocument()\n      expect(screen.getByText(/urgent care physician/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('allows clearing all filters', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    const clearFiltersButton = screen.getByRole('button', { name: /clear all filters/i })\n    await user.click(clearFiltersButton)\n    \n    expect(mockPush).toHaveBeenCalledWith('/search/results?q=emergency+medicine')\n  })\n  \n  it('shows job freshness indicators', async () => {\n    render(<SearchResults />)\n    \n    await waitFor(() => {\n      // Should show posting dates or freshness indicators\n      expect(screen.getByText(/posted today/i) || screen.getByText(/new/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('provides export search results functionality', async () => {\n    const user = userEvent.setup()\n    render(<SearchResults />)\n    \n    const exportButton = screen.getByRole('button', { name: /export results/i })\n    await user.click(exportButton)\n    \n    // Should show export options\n    expect(screen.getByText(/export format/i)).toBeInTheDocument()\n  })\n})"