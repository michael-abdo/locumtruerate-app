/**
 * ShareButton Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { ShareButton, ShareJobButton, ShareCalculationButton } from './ShareButton'

const meta: Meta<typeof ShareButton> = {
  title: 'Components/ShareButton',
  component: ShareButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A unified share button component with native share sheet integration for sharing jobs, calculations, and other content.',
      },
    },
  },
  argTypes: {
    data: {
      description: 'Share data object containing title, message, and optional URL',
    },
    icon: {
      control: 'text',
      description: 'Emoji or icon to display in the button',
    },
    label: {
      control: 'text',
      description: 'Button label text',
    },
    onShare: {
      action: 'shared',
      description: 'Callback fired when sharing succeeds',
    },
    onError: {
      action: 'error',
      description: 'Callback fired when sharing fails',
    },
  },
}

export default meta
type Story = StoryObj<typeof ShareButton>

// Basic ShareButton stories
export const Default: Story = {
  args: {
    data: {
      title: 'LocumTrueRate',
      message: 'Check out this amazing locum tenens platform!',
      url: 'https://locumtruerate.com',
    },
    onShare: action('share-success'),
    onError: action('share-error'),
  },
}

export const CustomIcon: Story = {
  args: {
    data: {
      title: 'Custom Share',
      message: 'Sharing with custom icon and label',
    },
    icon: '🔗',
    label: 'Copy Link',
    onShare: action('share-success'),
  },
}

export const WithoutURL: Story = {
  args: {
    data: {
      title: 'Text Only',
      message: 'This share action only includes text content without a URL.',
    },
    label: 'Share Text',
    onShare: action('share-success'),
  },
}

// ShareJobButton stories
const jobMeta: Meta<typeof ShareJobButton> = {
  title: 'Components/ShareJobButton',
  component: ShareJobButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Specialized share button for job postings with formatted job information.',
      },
    },
  },
}

export const JobButton: StoryObj<typeof ShareJobButton> = {
  render: (args) => <ShareJobButton {...args} />,
  args: {
    jobId: 'job-123',
    jobTitle: 'Emergency Medicine Physician',
    companyName: 'Regional Medical Center',
    salary: '$300k - $350k',
    location: 'Austin, TX',
  },
  parameters: {
    docs: {
      description: {
        story: 'Share button specifically designed for job postings with formatted job details.',
      },
    },
  },
}

export const JobButtonRemote: StoryObj<typeof ShareJobButton> = {
  render: (args) => <ShareJobButton {...args} />,
  args: {
    jobId: 'remote-job-456',
    jobTitle: 'Telemedicine Physician',
    companyName: 'Digital Health Solutions',
    location: 'Remote',
  },
  parameters: {
    docs: {
      description: {
        story: 'Job share button for remote positions without salary information.',
      },
    },
  },
}

// ShareCalculationButton stories
const calcMeta: Meta<typeof ShareCalculationButton> = {
  title: 'Components/ShareCalculationButton',
  component: ShareCalculationButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Share button for calculation results with formatted financial data.',
      },
    },
  },
}

export const ContractCalculation: StoryObj<typeof ShareCalculationButton> = {
  render: (args) => <ShareCalculationButton {...args} />,
  args: {
    type: 'contract',
    results: {
      totalGross: 130000,
      weeklyGross: 5000,
      monthlyGross: 21650,
    },
    inputs: {
      hourlyRate: '125',
      hoursPerWeek: '40',
      contractLength: '26',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Share button for contract calculator results showing total contract value.',
      },
    },
  },
}

export const PaycheckCalculation: StoryObj<typeof ShareCalculationButton> = {
  render: (args) => <ShareCalculationButton {...args} />,
  args: {
    type: 'paycheck',
    results: {
      netPay: 3850,
    },
    inputs: {
      grossPay: '5000',
      taxRate: '23',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Share button for paycheck calculator showing net pay calculation.',
      },
    },
  },
}

// Interactive stories
export const InteractiveDemo: Story = {
  args: {
    data: {
      title: 'Interactive Demo',
      message: 'Try clicking this button to see the share action!',
      url: 'https://locumtruerate.com/demo',
    },
    onShare: () => {
      alert('Share succeeded! In a real app, this would open the native share sheet.')
    },
    onError: (error) => {
      alert(`Share failed: ${error.message}`)
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo showing the share button with simulated success callback.',
      },
    },
  },
}

// Style variations
export const LargeButton: Story = {
  args: {
    ...Default.args,
    style: {
      paddingVertical: 20,
      paddingHorizontal: 40,
    },
  },
}

export const CompactButton: Story = {
  args: {
    ...Default.args,
    label: 'Share',
    style: {
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
  },
}

export const RoundedButton: Story = {
  args: {
    ...Default.args,
    style: {
      borderRadius: 25,
      paddingVertical: 15,
      paddingHorizontal: 30,
    },
  },
}

// Error state
export const ErrorState: Story = {
  args: {
    data: {
      title: 'Error Demo',
      message: 'This will simulate a share error',
    },
    onShare: () => {
      // Simulate error
      throw new Error('Simulated share failure')
    },
    onError: action('share-error'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates error handling when sharing fails.',
      },
    },
  },
}