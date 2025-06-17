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
  \n  it('displays job status badges', async () => {\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/pending/i)).toBeInTheDocument()\n      expect(screen.getByText(/active/i)).toBeInTheDocument()\n      expect(screen.getByText(/rejected/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('provides job filtering by status', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    // Filter by pending jobs\n    const statusFilter = screen.getByLabelText(/filter by status/i)\n    await user.selectOptions(statusFilter, 'PENDING')\n    \n    await waitFor(() => {\n      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()\n      expect(screen.queryByText('Cardiology Specialist')).not.toBeInTheDocument()\n    })\n  })\n  \n  it('allows searching jobs by title or company', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const searchInput = screen.getByPlaceholderText(/search jobs/i)\n    await user.type(searchInput, 'emergency')\n    \n    await waitFor(() => {\n      expect(screen.getByText('Emergency Medicine Physician')).toBeInTheDocument()\n      expect(screen.queryByText('Cardiology Specialist')).not.toBeInTheDocument()\n    })\n  })\n  \n  it('handles job approval', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      const approveButton = screen.getByRole('button', { name: /approve.*emergency medicine/i })\n      expect(approveButton).toBeInTheDocument()\n    })\n    \n    const approveButton = screen.getByRole('button', { name: /approve.*emergency medicine/i })\n    await user.click(approveButton)\n    \n    expect(mockModerateJob).toHaveBeenCalledWith({\n      jobId: '1',\n      action: 'approve',\n      reason: undefined\n    })\n  })\n  \n  it('handles job rejection with reason', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      const rejectButton = screen.getByRole('button', { name: /reject.*emergency medicine/i })\n      expect(rejectButton).toBeInTheDocument()\n    })\n    \n    const rejectButton = screen.getByRole('button', { name: /reject.*emergency medicine/i })\n    await user.click(rejectButton)\n    \n    // Should open rejection reason modal\n    await waitFor(() => {\n      expect(screen.getByText(/rejection reason/i)).toBeInTheDocument()\n    })\n    \n    const reasonTextarea = screen.getByLabelText(/reason for rejection/i)\n    await user.type(reasonTextarea, 'Incomplete job description')\n    \n    const confirmRejectButton = screen.getByRole('button', { name: /confirm rejection/i })\n    await user.click(confirmRejectButton)\n    \n    expect(mockModerateJob).toHaveBeenCalledWith({\n      jobId: '1',\n      action: 'reject',\n      reason: 'Incomplete job description'\n    })\n  })\n  \n  it('shows job details in expandable rows', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const expandButton = screen.getByRole('button', { name: /expand.*emergency medicine/i })\n    await user.click(expandButton)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/job description/i)).toBeInTheDocument()\n      expect(screen.getByText(/requirements/i)).toBeInTheDocument()\n      expect(screen.getByText(/benefits/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('provides bulk actions for multiple jobs', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    // Select multiple jobs\n    const checkboxes = screen.getAllByRole('checkbox', { name: /select job/i })\n    await user.click(checkboxes[0])\n    await user.click(checkboxes[1])\n    \n    // Bulk actions should become available\n    expect(screen.getByRole('button', { name: /bulk approve/i })).toBeInTheDocument()\n    expect(screen.getByRole('button', { name: /bulk reject/i })).toBeInTheDocument()\n  })\n  \n  it('displays job posting analytics', async () => {\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/total views/i)).toBeInTheDocument()\n      expect(screen.getByText(/applications received/i)).toBeInTheDocument()\n      expect(screen.getByText(/posting date/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('allows editing job details', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const editButton = screen.getByRole('button', { name: /edit.*emergency medicine/i })\n    await user.click(editButton)\n    \n    expect(mockPush).toHaveBeenCalledWith('/admin/jobs/1/edit')\n  })\n  \n  it('shows job application management', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const applicationsButton = screen.getByRole('button', { name: /view applications.*emergency medicine/i })\n    await user.click(applicationsButton)\n    \n    expect(mockPush).toHaveBeenCalledWith('/admin/jobs/1/applications')\n  })\n  \n  it('provides job statistics and metrics', async () => {\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/pending approval.*1/i)).toBeInTheDocument()\n      expect(screen.getByText(/active jobs.*1/i)).toBeInTheDocument()\n      expect(screen.getByText(/total jobs.*3/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('handles job sorting by different criteria', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const sortSelect = screen.getByLabelText(/sort by/i)\n    await user.selectOptions(sortSelect, 'created-desc')\n    \n    // Jobs should be reordered (most recent first)\n    const jobTitles = screen.getAllByText(/physician|specialist|anesthesiologist/i)\n    expect(jobTitles[0]).toHaveTextContent('Emergency Medicine Physician')\n  })\n  \n  it('shows job flagging and reporting', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const flagButton = screen.getByRole('button', { name: /flag.*emergency medicine/i })\n    await user.click(flagButton)\n    \n    // Should open flagging modal\n    await waitFor(() => {\n      expect(screen.getByText(/flag job/i)).toBeInTheDocument()\n      expect(screen.getByText(/spam/i)).toBeInTheDocument()\n      expect(screen.getByText(/inappropriate content/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('provides job expiration management', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const extendButton = screen.getByRole('button', { name: /extend.*emergency medicine/i })\n    await user.click(extendButton)\n    \n    // Should open extension modal\n    await waitFor(() => {\n      expect(screen.getByText(/extend job posting/i)).toBeInTheDocument()\n      expect(screen.getByLabelText(/new expiry date/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('handles job duplication for reposting', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const duplicateButton = screen.getByRole('button', { name: /duplicate.*emergency medicine/i })\n    await user.click(duplicateButton)\n    \n    expect(mockPush).toHaveBeenCalledWith('/admin/jobs/new?duplicate=1')\n  })\n  \n  it('shows job history and audit trail', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const historyButton = screen.getByRole('button', { name: /history.*emergency medicine/i })\n    await user.click(historyButton)\n    \n    // Should show history modal\n    await waitFor(() => {\n      expect(screen.getByText(/job history/i)).toBeInTheDocument()\n      expect(screen.getByText(/created by/i)).toBeInTheDocument()\n      expect(screen.getByText(/status changes/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('provides export functionality for job data', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    const exportButton = screen.getByRole('button', { name: /export jobs/i })\n    await user.click(exportButton)\n    \n    // Should show export options\n    await waitFor(() => {\n      expect(screen.getByText(/export format/i)).toBeInTheDocument()\n      expect(screen.getByText(/csv/i)).toBeInTheDocument()\n      expect(screen.getByText(/excel/i)).toBeInTheDocument()\n    })\n  })\n  \n  it('handles loading and error states', () => {\n    // Test loading state\n    jest.doMock('@/providers/trpc-provider', () => ({\n      trpc: {\n        admin: {\n          getAllJobs: {\n            useQuery: () => ({\n              data: null,\n              isLoading: true,\n              error: null\n            })\n          }\n        }\n      }\n    }))\n    \n    render(<AdminJobsPage />)\n    \n    expect(screen.getByTestId('loading')).toBeInTheDocument()\n  })\n  \n  it('handles pagination for large job lists', async () => {\n    const user = userEvent.setup()\n    render(<AdminJobsPage />)\n    \n    // Assuming pagination controls exist\n    const nextButton = screen.getByRole('button', { name: /next page/i })\n    await user.click(nextButton)\n    \n    // Should load next page of jobs\n    expect(screen.getByText(/page 2/i)).toBeInTheDocument()\n  })\n  \n  it('shows job performance metrics', async () => {\n    render(<AdminJobsPage />)\n    \n    await waitFor(() => {\n      expect(screen.getByText(/view count/i)).toBeInTheDocument()\n      expect(screen.getByText(/application rate/i)).toBeInTheDocument()\n      expect(screen.getByText(/time to fill/i)).toBeInTheDocument()\n    })\n  })\n})"