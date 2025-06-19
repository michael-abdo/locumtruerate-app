import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockJob } from '@/__tests__/utils/test-utils'
import AdminJobsPage from '@/app/admin/jobs/page'

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

// Mock job data for admin management
const mockAdminJobs = [
  createMockJob({ 
    id: '1', 
    title: 'Emergency Medicine Physician',
    status: 'PENDING',
    createdAt: '2024-01-15T10:00:00Z'
  }),
  createMockJob({ 
    id: '2', 
    title: 'Cardiology Specialist',
    status: 'ACTIVE',
    createdAt: '2024-01-14T15:30:00Z'
  }),
  createMockJob({ 
    id: '3', 
    title: 'Anesthesiologist',
    status: 'REJECTED',
    createdAt: '2024-01-13T09:15:00Z'
  })
]

const mockModerateJob = jest.fn()

jest.mock('@/providers/trpc-provider', () => ({
  trpc: {
    admin: {
      getAllJobs: {
        useQuery: () => ({
          data: mockAdminJobs,
          isLoading: false,
          error: null
        })
      },
      moderateJob: {
        useMutation: () => ({
          mutate: mockModerateJob,
          isLoading: false,
          error: null
        })
      }
    }
  }
}))

describe('AdminJobsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  it('renders admin jobs page with job listings', async () => {
    render(<AdminJobsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/manage jobs/i)).toBeInTheDocument()
      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()
      expect(screen.getByText('Cardiology Specialist')).toBeInTheDocument()
      expect(screen.getByText('Anesthesiologist')).toBeInTheDocument()
    })
  })

  it('displays job status badges', async () => {
    render(<AdminJobsPage />)
    
    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
      expect(screen.getByText(/active/i)).toBeInTheDocument()
      expect(screen.getByText(/rejected/i)).toBeInTheDocument()
    })
  })

  it('provides job filtering by status', async () => {
    const user = userEvent.setup()
    render(<AdminJobsPage />)
    
    // Filter by pending jobs
    const statusFilter = screen.getByLabelText(/filter by status/i)
    await user.selectOptions(statusFilter, 'PENDING')
    
    await waitFor(() => {
      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()
      expect(screen.queryByText('Cardiology Specialist')).not.toBeInTheDocument()
    })
  })
})