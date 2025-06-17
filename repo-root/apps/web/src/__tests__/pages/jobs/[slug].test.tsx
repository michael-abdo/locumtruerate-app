import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockJob } from '@/__tests__/utils/test-utils'
import JobDetailPage from '@/app/jobs/[slug]/page'

// Mock next/navigation
const mockPush = jest.fn()
const mockBack = jest.fn()
const mockParams = { slug: 'emergency-medicine-physician-1' }

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useParams: () => mockParams
}))

// Mock tRPC
const mockJobData = createMockJob()
const mockSimilarJobs = {
  jobs: [
    createMockJob({ id: '2', title: 'Family Medicine Physician' }),
    createMockJob({ id: '3', title: 'Internal Medicine Physician' })
  ]
}

jest.mock('@/providers/trpc-provider', () => ({
  trpc: {
    jobs: {
      getBySlug: {
        useQuery: () => ({
          data: mockJobData,
          isLoading: false,
          error: null
        })
      },
      getAll: {
        useQuery: () => ({
          data: mockSimilarJobs,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

// Mock analytics hooks
jest.mock('@/hooks/use-analytics', () => ({
  useJobAnalytics: () => ({
    trackJobInteraction: jest.fn(),
    trackJobApplication: jest.fn(),
    trackJobSave: jest.fn(),
    trackJobShare: jest.fn()
  })
}))

describe('JobDetailPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders job details correctly', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText(mockJobData.title)).toBeInTheDocument()
    })
    
    expect(screen.getByText(mockJobData.company.name)).toBeInTheDocument()
    expect(screen.getByText(mockJobData.location)).toBeInTheDocument()
    expect(screen.getByText(mockJobData.description)).toBeInTheDocument()
  })
  
  it('displays salary information', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/\$300,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$450,000/)).toBeInTheDocument()
    })
  })
  
  it('shows job requirements and benefits', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      mockJobData.requirements.forEach(requirement => {
        expect(screen.getByText(requirement)).toBeInTheDocument()
      })
      
      mockJobData.benefits.forEach(benefit => {
        expect(screen.getByText(benefit)).toBeInTheDocument()
      })
    })
  })
  
  it('handles job application', async () => {
    const user = userEvent.setup()
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /apply now/i })).toBeInTheDocument()
    })
    
    const applyButton = screen.getByRole('button', { name: /apply now/i })
    await user.click(applyButton)
    
    // Should show application form or modal
    expect(screen.getByText(/application/i)).toBeInTheDocument()
  })
  
  it('handles job saving/bookmarking', async () => {
    const user = userEvent.setup()
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    // Button should update to show saved state
    expect(saveButton).toHaveTextContent(/saved/i)
  })
  
  it('handles job sharing', async () => {
    const user = userEvent.setup()
    
    // Mock navigator.share
    const mockShare = jest.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'share', {
      value: mockShare,
      writable: true
    })
    
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument()
    })
    
    const shareButton = screen.getByRole('button', { name: /share/i })
    await user.click(shareButton)
    
    expect(mockShare).toHaveBeenCalledWith({
      title: mockJobData.title,
      text: expect.any(String),
      url: expect.any(String)
    })
  })
  
  it('shows similar jobs section', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/similar jobs/i)).toBeInTheDocument()
    })
    
    // Should show similar job titles
    expect(screen.getByText('Family Medicine Physician')).toBeInTheDocument()
    expect(screen.getByText('Internal Medicine Physician')).toBeInTheDocument()
  })
  
  it('handles back navigation', async () => {
    const user = userEvent.setup()
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
    
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)
    
    expect(mockBack).toHaveBeenCalled()
  })
  
  it('displays job category and type badges', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      expect(screen.getByText(mockJobData.category)).toBeInTheDocument()
      expect(screen.getByText(/full time/i)).toBeInTheDocument()
    })
  })
  
  it('shows company logo when available', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      const companyLogo = screen.getByAltText(mockJobData.company.name)
      expect(companyLogo).toBeInTheDocument()
      expect(companyLogo).toHaveAttribute('src', mockJobData.company.logo)
    })
  })
  
  it('displays job posting and expiry dates', async () => {
    render(<JobDetailPage />)
    
    await waitFor(() => {
      // Should show when job was posted
      expect(screen.getByText(/posted/i)).toBeInTheDocument()
      
      // Should show when job expires if available
      if (mockJobData.expiresAt) {
        expect(screen.getByText(/expires/i)).toBeInTheDocument()
      }
    })
  })
  
  it('handles loading state', () => {
    // Mock loading state
    jest.doMock('@/providers/trpc-provider', () => ({
      trpc: {
        jobs: {
          getBySlug: {
            useQuery: () => ({
              data: null,
              isLoading: true,
              error: null
            })
          }
        }
      }
    }))
    
    render(<JobDetailPage />)
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })
  
  it('handles error state', () => {
    // Mock error state
    jest.doMock('@/providers/trpc-provider', () => ({
      trpc: {
        jobs: {
          getBySlug: {
            useQuery: () => ({
              data: null,
              isLoading: false,
              error: new Error('Job not found')
            })
          }
        }
      }
    }))
    
    render(<JobDetailPage />)
    
    expect(screen.getByText(/not found/i)).toBeInTheDocument()
  })
})