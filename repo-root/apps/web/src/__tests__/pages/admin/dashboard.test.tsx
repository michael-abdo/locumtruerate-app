import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@/__tests__/utils/test-utils'
import AdminDashboard from '@/app/admin/dashboard/page'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush })
}))

// Mock Clerk with admin user
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'admin-user-id',
      firstName: 'Admin',
      lastName: 'User',
      publicMetadata: { role: 'admin' }
    }
  })
}))

// Mock tRPC with admin dashboard data
const mockDashboardStats = {
  users: {
    total: 1250,
    new: 45,
    active: 890
  },
  jobs: {
    total: 234,
    pending: 12,
    active: 189,
    filled: 33
  },
  applications: {
    total: 567,
    pending: 23,
    reviewed: 344,
    hired: 89
  },
  revenue: {
    monthly: 45000,
    total: 234000,
    growth: 12.5
  }
}

const mockRecentActivity = [
  {
    id: '1',
    type: 'job_posted',
    message: 'New job posted: Emergency Medicine Physician',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'Metro General Hospital'
  },
  {
    id: '2',
    type: 'application_submitted',
    message: 'Application submitted for Cardiology Position',
    timestamp: '2024-01-15T09:15:00Z',
    user: 'Dr. Sarah Johnson'
  }
]

jest.mock('@/providers/trpc-provider', () => ({
  trpc: {
    admin: {
      getDashboardStats: {
        useQuery: () => ({
          data: mockDashboardStats,
          isLoading: false,
          error: null
        })
      },
      getRecentActivity: {
        useQuery: () => ({
          data: mockRecentActivity,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders dashboard with main navigation', () => {
    render(<AdminDashboard />)
    
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument()
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
  
  it('displays key statistics cards', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      // User statistics
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText(/total users/i)).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText(/new users/i)).toBeInTheDocument()
      
      // Job statistics
      expect(screen.getByText('234')).toBeInTheDocument()
      expect(screen.getByText(/total jobs/i)).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText(/pending jobs/i)).toBeInTheDocument()
      
      // Application statistics
      expect(screen.getByText('567')).toBeInTheDocument()
      expect(screen.getByText(/total applications/i)).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      expect(screen.getByText(/pending applications/i)).toBeInTheDocument()
    })
  })
  
  it('shows revenue metrics', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('$45,000')).toBeInTheDocument()
      expect(screen.getByText(/monthly revenue/i)).toBeInTheDocument()
      expect(screen.getByText('$234,000')).toBeInTheDocument()
      expect(screen.getByText(/total revenue/i)).toBeInTheDocument()
      expect(screen.getByText('12.5%')).toBeInTheDocument()
      expect(screen.getByText(/growth/i)).toBeInTheDocument()
    })
  })
  
  it('displays recent activity feed', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
      expect(screen.getByText(/emergency medicine physician/i)).toBeInTheDocument()
      expect(screen.getByText(/metro general hospital/i)).toBeInTheDocument()
      expect(screen.getByText(/cardiology position/i)).toBeInTheDocument()
      expect(screen.getByText(/dr. sarah johnson/i)).toBeInTheDocument()
    })
  })
  
  it('handles navigation to different admin sections', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard />)
    
    // Click on jobs management
    const jobsLink = screen.getByRole('link', { name: /manage jobs/i })
    await user.click(jobsLink)
    
    expect(mockPush).toHaveBeenCalledWith('/admin/jobs')
  })
  
  it('shows quick action buttons', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard />)
    
    expect(screen.getByRole('button', { name: /approve pending jobs/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review applications/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /manage users/i })).toBeInTheDocument()
    
    // Test quick action
    const reviewButton = screen.getByRole('button', { name: /review applications/i })
    await user.click(reviewButton)
    
    expect(mockPush).toHaveBeenCalledWith('/admin/applications')
  })
  
  it('displays charts and graphs', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/user growth/i)).toBeInTheDocument()
      expect(screen.getByText(/job posting trends/i)).toBeInTheDocument()
      expect(screen.getByText(/application conversion/i)).toBeInTheDocument()
    })
  })
  
  it('handles loading state', () => {
    // Mock loading state
    jest.doMock('@/providers/trpc-provider', () => ({
      trpc: {
        admin: {
          getDashboardStats: {
            useQuery: () => ({
              data: null,
              isLoading: true,
              error: null
            })
          }
        }
      }
    }))
    
    render(<AdminDashboard />)
    
    expect(screen.getByTestId('loading')).toBeInTheDocument()
  })
  
  it('handles error state', () => {
    // Mock error state
    jest.doMock('@/providers/trpc-provider', () => ({
      trpc: {
        admin: {
          getDashboardStats: {
            useQuery: () => ({
              data: null,
              isLoading: false,
              error: new Error('Failed to load dashboard data')
            })
          }
        }
      }
    }))
    
    render(<AdminDashboard />)
    
    expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
  })
  
  it('shows notifications and alerts', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      // Should show alerts for pending items
      if (mockDashboardStats.jobs.pending > 10) {
        expect(screen.getByText(/pending jobs require attention/i)).toBeInTheDocument()
      }
      
      if (mockDashboardStats.applications.pending > 20) {
        expect(screen.getByText(/pending applications need review/i)).toBeInTheDocument()
      }
    })
  })
  
  it('allows filtering dashboard data by date range', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard />)
    
    // Open date range picker
    await user.click(screen.getByRole('button', { name: /date range/i }))
    
    // Select last 30 days
    await user.click(screen.getByText(/last 30 days/i))
    
    // Dashboard should update with filtered data
    await waitFor(() => {
      expect(screen.getByText(/last 30 days/i)).toBeInTheDocument()
    })
  })
  
  it('provides export functionality for dashboard data', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard />)
    
    const exportButton = screen.getByRole('button', { name: /export data/i })
    await user.click(exportButton)
    
    // Should show export options
    expect(screen.getByText(/export format/i)).toBeInTheDocument()
    expect(screen.getByText(/csv/i)).toBeInTheDocument()
    expect(screen.getByText(/excel/i)).toBeInTheDocument()
  })
  
  it('shows real-time updates indicator', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/last updated/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })
  })
  
  it('handles permission-based feature visibility', () => {
    render(<AdminDashboard />)
    
    // Admin should see all features
    expect(screen.getByRole('button', { name: /system settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /user management/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /financial reports/i })).toBeInTheDocument()
  })
  
  it('provides search functionality', async () => {
    const user = userEvent.setup()
    render(<AdminDashboard />)
    
    const searchInput = screen.getByPlaceholderText(/search users, jobs/i)
    await user.type(searchInput, 'emergency medicine')
    await user.keyboard('{Enter}')
    
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('search=emergency medicine')
    )
  })
  
  it('displays system health indicators', async () => {
    render(<AdminDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/system status/i)).toBeInTheDocument()
      expect(screen.getByText(/api response time/i)).toBeInTheDocument()
      expect(screen.getByText(/database health/i)).toBeInTheDocument()
    })
  })
})