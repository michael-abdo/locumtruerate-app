import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JobCard } from '@/components/jobs/job-card'
import { JobCardData, JobType, JobCategory } from '@locumtruerate/types'

// Mock job data for testing
const mockJob: JobCardData = {
  id: 'test-job-1',
  title: 'Emergency Medicine Physician',
  companyName: 'Test Hospital',
  companyLogo: '/test-logo.png',
  location: 'Chicago, IL',
  isRemote: false,
  salaryRange: {
    min: 300,
    max: 400,
    currency: 'USD',
    period: 'hourly'
  },
  type: JobType.CONTRACT,
  category: JobCategory.OTHER,
  tags: ['Emergency Medicine', 'Night Shifts'],
  specialty: 'Emergency Medicine',
  experienceLevel: '5+ years',
  publishedAt: new Date('2024-01-15'),
  expiresAt: new Date('2024-02-15'),
  isUrgent: true,
  isFeatured: false,
  applicationCount: 12,
  descriptionPreview: 'Test job description preview text.',
  viewCount: 100
}

// Mock handlers
const mockHandlers = {
  onApply: jest.fn(),
  onSave: jest.fn(),
  onShare: jest.fn()
}

describe('JobCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock navigator.share
    Object.defineProperty(window, 'isSecureContext', {
      writable: true,
      value: true
    })
  })

  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    expect(screen.getByText(mockJob.title)).toBeInTheDocument()
    expect(screen.getByText(mockJob.companyName)).toBeInTheDocument()
    expect(screen.getByText(mockJob.location)).toBeInTheDocument()
    expect(screen.getByText('$300 - $400/hourly')).toBeInTheDocument()
    expect(screen.getByText(mockJob.descriptionPreview)).toBeInTheDocument()
  })

  it('displays badges correctly', () => {
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    expect(screen.getByText('Urgent')).toBeInTheDocument()
    expect(screen.getByText('CONTRACT')).toBeInTheDocument()
    expect(screen.getByText('Emergency Medicine')).toBeInTheDocument()
    expect(screen.getByText('5+ years')).toBeInTheDocument()
  })

  it('handles save functionality', async () => {
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    const saveButton = screen.getByLabelText('Save job')
    await user.click(saveButton)
    
    expect(mockHandlers.onSave).toHaveBeenCalledWith(mockJob.id, true)
    expect(screen.getByLabelText('Unsave job')).toBeInTheDocument()
  })

  it('handles apply functionality', async () => {
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    const applyButton = screen.getByText('Quick Apply')
    await user.click(applyButton)
    
    expect(mockHandlers.onApply).toHaveBeenCalledWith(mockJob.id)
  })

  it('handles native share when available', async () => {
    const mockShare = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: mockShare
    })
    
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    const shareButton = screen.getByLabelText('Share job')
    await user.click(shareButton)
    
    expect(mockShare).toHaveBeenCalledWith({
      title: mockJob.title,
      text: `Check out this ${mockJob.title} position at ${mockJob.companyName}`,
      url: expect.stringContaining(`/jobs/${mockJob.id}`)
    })
  })

  it('falls back to custom share when native share not available', async () => {
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: undefined
    })
    
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    const shareButton = screen.getByLabelText('Share job')
    await user.click(shareButton)
    
    expect(mockHandlers.onShare).toHaveBeenCalledWith(mockJob.id)
  })

  it('expands and collapses description', async () => {
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    // Initially collapsed
    expect(screen.getByText('Show more')).toBeInTheDocument()
    expect(screen.queryByText('12 applicants')).not.toBeInTheDocument()
    
    // Expand
    await user.click(screen.getByText('Show more'))
    expect(screen.getByText('Show less')).toBeInTheDocument()
    expect(screen.getByText('12 applicants')).toBeInTheDocument()
    expect(screen.getByText('100 views')).toBeInTheDocument()
    
    // Collapse
    await user.click(screen.getByText('Show less'))
    expect(screen.getByText('Show more')).toBeInTheDocument()
    expect(screen.queryByText('12 applicants')).not.toBeInTheDocument()
  })

  it('shows expiry warning when job expires soon', () => {
    const nearExpiryJob = {
      ...mockJob,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
    }
    
    render(<JobCard job={nearExpiryJob} {...mockHandlers} />)
    
    // Expand to see the warning
    fireEvent.click(screen.getByText('Show more'))
    
    expect(screen.getByText(/Expires in \d days/)).toBeInTheDocument()
  })

  it('displays remote badge when job is remote', () => {
    const remoteJob = {
      ...mockJob,
      isRemote: true,
      location: 'Anywhere'
    }
    
    render(<JobCard job={remoteJob} {...mockHandlers} />)
    
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    const header = screen.getByRole('button', { name: /Job listing/ })
    
    // Focus on header
    header.focus()
    expect(header).toHaveFocus()
    
    // Press Enter to expand
    await user.keyboard('{Enter}')
    expect(screen.getByText('Show less')).toBeInTheDocument()
    
    // Press Space to collapse
    await user.keyboard(' ')
    expect(screen.getByText('Show more')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<JobCard job={mockJob} isLoading={true} {...mockHandlers} />)
    
    const card = screen.getByRole('article')
    expect(card).toHaveClass('opacity-50', 'pointer-events-none')
  })

  it('formats dates correctly', () => {
    const testCases = [
      { date: new Date(), expected: 'Today' },
      { date: new Date(Date.now() - 24 * 60 * 60 * 1000), expected: 'Yesterday' },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), expected: '3 days ago' },
      { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), expected: '2 weeks ago' },
      { date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), expected: '1 months ago' }
    ]
    
    testCases.forEach(({ date, expected }) => {
      const jobWithDate = { ...mockJob, publishedAt: date }
      const { rerender } = render(<JobCard job={jobWithDate} {...mockHandlers} />)
      expect(screen.getByText(expected)).toBeInTheDocument()
      rerender(<div />)
    })
  })

  it('has proper accessibility attributes', () => {
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    // Check ARIA labels
    expect(screen.getByLabelText(`Job listing: ${mockJob.title} at ${mockJob.companyName}`)).toBeInTheDocument()
    expect(screen.getByLabelText('Save job')).toBeInTheDocument()
    expect(screen.getByLabelText('Share job')).toBeInTheDocument()
    expect(screen.getByLabelText(`Apply for ${mockJob.title} at ${mockJob.companyName}`)).toBeInTheDocument()
    
    // Check expandable region
    const expandButton = screen.getByRole('button', { name: /Job listing/ })
    expect(expandButton).toHaveAttribute('aria-expanded', 'false')
  })

  it('displays all tags when expanded', async () => {
    const user = userEvent.setup()
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    // Tags should not be visible initially
    mockJob.tags.forEach(tag => {
      expect(screen.queryByText(tag, { selector: '.text-xs' })).not.toBeInTheDocument()
    })
    
    // Expand to see tags
    await user.click(screen.getByText('Show more'))
    
    // Now tags should be visible
    mockJob.tags.forEach(tag => {
      expect(screen.getByText(tag, { selector: '.text-xs' })).toBeInTheDocument()
    })
  })

  it('handles touch interactions correctly', () => {
    render(<JobCard job={mockJob} {...mockHandlers} />)
    
    // Check that touch target classes are applied
    const saveButton = screen.getByLabelText('Save job')
    expect(saveButton).toHaveClass('touch-target')
    
    const shareButton = screen.getByLabelText('Share job')
    expect(shareButton).toHaveClass('touch-target')
  })
})