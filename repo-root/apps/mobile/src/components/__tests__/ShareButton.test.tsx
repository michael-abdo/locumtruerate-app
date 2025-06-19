/**
 * ShareButton Component Tests
 */

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Share, Alert } from 'react-native'
import { ShareButton, ShareJobButton, ShareCalculationButton } from '../ShareButton'

// Mock React Native modules
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Share: {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
  Alert: {
    alert: jest.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}))

// Mock analytics
jest.mock('../../services/analytics', () => ({
  trackEvent: jest.fn(),
}))

const mockShareData = {
  title: 'Test Title',
  message: 'Test message',
  url: 'https://example.com',
}

describe('ShareButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <ShareButton data={mockShareData} />
    )
    
    expect(getByText('📤')).toBeTruthy()
    expect(getByText('Share')).toBeTruthy()
  })

  it('renders with custom label and icon', () => {
    const { getByText } = render(
      <ShareButton 
        data={mockShareData}
        icon="🔗"
        label="Custom Share"
      />
    )
    
    expect(getByText('🔗')).toBeTruthy()
    expect(getByText('Custom Share')).toBeTruthy()
  })

  it('calls Share.share when pressed', async () => {
    const mockShare = Share.share as jest.Mock
    mockShare.mockResolvedValue({ action: Share.sharedAction })

    const { getByText } = render(
      <ShareButton data={mockShareData} />
    )
    
    fireEvent.press(getByText('Share'))
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith({
        title: mockShareData.title,
        message: mockShareData.message,
        url: mockShareData.url,
      })
    })
  })

  it('calls onShare callback when sharing succeeds', async () => {
    const mockOnShare = jest.fn()
    const mockShare = Share.share as jest.Mock
    mockShare.mockResolvedValue({ action: Share.sharedAction })

    const { getByText } = render(
      <ShareButton 
        data={mockShareData}
        onShare={mockOnShare}
      />
    )
    
    fireEvent.press(getByText('Share'))
    
    await waitFor(() => {
      expect(mockOnShare).toHaveBeenCalled()
    })
  })

  it('shows alert when sharing fails', async () => {
    const mockShare = Share.share as jest.Mock
    const mockAlert = Alert.alert as jest.Mock
    mockShare.mockRejectedValue(new Error('Share failed'))

    const { getByText } = render(
      <ShareButton data={mockShareData} />
    )
    
    fireEvent.press(getByText('Share'))
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Share Failed',
        'Unable to share at this time'
      )
    })
  })
})

describe('ShareJobButton', () => {
  const mockJobProps = {
    jobId: 'job-123',
    jobTitle: 'Software Engineer',
    companyName: 'Tech Corp',
    salary: '$100k',
    location: 'San Francisco, CA',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with job-specific label', () => {
    const { getByText } = render(
      <ShareJobButton {...mockJobProps} />
    )
    
    expect(getByText('Share Job')).toBeTruthy()
  })

  it('creates correct share data for job', async () => {
    const mockShare = Share.share as jest.Mock
    mockShare.mockResolvedValue({ action: Share.sharedAction })

    const { getByText } = render(
      <ShareJobButton {...mockJobProps} />
    )
    
    fireEvent.press(getByText('Share Job'))
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Software Engineer at Tech Corp',
          message: expect.stringContaining('📋 Software Engineer'),
          url: 'https://locumtruerate.com/job/job-123',
        })
      )
    })
  })
})

describe('ShareCalculationButton', () => {
  const mockCalculationProps = {
    type: 'contract' as const,
    results: {
      totalGross: 100000,
      weeklyGross: 2000,
      monthlyGross: 8000,
    },
    inputs: {
      hourlyRate: '50',
      hoursPerWeek: '40',
      contractLength: '26',
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders with calculation-specific label', () => {
    const { getByText } = render(
      <ShareCalculationButton {...mockCalculationProps} />
    )
    
    expect(getByText('🧮')).toBeTruthy()
    expect(getByText('Share Calculation')).toBeTruthy()
  })

  it('creates correct share data for contract calculation', async () => {
    const mockShare = Share.share as jest.Mock
    mockShare.mockResolvedValue({ action: Share.sharedAction })

    const { getByText } = render(
      <ShareCalculationButton {...mockCalculationProps} />
    )
    
    fireEvent.press(getByText('Share Calculation'))
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Contract Calculator',
          message: expect.stringContaining('💵 Total Contract Value: $100,000'),
          url: 'https://locumtruerate.com/calculator/contract',
        })
      )
    })
  })

  it('creates correct share data for paycheck calculation', async () => {
    const mockShare = Share.share as jest.Mock
    mockShare.mockResolvedValue({ action: Share.sharedAction })

    const paycheckProps = {
      ...mockCalculationProps,
      type: 'paycheck' as const,
      results: {
        netPay: 3000,
      },
    }

    const { getByText } = render(
      <ShareCalculationButton {...paycheckProps} />
    )
    
    fireEvent.press(getByText('Share Calculation'))
    
    await waitFor(() => {
      expect(mockShare).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Paycheck Calculator',
          message: expect.stringContaining('💰 Net Pay: $3,000'),
          url: 'https://locumtruerate.com/calculator/paycheck',
        })
      )
    })
  })
})