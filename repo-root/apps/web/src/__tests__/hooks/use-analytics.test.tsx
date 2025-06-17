import { renderHook, act } from '@testing-library/react'
import { useJobAnalytics, usePageAnalytics, useCalculatorAnalytics } from '@/hooks/use-analytics'

// Mock the analytics provider
const mockTrack = jest.fn()
const mockPageView = jest.fn()
const mockTrackEvent = {
  trackClick: jest.fn(),
  trackFormSubmit: jest.fn(),
  trackJobView: jest.fn(),
  trackJobApplication: jest.fn(),
  trackSearch: jest.fn(),
  trackFeatureUsage: jest.fn(),
  trackError: jest.fn()
}

jest.mock('@/providers/analytics-provider', () => ({
  useAnalytics: () => ({
    track: mockTrack,
    pageView: mockPageView,
    identify: jest.fn()
  }),
  useTrackEvent: () => mockTrackEvent
}))

describe('Analytics Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('useJobAnalytics', () => {
    it('tracks job interactions', () => {
      const { result } = renderHook(() => useJobAnalytics())
      
      act(() => {
        result.current.trackJobInteraction('view', 'job-123', 'Emergency Medicine Physician', {
          category: 'Emergency Medicine',
          location: 'Dallas, TX'
        })
      })
      
      expect(mockTrackEvent.trackJobView).toHaveBeenCalledWith(
        'job-123',
        'Emergency Medicine Physician',
        {
          action: 'view',
          category: 'Emergency Medicine',
          location: 'Dallas, TX'
        }
      )
    })
    
    it('tracks job applications', () => {
      const { result } = renderHook(() => useJobAnalytics())
      
      act(() => {
        result.current.trackJobApplication('job-123', 'Emergency Medicine Physician', {
          source: 'job_detail_page'
        })
      })
      
      expect(mockTrackEvent.trackJobApplication).toHaveBeenCalledWith(
        'job-123',
        'Emergency Medicine Physician',
        { source: 'job_detail_page' }
      )
    })
    
    it('tracks job saves', () => {
      const { result } = renderHook(() => useJobAnalytics())
      
      act(() => {
        result.current.trackJobSave('job-123', 'Emergency Medicine Physician', true)
      })
      
      expect(mockTrackEvent.trackFeatureUsage).toHaveBeenCalledWith(
        'job_save',
        {
          jobId: 'job-123',
          jobTitle: 'Emergency Medicine Physician',
          saved: true
        }
      )
    })
    
    it('tracks job shares', () => {
      const { result } = renderHook(() => useJobAnalytics())
      
      act(() => {
        result.current.trackJobShare('job-123', 'Emergency Medicine Physician', 'native_share')
      })
      
      expect(mockTrackEvent.trackFeatureUsage).toHaveBeenCalledWith(
        'job_share',
        {
          jobId: 'job-123',
          jobTitle: 'Emergency Medicine Physician',
          method: 'native_share'
        }
      )
    })
  })
  
  describe('usePageAnalytics', () => {
    it('tracks page loads', () => {
      const { result } = renderHook(() => usePageAnalytics())
      
      act(() => {
        result.current.trackPageLoad('/jobs/emergency-medicine', 1500)
      })
      
      expect(mockPageView).toHaveBeenCalledWith('/jobs/emergency-medicine', document.title)
      expect(mockTrack).toHaveBeenCalledWith('page_load_time', {
        page: '/jobs/emergency-medicine',
        loadTime: 1500
      })
    })
    
    it('tracks user engagement', () => {
      const { result } = renderHook(() => usePageAnalytics())
      
      act(() => {
        result.current.trackUserEngagement('click', 'apply-button')
      })
      
      expect(mockTrack).toHaveBeenCalledWith('user_engagement', {
        type: 'click',
        element: 'apply-button',
        timestamp: expect.any(Number)
      })
    })
    
    it('tracks search usage', () => {
      const { result } = renderHook(() => usePageAnalytics())
      
      act(() => {
        result.current.trackSearchUsage('emergency medicine', 25, {
          location: 'Dallas, TX',
          category: 'Emergency Medicine'
        })
      })
      
      expect(mockTrackEvent.trackSearch).toHaveBeenCalledWith(
        'emergency medicine',
        25,
        {
          filters: {
            location: 'Dallas, TX',
            category: 'Emergency Medicine'
          }
        }
      )
    })
  })
  
  describe('useCalculatorAnalytics', () => {
    it('tracks calculator usage', () => {
      const { result } = renderHook(() => useCalculatorAnalytics())
      
      const inputs = {
        hourlyRate: 150,
        hoursPerWeek: 40,
        weeksPerYear: 50
      }
      
      const results = {
        annualSalary: 300000,
        netPay: 225000
      }
      
      act(() => {
        result.current.trackCalculatorUsage('salary', inputs, results)
      })
      
      expect(mockTrackEvent.trackFeatureUsage).toHaveBeenCalledWith(
        'calculator',
        {
          calculatorType: 'salary',
          inputs,
          results,
          timestamp: expect.any(Number)
        }
      )
    })
    
    it('tracks calculator errors', () => {
      const { result } = renderHook(() => useCalculatorAnalytics())
      
      const inputs = { invalidInput: 'test' }
      
      act(() => {
        result.current.trackCalculatorError('salary', 'Invalid input values', inputs)
      })
      
      expect(mockTrackEvent.trackError).toHaveBeenCalledWith(
        'Invalid input values',
        'calculator_salary',
        { inputs }
      )
    })
    
    it('tracks calculator exports', () => {
      const { result } = renderHook(() => useCalculatorAnalytics())
      
      const data = {
        calculationType: 'salary',
        results: { annualSalary: 300000 }
      }
      
      act(() => {
        result.current.trackCalculatorExport('salary', 'pdf', data)
      })
      
      expect(mockTrack).toHaveBeenCalledWith('calculator_export', {
        calculatorType: 'salary',
        format: 'pdf',
        data
      })
    })
  })
  
  describe('Error handling', () => {
    it('handles tracking errors gracefully', () => {
      // Mock analytics to throw error
      mockTrack.mockImplementationOnce(() => {
        throw new Error('Analytics service unavailable')
      })
      
      const { result } = renderHook(() => usePageAnalytics())
      
      // Should not throw error
      expect(() => {
        act(() => {
          result.current.trackUserEngagement('click', 'button')
        })
      }).not.toThrow()
    })
  })
  
  describe('Analytics data validation', () => {
    it('validates required parameters', () => {
      const { result } = renderHook(() => useJobAnalytics())
      
      act(() => {
        result.current.trackJobInteraction('view', '', 'Test Job')
      })
      
      // Should still call the tracking function even with empty jobId
      // The validation should happen in the analytics service
      expect(mockTrackEvent.trackJobView).toHaveBeenCalled()
    })
    
    it('handles undefined optional parameters', () => {
      const { result } = renderHook(() => useCalculatorAnalytics())
      
      act(() => {
        result.current.trackCalculatorUsage('salary', { hourlyRate: 150 })
      })
      
      expect(mockTrackEvent.trackFeatureUsage).toHaveBeenCalledWith(
        'calculator',
        {
          calculatorType: 'salary',
          inputs: { hourlyRate: 150 },
          results: undefined,
          timestamp: expect.any(Number)
        }
      )
    })
  })
})