import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { JobFilters, type JobFiltersState } from './job-filters'

const meta: Meta<typeof JobFilters> = {
  title: 'Components/Jobs/JobFilters',
  component: JobFilters,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A mobile-optimized job filters component that supports both desktop sidebar and mobile bottom sheet patterns. Features include location autocomplete, salary range slider, specialty selection, and URL synchronization.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    isMobile: {
      control: 'boolean',
      description: 'Whether to use mobile-optimized layout'
    },
    showAsBottomSheet: {
      control: 'boolean',
      description: 'Whether to show as a mobile bottom sheet'
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the bottom sheet is open (mobile only)'
    }
  }
}

export default meta
type Story = StoryObj<typeof JobFilters>

// Mock router for stories
const mockRouter = {
  replace: () => {},
  push: () => {}
}

const mockSearchParams = new URLSearchParams()

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams
}))

// Interactive wrapper component
const InteractiveJobFilters = (args: any) => {
  const [filters, setFilters] = useState<JobFiltersState>(args.initialFilters || {})
  
  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    console.log('Filters changed:', newFilters)
  }
  
  const handleApply = (filters: JobFiltersState) => {
    console.log('Apply filters:', filters)
  }
  
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-medium mb-2">Current Filters:</h3>
        <pre className="text-sm bg-white p-2 rounded overflow-auto">
          {JSON.stringify(filters, null, 2)}
        </pre>
      </div>
      
      <JobFilters
        {...args}
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApply}
      />
    </div>
  )
}

export const Default: Story = {
  render: (args) => <InteractiveJobFilters {...args} />,
  args: {
    isMobile: false,
    showAsBottomSheet: false
  }
}

export const WithInitialFilters: Story = {
  render: (args) => <InteractiveJobFilters {...args} />,
  args: {
    initialFilters: {
      location: 'New York, NY',
      remote: 'hybrid',
      specialty: 'Emergency Medicine',
      experience: 'senior',
      jobType: 'FULL_TIME',
      salaryMin: 80000,
      salaryMax: 150000,
      datePosted: '7d',
      companySize: 'medium',
      benefits: ['Health Insurance', 'Paid Time Off', 'Remote Work'],
      urgent: true,
      featured: false
    }
  }
}

export const MobileDesktop: Story = {
  render: (args) => <InteractiveJobFilters {...args} />,
  args: {
    isMobile: true,
    showAsBottomSheet: false
  }
}

export const MobileBottomSheet: Story = {
  render: (args) => (
    <div className="h-96 relative bg-gray-100 p-4">
      <p className="text-center text-gray-600 mb-4">
        Mobile bottom sheet view (would overlay content)
      </p>
      <InteractiveJobFilters {...args} />
    </div>
  ),
  args: {
    isMobile: true,
    showAsBottomSheet: true,
    isOpen: true
  }
}

export const MobileBottomSheetClosed: Story = {
  render: (args) => (
    <div className="h-96 relative bg-gray-100 p-4">
      <p className="text-center text-gray-600 mb-4">
        Mobile bottom sheet closed (would slide up from bottom)
      </p>
      <InteractiveJobFilters {...args} />
    </div>
  ),
  args: {
    isMobile: true,
    showAsBottomSheet: true,
    isOpen: false
  }
}

export const DesktopSidebar: Story = {
  render: (args) => (
    <div className="flex gap-6">
      <div className="w-80">
        <InteractiveJobFilters {...args} />
      </div>
      <div className="flex-1 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Job Results</h3>
        <p className="text-gray-600">
          This is where job results would be displayed. The filters sidebar
          would control what jobs are shown here.
        </p>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium">Sample Job {i + 1}</h4>
              <p className="text-sm text-gray-600">Sample Company</p>
              <p className="text-sm text-gray-500">New York, NY • Remote</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
  args: {
    isMobile: false,
    showAsBottomSheet: false
  }
}

export const WithManyActiveFilters: Story = {
  render: (args) => <InteractiveJobFilters {...args} />,
  args: {
    initialFilters: {
      location: 'San Francisco, CA',
      remote: 'remote',
      specialty: 'Cardiology',
      experience: 'executive',
      jobType: 'CONTRACT',
      salaryMin: 120000,
      salaryMax: 200000,
      datePosted: '24h',
      companySize: 'large',
      benefits: [
        'Health Insurance',
        'Dental Insurance',
        'Vision Insurance',
        'Retirement Plan',
        'Paid Time Off',
        'Professional Development',
        'Malpractice Insurance'
      ],
      urgent: true,
      featured: true
    }
  }
}

export const ResponsiveDemo: Story = {
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium mb-4">Desktop View</h3>
        <div className="border rounded-lg p-4">
          <InteractiveJobFilters {...args} isMobile={false} showAsBottomSheet={false} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Mobile View</h3>
        <div className="max-w-sm mx-auto border rounded-lg p-4">
          <InteractiveJobFilters {...args} isMobile={true} showAsBottomSheet={false} />
        </div>
      </div>
    </div>
  ),
  args: {
    initialFilters: {
      location: 'Boston, MA',
      remote: 'hybrid',
      specialty: 'Internal Medicine',
      urgent: true
    }
  }
}

// Accessibility story
export const AccessibilityDemo: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Accessibility Features:</h3>
        <ul className="text-sm space-y-1">
          <li>• Keyboard navigation support</li>
          <li>• Screen reader optimized</li>
          <li>• Touch-friendly targets (44px minimum)</li>
          <li>• High contrast support</li>
          <li>• Focus indicators</li>
          <li>• ARIA labels and roles</li>
        </ul>
      </div>
      <InteractiveJobFilters {...args} />
    </div>
  ),
  args: {
    initialFilters: {
      location: 'Chicago, IL',
      experience: 'mid'
    }
  }
}

// Performance story
export const PerformanceDemo: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Performance Features:</h3>
        <ul className="text-sm space-y-1">
          <li>• Debounced filter updates (300ms)</li>
          <li>• Lazy loading for long lists</li>
          <li>• Virtualization ready</li>
          <li>• Minimal re-renders</li>
          <li>• URL synchronization</li>
          <li>• Optimized for 60fps</li>
        </ul>
      </div>
      <InteractiveJobFilters {...args} />
    </div>
  ),
  args: {}
}