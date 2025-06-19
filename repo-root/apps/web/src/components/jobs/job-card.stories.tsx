import type { Meta, StoryObj } from '@storybook/react'
import { JobCard } from './job-card'
import type { JobCardData } from '@locumtruerate/types'

const meta = {
  title: 'Components/Jobs/JobCard',
  component: JobCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Mobile-optimized job card component with cross-platform compatibility.

## Features
- **Mobile-first design** with touch-friendly interactions
- **Native share API** support with fallback
- **Expandable content** for better mobile UX
- **Swipe gestures** ready (can be added with gesture libraries)
- **Accessibility** compliant with ARIA labels and keyboard navigation
- **Performance optimized** with lazy loading and minimal re-renders

## Usage
\`\`\`tsx
import { JobCard } from '@/components/jobs'

function JobList() {
  return (
    <JobCard 
      job={jobData}
      onApply={(id) => handleApply(id)}
      onSave={(id, saved) => handleSave(id, saved)}
      onShare={(id) => handleShare(id)}
    />
  )
}
\`\`\`
        `
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    job: {
      description: 'Job data to display'
    },
    onApply: {
      description: 'Callback when apply button is clicked'
    },
    onSave: {
      description: 'Callback when save button is toggled'
    },
    onShare: {
      description: 'Callback when share button is clicked (fallback only)'
    },
    className: {
      description: 'Additional CSS classes'
    },
    isLoading: {
      description: 'Show loading state'
    }
  }
} satisfies Meta<typeof JobCard>

export default meta
type Story = StoryObj<typeof meta>

// Base job data
const baseJob: JobCardData = {
  id: '1',
  title: 'Emergency Medicine Physician',
  companyName: 'St. Mary\'s Hospital',
  companyLogo: 'https://via.placeholder.com/48',
  location: 'Chicago, IL',
  isRemote: false,
  salaryRange: {
    min: 300,
    max: 400,
    currency: 'USD',
    period: 'hourly'
  },
  type: 'CONTRACT',
  category: 'OTHER',
  tags: ['Emergency Medicine', 'Night Shifts', 'Level 1 Trauma', 'Board Certified'],
  specialty: 'Emergency Medicine',
  experienceLevel: '5+ years',
  publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  isUrgent: true,
  isFeatured: false,
  applicationCount: 12,
  descriptionPreview: 'Seeking experienced Emergency Medicine physician for immediate placement at Level 1 trauma center. Must be board certified with active state license. Competitive hourly rates with flexible scheduling options.',
  viewCount: 234
}

// Default story
export const Default: Story = {
  args: {
    job: baseJob,
    onApply: (id) => console.log('Apply clicked:', id),
    onSave: (id, saved) => console.log('Save toggled:', id, saved),
    onShare: (id) => console.log('Share clicked:', id)
  }
}

// Featured job
export const Featured: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      isFeatured: true,
      isUrgent: false
    }
  }
}

// Remote job
export const Remote: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      title: 'Telemedicine Psychiatrist',
      companyName: 'TeleHealth Solutions',
      location: 'Nationwide',
      isRemote: true,
      type: 'PART_TIME',
      specialty: 'Psychiatry',
      tags: ['Psychiatry', 'Telemedicine', 'Flexible Schedule', 'Work from Home'],
      isUrgent: false,
      descriptionPreview: 'Remote psychiatrist position with flexible scheduling. Provide mental health services via our secure telehealth platform.'
    }
  }
}

// Full-time position
export const FullTime: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      title: 'Hospitalist - Nocturnist',
      type: 'FULL_TIME',
      salary: '$250K - $300K/year',
      salaryRange: undefined,
      tags: ['Internal Medicine', 'Hospitalist', 'Nocturnist', '7 on/7 off'],
      specialty: 'Internal Medicine',
      experienceLevel: '3+ years'
    }
  }
}

// Job expiring soon
export const ExpiringSoon: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      isUrgent: true
    }
  }
}

// No company logo
export const NoLogo: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      companyLogo: undefined
    }
  }
}

// Minimal information
export const Minimal: Story = {
  args: {
    ...Default.args,
    job: {
      ...baseJob,
      salary: 'Competitive',
      salaryRange: undefined,
      type: undefined,
      category: undefined,
      specialty: undefined,
      experienceLevel: undefined,
      tags: [],
      isUrgent: false,
      isFeatured: false
    }
  }
}

// Loading state
export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true
  }
}

// Mobile viewport
export const Mobile: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
}

// Tablet viewport
export const Tablet: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    }
  }
}

// In a list
export const InList: Story = {
  render: (args) => (
    <div className="max-w-2xl space-y-4">
      <JobCard {...args} job={baseJob} />
      <JobCard {...args} job={{
        ...baseJob,
        id: '2',
        title: 'Hospitalist',
        isFeatured: true,
        isUrgent: false
      }} />
      <JobCard {...args} job={{
        ...baseJob,
        id: '3',
        title: 'Telemedicine Provider',
        isRemote: true,
        type: 'PART_TIME'
      }} />
    </div>
  ),
  args: Default.args
}

// Dark mode
export const DarkMode: Story = {
  args: Default.args,
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    )
  ]
}