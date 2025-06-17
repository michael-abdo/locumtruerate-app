import { useCallback } from 'react'
import { useAnalytics, useTrackEvent } from '@/providers/analytics-provider'

// Enhanced analytics hook with common tracking patterns
export function usePageAnalytics() {
  const { track, pageView } = useAnalytics()
  const trackEvent = useTrackEvent()
  
  const trackPageLoad = useCallback((page: string, loadTime?: number) => {
    pageView(page, document.title)
    if (loadTime) {
      track('page_load_time', { page, loadTime })
    }
  }, [pageView, track])
  
  const trackUserEngagement = useCallback((type: 'scroll' | 'click' | 'hover', element?: string) => {
    track('user_engagement', { type, element, timestamp: Date.now() })
  }, [track])
  
  const trackSearchUsage = useCallback((query: string, results: number, filters?: Record<string, any>) => {
    trackEvent.trackSearch(query, results, { filters })
  }, [trackEvent])
  
  return {
    trackPageLoad,
    trackUserEngagement,
    trackSearchUsage,
    ...trackEvent
  }
}

// Job-specific analytics
export function useJobAnalytics() {
  const trackEvent = useTrackEvent()
  
  const trackJobInteraction = useCallback((action: string, jobId: string, jobTitle: string, additionalData?: Record<string, any>) => {
    trackEvent.trackJobView(jobId, jobTitle, { action, ...additionalData })
  }, [trackEvent])
  
  const trackJobApplication = useCallback((jobId: string, jobTitle: string, applicationData?: Record<string, any>) => {
    trackEvent.trackJobApplication(jobId, jobTitle, applicationData)
  }, [trackEvent])
  
  const trackJobSave = useCallback((jobId: string, jobTitle: string, saved: boolean) => {
    trackEvent.trackFeatureUsage('job_save', { jobId, jobTitle, saved })
  }, [trackEvent])
  
  const trackJobShare = useCallback((jobId: string, jobTitle: string, method: string) => {
    trackEvent.trackFeatureUsage('job_share', { jobId, jobTitle, method })
  }, [trackEvent])
  
  return {
    trackJobInteraction,
    trackJobApplication,
    trackJobSave,
    trackJobShare
  }
}

// Calculator analytics
export function useCalculatorAnalytics() {
  const { track } = useAnalytics()
  const trackEvent = useTrackEvent()
  
  const trackCalculatorUsage = useCallback((calculatorType: string, inputs: Record<string, any>, results?: Record<string, any>) => {
    trackEvent.trackFeatureUsage('calculator', { 
      calculatorType, 
      inputs, 
      results,
      timestamp: Date.now()
    })
  }, [trackEvent])
  
  const trackCalculatorError = useCallback((calculatorType: string, error: string, inputs?: Record<string, any>) => {
    trackEvent.trackError(error, `calculator_${calculatorType}`, { inputs })
  }, [trackEvent])
  
  const trackCalculatorExport = useCallback((calculatorType: string, format: string, data?: Record<string, any>) => {
    track('calculator_export', { calculatorType, format, data })
  }, [track])
  
  return {
    trackCalculatorUsage,
    trackCalculatorError,
    trackCalculatorExport
  }
}

// User onboarding analytics
export function useOnboardingAnalytics() {
  const { track } = useAnalytics()
  
  const trackOnboardingStep = useCallback((step: string, completed: boolean, data?: Record<string, any>) => {
    track('onboarding_step', { step, completed, data, timestamp: Date.now() })
  }, [track])
  
  const trackOnboardingComplete = useCallback((duration: number, stepsCompleted: string[]) => {
    track('onboarding_complete', { duration, stepsCompleted, timestamp: Date.now() })
  }, [track])
  
  const trackOnboardingSkip = useCallback((step: string, reason?: string) => {
    track('onboarding_skip', { step, reason, timestamp: Date.now() })
  }, [track])
  
  return {
    trackOnboardingStep,
    trackOnboardingComplete,
    trackOnboardingSkip
  }
}

// Performance monitoring
export function usePerformanceAnalytics() {
  const { track } = useAnalytics()
  
  const trackPerformanceMetric = useCallback((metric: string, value: number, context?: Record<string, any>) => {
    track('performance_metric', { metric, value, context, timestamp: Date.now() })
  }, [track])
  
  const trackWebVitals = useCallback((name: string, value: number, id: string) => {
    track('web_vitals', { name, value, id, timestamp: Date.now() })
  }, [track])
  
  const trackAPIResponse = useCallback((endpoint: string, duration: number, status: number, success: boolean) => {
    track('api_response', { endpoint, duration, status, success, timestamp: Date.now() })
  }, [track])
  
  return {
    trackPerformanceMetric,
    trackWebVitals,
    trackAPIResponse
  }
}