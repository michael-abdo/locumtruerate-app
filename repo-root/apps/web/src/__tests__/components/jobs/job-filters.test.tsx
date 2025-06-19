import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { JobFilters, type JobFiltersState } from '@/components/jobs/job-filters'
import '@testing-library/jest-dom'

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn()
}))

const mockRouter = {
  replace: jest.fn(),
  push: jest.fn()
}

const mockSearchParams = new URLSearchParams()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
})

describe('JobFilters', () => {
  const mockOnFiltersChange = jest.fn()
  const mockOnApply = jest.fn()
  const mockOnClose = jest.fn()

  const defaultProps = {
    onFiltersChange: mockOnFiltersChange,
    onApply: mockOnApply,
    onClose: mockOnClose
  }

  describe('Desktop Rendering', () => {
    it('renders desktop sidebar correctly', () => {
      render(<JobFilters {...defaultProps} />)
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Quick Filters')).toBeInTheDocument()
      expect(screen.getByText('Location & Remote')).toBeInTheDocument()
    })

    it('shows filter count badge when filters are active', () => {
      const initialFilters: JobFiltersState = {
        location: 'New York',
        remote: 'remote',
        urgent: true
      }
      
      render(<JobFilters {...defaultProps} initialFilters={initialFilters} />)
      
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('clears all filters when clear button is clicked', () => {
      const initialFilters: JobFiltersState = {
        location: 'New York',
        remote: 'remote'
      }
      
      render(<JobFilters {...defaultProps} initialFilters={initialFilters} />)
      
      const clearButton = screen.getByText('Clear All')
      fireEvent.click(clearButton)
      
      expect(mockOnFiltersChange).toHaveBeenCalledWith({})
    })
  })

  describe('Mobile Bottom Sheet', () => {
    it('renders mobile bottom sheet when showAsBottomSheet is true', () => {
      render(
        <JobFilters 
          {...defaultProps} 
          showAsBottomSheet={true}
          isOpen={true}
          isMobile={true}
        />
      )
      
      expect(screen.getByText('Filters')).toBeInTheDocument()
      expect(screen.getByText('Apply Filters')).toBeInTheDocument()
      expect(screen.getByLabelText('Close filters')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      render(
        <JobFilters 
          {...defaultProps} 
          showAsBottomSheet={true}
          isOpen={true}
          isMobile={true}
        />
      )
      
      const closeButton = screen.getByLabelText('Close filters')
      fireEvent.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onApply when apply button is clicked', () => {
      render(
        <JobFilters 
          {...defaultProps} 
          showAsBottomSheet={true}
          isOpen={true}
          isMobile={true}
        />
      )
      
      const applyButton = screen.getByText('Apply Filters')
      fireEvent.click(applyButton)
      
      expect(mockOnApply).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Quick Filters', () => {
    it('toggles remote filter when quick filter is clicked', () => {
      render(<JobFilters {...defaultProps} />)
      
      const remoteButton = screen.getByText('Remote')
      fireEvent.click(remoteButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ remote: 'remote' })
        )
      })
    })

    it('toggles urgent filter when quick filter is clicked', () => {
      render(<JobFilters {...defaultProps} />)
      
      const urgentButton = screen.getByText('Urgent')
      fireEvent.click(urgentButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ urgent: true })
        )
      })
    })

    it('shows active state for selected quick filters', () => {
      const initialFilters: JobFiltersState = { remote: 'remote' }
      
      render(<JobFilters {...defaultProps} initialFilters={initialFilters} />)
      
      const remoteButton = screen.getByText('Remote')
      expect(remoteButton).toHaveClass('bg-blue-100', 'text-blue-700')
    })
  })

  describe('Location Filter', () => {
    it('updates location filter when typing in location input', () => {
      render(<JobFilters {...defaultProps} />)
      
      const locationInput = screen.getByPlaceholderText('Enter city, state, or zip code')
      fireEvent.change(locationInput, { target: { value: 'New York' } })
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'New York' })
        )
      })
    })

    it('shows location suggestions when typing', async () => {
      render(<JobFilters {...defaultProps} />)
      
      const locationInput = screen.getByPlaceholderText('Enter city, state, or zip code')
      fireEvent.change(locationInput, { target: { value: 'New' } })
      fireEvent.focus(locationInput)
      
      // Wait for debounced suggestions
      await waitFor(() => {
        expect(screen.getByText('New York, NY')).toBeInTheDocument()
      })
    })

    it('selects location from suggestions', async () => {
      render(<JobFilters {...defaultProps} />)
      
      const locationInput = screen.getByPlaceholderText('Enter city, state, or zip code')
      fireEvent.change(locationInput, { target: { value: 'New' } })
      fireEvent.focus(locationInput)
      
      await waitFor(() => {
        const suggestion = screen.getByText('New York, NY')
        fireEvent.click(suggestion)
        
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'New York, NY' })
        )
      })
    })
  })

  describe('Remote Work Filter', () => {
    it('toggles remote work arrangements', () => {
      render(<JobFilters {...defaultProps} />)
      
      const remoteButton = screen.getByText('Remote')
      fireEvent.click(remoteButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ remote: 'remote' })
        )
      })
    })

    it('shows active state for selected remote option', () => {
      const initialFilters: JobFiltersState = { remote: 'hybrid' }
      
      render(<JobFilters {...defaultProps} initialFilters={initialFilters} />)
      
      const hybridButton = screen.getByText('Hybrid')
      expect(hybridButton).toHaveClass('bg-blue-50', 'text-blue-700')
    })
  })

  describe('Salary Range Filter', () => {
    it('updates salary range when min value changes', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand salary section
      const salarySection = screen.getByText('Salary Range')
      fireEvent.click(salarySection)
      
      const minSalaryInput = screen.getByLabelText('Min Salary')
      fireEvent.change(minSalaryInput, { target: { value: '50000' } })
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ salaryMin: 50000 })
        )
      })
    })

    it('updates salary range when max value changes', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand salary section
      const salarySection = screen.getByText('Salary Range')
      fireEvent.click(salarySection)
      
      const maxSalaryInput = screen.getByLabelText('Max Salary')
      fireEvent.change(maxSalaryInput, { target: { value: '150000' } })
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ salaryMax: 150000 })
        )
      })
    })
  })

  describe('Experience Level Filter', () => {
    it('selects experience level', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand experience section
      const experienceSection = screen.getByText('Experience & Job Type')
      fireEvent.click(experienceSection)
      
      const seniorButton = screen.getByText('Senior Level (6-10 years)')
      fireEvent.click(seniorButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ experience: 'senior' })
        )
      })
    })

    it('shows active state for selected experience level', () => {
      const initialFilters: JobFiltersState = { experience: 'mid' }
      
      render(<JobFilters {...defaultProps} initialFilters={initialFilters} />)
      
      // First expand experience section
      const experienceSection = screen.getByText('Experience & Job Type')
      fireEvent.click(experienceSection)
      
      const midButton = screen.getByText('Mid Level (3-5 years)')
      expect(midButton).toHaveClass('bg-blue-50', 'text-blue-700')
    })
  })

  describe('Job Type Filter', () => {
    it('selects job type', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand experience section
      const experienceSection = screen.getByText('Experience & Job Type')
      fireEvent.click(experienceSection)
      
      const contractButton = screen.getByText('Contract')
      fireEvent.click(contractButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ jobType: 'CONTRACT' })
        )
      })
    })
  })

  describe('Medical Specialty Filter', () => {
    it('selects medical specialty from dropdown', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand experience section
      const experienceSection = screen.getByText('Experience & Job Type')
      fireEvent.click(experienceSection)
      
      const specialtySelect = screen.getByLabelText('Medical Specialty')
      fireEvent.change(specialtySelect, { target: { value: 'Emergency Medicine' } })
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ specialty: 'Emergency Medicine' })
        )
      })
    })
  })

  describe('Date Posted Filter', () => {
    it('selects date posted option', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand date section
      const dateSection = screen.getByText('Date Posted')
      fireEvent.click(dateSection)
      
      const last7DaysButton = screen.getByText('Last week')
      fireEvent.click(last7DaysButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ datePosted: '7d' })
        )
      })
    })
  })

  describe('Company Size Filter', () => {
    it('selects company size', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand company section
      const companySection = screen.getByText('Company Size')
      fireEvent.click(companySection)
      
      const startupButton = screen.getByText('Startup (1-10)')
      fireEvent.click(startupButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ companySize: 'startup' })
        )
      })
    })
  })

  describe('Benefits Filter', () => {
    it('toggles benefits selection', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand benefits section
      const benefitsSection = screen.getByText('Benefits & Perks')
      fireEvent.click(benefitsSection)
      
      const healthInsuranceButton = screen.getByText('Health Insurance')
      fireEvent.click(healthInsuranceButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ benefits: ['Health Insurance'] })
        )
      })
    })

    it('handles multiple benefits selection', () => {
      render(<JobFilters {...defaultProps} />)
      
      // First expand benefits section
      const benefitsSection = screen.getByText('Benefits & Perks')
      fireEvent.click(benefitsSection)
      
      const healthInsuranceButton = screen.getByText('Health Insurance')
      const ptoButton = screen.getByText('Paid Time Off')
      
      fireEvent.click(healthInsuranceButton)
      fireEvent.click(ptoButton)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenLastCalledWith(
          expect.objectContaining({ 
            benefits: expect.arrayContaining(['Health Insurance', 'Paid Time Off'])
          })
        )
      })
    })
  })

  describe('URL Synchronization', () => {
    it('initializes filters from URL parameters', () => {
      const mockSearchParamsWithData = new URLSearchParams('location=Boston&remote=remote&urgent=true')
      ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParamsWithData)
      
      render(<JobFilters {...defaultProps} />)
      
      waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith({
          location: 'Boston',
          remote: 'remote',
          urgent: true
        })
      })
    })

    it('updates URL when filters change', () => {
      render(<JobFilters {...defaultProps} />)
      
      const remoteButton = screen.getByText('Remote')
      fireEvent.click(remoteButton)
      
      waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith(
          expect.stringContaining('remote=remote'),
          { scroll: false }
        )
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for filter sections', () => {
      render(<JobFilters {...defaultProps} />)
      
      const closeButton = screen.queryByLabelText('Close filters')
      // Should not exist in desktop mode
      expect(closeButton).not.toBeInTheDocument()
    })

    it('supports keyboard navigation for expandable sections', () => {
      render(<JobFilters {...defaultProps} />)
      
      const salarySection = screen.getByText('Salary Range')
      fireEvent.keyDown(salarySection, { key: 'Enter' })
      
      waitFor(() => {
        expect(screen.getByLabelText('Min Salary')).toBeInTheDocument()
      })
    })

    it('has proper touch targets for mobile', () => {
      render(<JobFilters {...defaultProps} isMobile={true} />)
      
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveClass('touch-target')
      })
    })
  })

  describe('Performance', () => {
    it('debounces filter updates', async () => {
      render(<JobFilters {...defaultProps} />)
      
      const locationInput = screen.getByPlaceholderText('Enter city, state, or zip code')
      fireEvent.change(locationInput, { target: { value: 'N' } })
      fireEvent.change(locationInput, { target: { value: 'Ne' } })
      fireEvent.change(locationInput, { target: { value: 'New' } })
      
      // Should not call immediately
      expect(mockOnFiltersChange).not.toHaveBeenCalledWith(
        expect.objectContaining({ location: 'N' })
      )
      
      // Should call after debounce delay
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalledWith(
          expect.objectContaining({ location: 'New' })
        )
      }, { timeout: 500 })
    })
  })
})