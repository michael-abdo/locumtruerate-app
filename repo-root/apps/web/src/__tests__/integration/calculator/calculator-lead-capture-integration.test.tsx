import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockCalculationResult } from '@/__tests__/utils/test-utils'
import { ContractCalculator } from '@/components/calculator/contract-calculator'
import { PaycheckCalculator } from '@/components/calculator/paycheck-calculator'
import { LeadCaptureModal } from '@/components/lead-capture/lead-capture-modal'
import { CalculatorLayout } from '@/components/calculator/calculator-layout'

// Mock calc-core
const mockCalculateContract = jest.fn()
const mockCalculatePaycheck = jest.fn()

jest.mock('@locumtruerate/calc-core', () => ({
  calculateContract: mockCalculateContract,
  calculatePaycheck: mockCalculatePaycheck,
  ContractType: {
    HOURLY: 'HOURLY',
    DAILY: 'DAILY',
    MONTHLY: 'MONTHLY'
  }
}))

// Mock lead capture API
const mockCreateLead = jest.fn()
const mockTrackConversion = jest.fn()
const mockSendWebhook = jest.fn()

jest.mock('@/trpc/react', () => ({
  api: {
    leads: {
      create: {
        useMutation: () => ({
          mutateAsync: mockCreateLead,
          isLoading: false,
          error: null,
          reset: jest.fn()
        })
      }
    },
    analytics: {
      trackConversion: {
        useMutation: () => ({
          mutateAsync: mockTrackConversion,
          isLoading: false
        })
      }
    }
  }
}))

// Mock Zapier webhook
global.fetch = jest.fn()

// Mock analytics
const mockTrackLeadCapture = jest.fn()
const mockTrackCalculatorConversion = jest.fn()

jest.mock('@/hooks/use-analytics', () => ({
  useCalculatorAnalytics: () => ({
    trackCalculatorUsage: jest.fn(),
    trackLeadCapture: mockTrackLeadCapture,
    trackCalculatorConversion: mockTrackCalculatorConversion
  })
}))

// Mock user location for lead scoring
const mockGeolocation = {
  getCurrentPosition: jest.fn()
}

Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
})

// Mock UTM parameters
const mockGetUTMParams = jest.fn(() => ({
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'locum-calculator',
  utm_term: 'physician-salary-calculator'
}))

jest.mock('@/utils/utm-tracking', () => ({
  getUTMParams: mockGetUTMParams,
  getSessionData: () => ({
    sessionId: 'session-123',
    sessionDuration: 300,
    pageViews: 3,
    referrer: 'https://google.com'
  })
}))

describe('Calculator Lead Capture Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default calculation responses
    mockCalculateContract.mockResolvedValue(createMockCalculationResult({
      grossPay: 312000,
      netPay: 234000,
      taxes: 78000,
      hourlyRate: 150
    }))
    
    mockCalculatePaycheck.mockResolvedValue(createMockCalculationResult({
      grossPay: 6000,
      netPay: 4500,
      taxes: 1500
    }))

    // Setup default lead creation response
    mockCreateLead.mockResolvedValue({
      success: true,
      leadId: 'lead-123',
      score: 85,
      message: 'Lead submitted successfully'
    })

    // Mock geolocation
    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success({
        coords: {
          latitude: 32.7767,
          longitude: -96.7970 // Dallas, TX
        }
      })
    })

    // Mock successful webhook
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Calculator to Lead Capture Flow', () => {
    it('triggers lead capture after high-value calculation', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator showLeadCapture />)

      // Perform high-value calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '200')
      await user.type(screen.getByLabelText(/hours per week/i), '40')
      await user.type(screen.getByLabelText(/contract duration/i), '12')
      await user.type(screen.getByLabelText(/location/i), 'San Francisco, CA')

      await user.click(screen.getByRole('button', { name: /calculate/i }))

      // Wait for calculation results
      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Should trigger lead capture modal for high-value calculation
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /interested in opportunities/i })).toBeInTheDocument()
      }, { timeout: 3000 })

      const leadModal = screen.getByRole('dialog', { name: /interested in opportunities/i })
      expect(within(leadModal).getByText(/based on your calculation/i)).toBeInTheDocument()
      expect(within(leadModal).getByText(/\$312,000/i)).toBeInTheDocument()
    })

    it('does not trigger lead capture for low-value calculations', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator showLeadCapture />)

      // Perform low-value calculation
      mockCalculateContract.mockResolvedValue(createMockCalculationResult({
        grossPay: 80000,
        netPay: 60000,
        taxes: 20000,
        hourlyRate: 40
      }))

      await user.type(screen.getByLabelText(/hourly rate/i), '40')
      await user.type(screen.getByLabelText(/hours per week/i), '40')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$80,000/)).toBeInTheDocument()
      })

      // Should not trigger lead capture modal
      await new Promise(resolve => setTimeout(resolve, 2000))
      expect(screen.queryByRole('dialog', { name: /interested in opportunities/i })).not.toBeInTheDocument()
    })

    it('triggers lead capture after multiple calculations', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator showLeadCapture />)

      // Perform first calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '120')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Reset form and perform second calculation
      await user.click(screen.getByRole('button', { name: /reset/i }))
      await user.type(screen.getByLabelText(/hourly rate/i), '140')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Should trigger lead capture after multiple calculations
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /unlock more features/i })).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('respects user dismissal of lead capture', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator showLeadCapture />)

      // Trigger lead capture
      await user.type(screen.getByLabelText(/hourly rate/i), '200')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /interested in opportunities/i })).toBeInTheDocument()
      })

      // Dismiss modal
      const dismissButton = screen.getByRole('button', { name: /not now/i })
      await user.click(dismissButton)

      expect(screen.queryByRole('dialog', { name: /interested in opportunities/i })).not.toBeInTheDocument()

      // Perform another calculation - should not trigger lead capture again
      await user.clear(screen.getByLabelText(/hourly rate/i))
      await user.type(screen.getByLabelText(/hourly rate/i), '250')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await new Promise(resolve => setTimeout(resolve, 2000))
      expect(screen.queryByRole('dialog', { name: /interested in opportunities/i })).not.toBeInTheDocument()
    })
  })

  describe('Lead Form with Calculation Metadata', () => {
    it('pre-fills form with calculation data', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <ContractCalculator />
          <LeadCaptureModal 
            isOpen={true}
            calculationData={{
              type: 'contract',
              hourlyRate: 200,
              annualSalary: 416000,
              location: 'San Francisco, CA',
              specialty: 'Emergency Medicine'
            }}
          />
        </div>
      )

      const leadModal = screen.getByRole('dialog')
      
      // Should pre-fill relevant fields
      expect(within(leadModal).getByDisplayValue('San Francisco, CA')).toBeInTheDocument()
      expect(within(leadModal).getByDisplayValue('Emergency Medicine')).toBeInTheDocument()
      
      // Should show calculation summary
      const calculationSummary = within(leadModal).getByTestId('calculation-summary')
      expect(calculationSummary).toHaveTextContent('$200/hour')
      expect(calculationSummary).toHaveTextContent('$416,000/year')
    })

    it('submits lead with complete calculation metadata', async () => {
      const user = userEvent.setup()
      render(<LeadCaptureModal 
        isOpen={true}
        calculationData={{
          type: 'contract',
          hourlyRate: 200,
          hoursPerWeek: 40,
          duration: 12,
          location: 'San Francisco, CA',
          grossPay: 416000,
          netPay: 312000,
          taxes: 104000,
          specialty: 'Emergency Medicine',
          contractType: 'HOURLY'
        }}
      />)

      const leadModal = screen.getByRole('dialog')

      // Fill required fields
      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.type(within(leadModal).getByLabelText(/phone/i), '+1234567890')
      await user.type(within(leadModal).getByLabelText(/message/i), 'Interested in high-paying locum opportunities in California')

      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith({
          email: 'doctor@example.com',
          name: 'Dr. John Smith',
          phone: '+1234567890',
          message: 'Interested in high-paying locum opportunities in California',
          source: 'calculator',
          sourceId: 'contract-calculator',
          calculationData: {
            type: 'contract',
            hourlyRate: 200,
            hoursPerWeek: 40,
            duration: 12,
            location: 'San Francisco, CA',
            grossPay: 416000,
            netPay: 312000,
            taxes: 104000,
            specialty: 'Emergency Medicine',
            contractType: 'HOURLY',
            calculatedAt: expect.any(String)
          },
          metadata: expect.objectContaining({
            utm_source: 'google',
            utm_medium: 'cpc',
            utm_campaign: 'locum-calculator',
            utm_term: 'physician-salary-calculator',
            sessionData: expect.objectContaining({
              sessionId: 'session-123',
              sessionDuration: 300,
              pageViews: 3
            }),
            geolocation: expect.objectContaining({
              latitude: 32.7767,
              longitude: -96.7970
            })
          })
        })
      })
    })

    it('handles form validation errors', async () => {
      const user = userEvent.setup()
      render(<LeadCaptureModal isOpen={true} />)

      const leadModal = screen.getByRole('dialog')

      // Try to submit without required fields
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      // Should show validation errors
      await waitFor(() => {
        expect(within(leadModal).getByText(/email is required/i)).toBeInTheDocument()
        expect(within(leadModal).getByText(/name is required/i)).toBeInTheDocument()
      })

      // Fill invalid email
      await user.type(within(leadModal).getByLabelText(/email/i), 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(within(leadModal).getByText(/invalid email address/i)).toBeInTheDocument()
      })

      // Fix email and submit
      await user.clear(within(leadModal).getByLabelText(/email/i))
      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')

      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalled()
      })
    })

    it('shows specialty-specific lead capture content', async () => {
      const user = userEvent.setup()
      render(<LeadCaptureModal 
        isOpen={true}
        calculationData={{
          type: 'contract',
          specialty: 'Emergency Medicine',
          location: 'California'
        }}
      />)

      const leadModal = screen.getByRole('dialog')

      // Should show specialty-specific content
      expect(within(leadModal).getByText(/emergency medicine opportunities/i)).toBeInTheDocument()
      expect(within(leadModal).getByText(/california hospitals/i)).toBeInTheDocument()

      // Should have specialty-specific form fields
      expect(within(leadModal).getByLabelText(/board certification/i)).toBeInTheDocument()
      expect(within(leadModal).getByLabelText(/availability/i)).toBeInTheDocument()
    })
  })

  describe('Zapier Webhook Integration', () => {
    it('sends webhook to Zapier on lead submission', async () => {
      const user = userEvent.setup()
      
      // Mock environment variables
      process.env.ZAPIER_WEBHOOK_URLS = 'https://hooks.zapier.com/hooks/catch/123/abc,https://hooks.zapier.com/hooks/catch/456/def'
      process.env.ZAPIER_WEBHOOK_SECRET = 'test-secret'

      render(<LeadCaptureModal isOpen={true} calculationData={{
        type: 'contract',
        hourlyRate: 200,
        grossPay: 416000
      }} />)

      const leadModal = screen.getByRole('dialog')

      // Submit lead
      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2) // Two webhook URLs
      })

      // Check webhook payload
      const firstCall = (global.fetch as jest.Mock).mock.calls[0]
      expect(firstCall[0]).toBe('https://hooks.zapier.com/hooks/catch/123/abc')
      expect(firstCall[1].method).toBe('POST')
      expect(firstCall[1].headers['Content-Type']).toBe('application/json')

      const payload = JSON.parse(firstCall[1].body)
      expect(payload).toEqual({
        event: 'lead.created',
        data: expect.objectContaining({
          email: 'doctor@example.com',
          name: 'Dr. John Smith',
          source: 'calculator',
          calculationData: expect.objectContaining({
            hourlyRate: 200,
            grossPay: 416000
          })
        }),
        timestamp: expect.any(Number),
        version: '1.0'
      })

      // Check webhook signature
      expect(firstCall[1].headers['X-Webhook-Signature']).toMatch(/^sha256=/)
    })

    it('handles webhook failures gracefully', async () => {
      const user = userEvent.setup()

      // Mock webhook failure
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ ok: true, status: 200 })

      render(<LeadCaptureModal isOpen={true} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      // Lead should still be created even if webhook fails
      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalled()
        expect(screen.getByText(/lead submitted successfully/i)).toBeInTheDocument()
      })

      // Should have attempted webhook retry
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('includes proper webhook authentication', async () => {
      const user = userEvent.setup()
      
      process.env.ZAPIER_WEBHOOK_SECRET = 'super-secret-key'

      render(<LeadCaptureModal isOpen={true} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled()
      })

      const webhookCall = (global.fetch as jest.Mock).mock.calls[0]
      const signature = webhookCall[1].headers['X-Webhook-Signature']
      
      expect(signature).toMatch(/^sha256=/)
      expect(signature).not.toBe('sha256=') // Should have actual hash
    })
  })

  describe('Conversion Tracking', () => {
    it('tracks successful lead conversions', async () => {
      const user = userEvent.setup()
      render(<LeadCaptureModal isOpen={true} calculationData={{
        type: 'contract',
        hourlyRate: 200,
        grossPay: 416000
      }} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockTrackLeadCapture).toHaveBeenCalledWith({
          source: 'calculator',
          calculationType: 'contract',
          leadScore: 85,
          calculationValue: 416000,
          conversionTime: expect.any(Number),
          metadata: expect.objectContaining({
            utm_source: 'google',
            utm_campaign: 'locum-calculator'
          })
        })
      })

      expect(mockTrackCalculatorConversion).toHaveBeenCalledWith({
        event: 'lead_captured',
        calculationType: 'contract',
        calculationValue: 416000,
        leadId: 'lead-123',
        conversionRate: expect.any(Number)
      })
    })

    it('tracks conversion funnel metrics', async () => {
      const user = userEvent.setup()
      render(<CalculatorLayout trackConversions>
        <ContractCalculator />
      </CalculatorLayout>)

      // Step 1: User starts calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '200')

      // Step 2: User completes calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Step 3: Lead capture triggered
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /interested in opportunities/i })).toBeInTheDocument()
      })

      // Step 4: User fills lead form
      const leadModal = screen.getByRole('dialog')
      await user.type(within(leadModal).getByLabelText(/email/i), 'doctor@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. John Smith')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      // Should track complete funnel
      await waitFor(() => {
        expect(mockTrackCalculatorConversion).toHaveBeenCalledWith({
          event: 'funnel_complete',
          steps: ['calculation_start', 'calculation_complete', 'lead_capture_shown', 'lead_submitted'],
          timeToConversion: expect.any(Number),
          calculationType: 'contract'
        })
      })
    })

    it('tracks partial conversions and drop-offs', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator showLeadCapture />)

      // User starts calculation
      await user.type(screen.getByLabelText(/hourly rate/i), '200')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /interested in opportunities/i })).toBeInTheDocument()
      })

      // User dismisses lead capture
      const dismissButton = screen.getByRole('button', { name: /not now/i })
      await user.click(dismissButton)

      // Should track drop-off
      expect(mockTrackCalculatorConversion).toHaveBeenCalledWith({
        event: 'lead_capture_dismissed',
        calculationType: 'contract',
        step: 'lead_capture_shown',
        dropOffReason: 'user_dismissed'
      })
    })
  })

  describe('Lead Scoring and Qualification', () => {
    it('calculates lead score based on calculation data', async () => {
      const user = userEvent.setup()
      render(<LeadCaptureModal isOpen={true} calculationData={{
        type: 'contract',
        hourlyRate: 300, // High rate = higher score
        location: 'San Francisco, CA', // High-demand location
        specialty: 'Anesthesiology', // High-paying specialty
        grossPay: 624000
      }} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'anesthesiologist@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. Sarah Johnson')
      await user.type(within(leadModal).getByLabelText(/phone/i), '+1234567890')
      await user.type(within(leadModal).getByLabelText(/message/i), 'I have 15 years of experience and am looking for high-paying locum opportunities in the Bay Area.')

      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            calculationData: expect.objectContaining({
              hourlyRate: 300,
              grossPay: 624000,
              specialty: 'Anesthesiology'
            })
          })
        )
      })

      // Should receive high lead score
      expect(mockCreateLead).toHaveResolvedWith(
        expect.objectContaining({
          score: expect.any(Number)
        })
      )
    })

    it('prioritizes leads based on calculation patterns', async () => {
      const user = userEvent.setup()

      // High-value calculation pattern
      render(<LeadCaptureModal isOpen={true} calculationData={{
        type: 'contract',
        hourlyRate: 250,
        location: 'New York, NY',
        calculationHistory: [
          { hourlyRate: 200, location: 'Dallas, TX' },
          { hourlyRate: 220, location: 'Chicago, IL' },
          { hourlyRate: 250, location: 'New York, NY' }
        ],
        searchPattern: 'progressive_rate_increase' // Indicates serious job hunting
      }} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'progressivedoc@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. Alex Kim')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              leadPriority: 'high',
              qualificationNotes: expect.stringContaining('progressive rate increase pattern')
            })
          })
        )
      })
    })

    it('handles international lead qualification', async () => {
      const user = userEvent.setup()

      // Mock international location
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success({
          coords: {
            latitude: 43.6532, // Toronto, Canada
            longitude: -79.3832
          }
        })
      })

      render(<LeadCaptureModal isOpen={true} calculationData={{
        type: 'contract',
        location: 'Toronto, ON, Canada',
        currency: 'CAD',
        hourlyRate: 180 // CAD
      }} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'canadiandoc@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. Marie Dubois')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              geolocation: expect.objectContaining({
                latitude: 43.6532,
                longitude: -79.3832
              }),
              currency: 'CAD',
              requiresVisaSponsorship: false // Canada to US
            })
          })
        )
      })
    })
  })

  describe('Multi-Calculator Lead Capture', () => {
    it('tracks leads across calculator types', async () => {
      const user = userEvent.setup()
      render(
        <CalculatorLayout>
          <ContractCalculator />
          <PaycheckCalculator />
        </CalculatorLayout>
      )

      // Use contract calculator first
      await user.type(screen.getByLabelText(/hourly rate/i), '200')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$312,000/)).toBeInTheDocument()
      })

      // Switch to paycheck calculator
      await user.click(screen.getByRole('tab', { name: /paycheck calculator/i }))
      await user.type(screen.getByLabelText(/annual salary/i), '400000')
      await user.click(screen.getByRole('button', { name: /calculate/i }))

      await waitFor(() => {
        expect(screen.getByText(/\$6,000/)).toBeInTheDocument()
      })

      // Should trigger lead capture with combined data
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /multiple calculations/i })).toBeInTheDocument()
      })

      const leadModal = screen.getByRole('dialog')
      expect(within(leadModal).getByText(/contract and paycheck calculations/i)).toBeInTheDocument()

      await user.type(within(leadModal).getByLabelText(/email/i), 'comprehensive@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. Comprehensive User')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            calculationData: expect.objectContaining({
              multipleCalculations: true,
              contractData: expect.objectContaining({
                hourlyRate: 200
              }),
              paycheckData: expect.objectContaining({
                annualSalary: 400000
              })
            })
          })
        )
      })
    })

    it('handles comparison calculator lead capture', async () => {
      const user = userEvent.setup()
      render(<ContractCalculator comparisonMode />)

      // Enable comparison and add multiple contracts
      await user.click(screen.getByRole('button', { name: /compare contracts/i }))

      // Contract 1
      const contract1 = screen.getByTestId('contract-1')
      await user.type(within(contract1).getByLabelText(/hourly rate/i), '200')
      await user.type(within(contract1).getByLabelText(/location/i), 'San Francisco, CA')

      // Contract 2
      const contract2 = screen.getByTestId('contract-2')
      await user.type(within(contract2).getByLabelText(/hourly rate/i), '180')
      await user.type(within(contract2).getByLabelText(/location/i), 'Austin, TX')

      await user.click(screen.getByRole('button', { name: /compare/i }))

      // Should trigger lead capture for comparison users
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /comparison results/i })).toBeInTheDocument()
      })

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'comparison@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Dr. Comparison User')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'calculator',
            sourceId: 'comparison-calculator',
            calculationData: expect.objectContaining({
              type: 'comparison',
              contracts: expect.arrayContaining([
                expect.objectContaining({
                  hourlyRate: 200,
                  location: 'San Francisco, CA'
                }),
                expect.objectContaining({
                  hourlyRate: 180,
                  location: 'Austin, TX'
                })
              ])
            })
          })
        )
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles lead submission failures gracefully', async () => {
      const user = userEvent.setup()

      // Mock API failure
      mockCreateLead.mockRejectedValue(new Error('Server temporarily unavailable'))

      render(<LeadCaptureModal isOpen={true} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'test@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Test User')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      // Should show error message
      await waitFor(() => {
        expect(within(leadModal).getByText(/server temporarily unavailable/i)).toBeInTheDocument()
        expect(within(leadModal).getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      // Should allow retry
      mockCreateLead.mockResolvedValue({ success: true, leadId: 'lead-456' })
      await user.click(within(leadModal).getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(within(leadModal).getByText(/lead submitted successfully/i)).toBeInTheDocument()
      })
    })

    it('handles duplicate lead submissions', async () => {
      const user = userEvent.setup()

      // Mock duplicate lead response
      mockCreateLead.mockResolvedValue({
        success: true,
        message: 'Lead updated successfully',
        leadId: 'existing-lead-123',
        isDuplicate: true
      })

      render(<LeadCaptureModal isOpen={true} />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'existing@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Existing User')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      await waitFor(() => {
        expect(within(leadModal).getByText(/we've updated your information/i)).toBeInTheDocument()
      })
    })

    it('validates calculation data before submission', async () => {
      const user = userEvent.setup()

      render(<LeadCaptureModal 
        isOpen={true} 
        calculationData={{
          type: 'contract',
          hourlyRate: null, // Invalid data
          location: ''
        }} 
      />)

      const leadModal = screen.getByRole('dialog')

      await user.type(within(leadModal).getByLabelText(/email/i), 'test@example.com')
      await user.type(within(leadModal).getByLabelText(/name/i), 'Test User')
      await user.click(within(leadModal).getByRole('button', { name: /submit/i }))

      // Should handle invalid calculation data gracefully
      await waitFor(() => {
        expect(mockCreateLead).toHaveBeenCalledWith(
          expect.objectContaining({
            calculationData: expect.objectContaining({
              type: 'contract',
              isValid: false,
              validationErrors: expect.arrayContaining(['hourlyRate is required'])
            })
          })
        )
      })
    })
  })
})