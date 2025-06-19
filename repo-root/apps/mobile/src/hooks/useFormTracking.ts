/**
 * Form Tracking Hook
 * 
 * Provides automatic tracking for form interactions and submissions
 */

import { useRef, useCallback } from 'react'
import { Analytics, trackEvent } from '../services/analytics'

interface FormTrackingOptions {
  formName: string
  formType: 'application' | 'search' | 'profile' | 'payment' | 'other'
  metadata?: Record<string, any>
}

export function useFormTracking({
  formName,
  formType,
  metadata = {}
}: FormTrackingOptions) {
  const startTimeRef = useRef<number>()
  const fieldInteractionsRef = useRef<Set<string>>(new Set())
  const hasStartedRef = useRef(false)

  // Track form start
  const trackFormStart = useCallback(() => {
    if (hasStartedRef.current) return
    
    hasStartedRef.current = true
    startTimeRef.current = Date.now()
    
    trackEvent('sign_up_started', {
      form_name: formName,
      form_type: formType,
      ...metadata
    })

    Analytics.addBreadcrumb(`Form started: ${formName}`, {
      type: formType,
      ...metadata
    })
  }, [formName, formType, metadata])

  // Track field interaction
  const trackFieldInteraction = useCallback((fieldName: string) => {
    if (!hasStartedRef.current) {
      trackFormStart()
    }

    if (!fieldInteractionsRef.current.has(fieldName)) {
      fieldInteractionsRef.current.add(fieldName)
      
      Analytics.addBreadcrumb(`Form field interacted: ${fieldName}`, {
        form: formName,
        field: fieldName
      })
    }
  }, [formName, trackFormStart])

  // Track form submission
  const trackFormSubmit = useCallback((success: boolean, submissionData?: any) => {
    const duration = startTimeRef.current 
      ? Date.now() - startTimeRef.current 
      : 0

    const eventName = formType === 'application' 
      ? (success ? 'job_applied' : 'job_application_failed')
      : (success ? 'sign_up_completed' : 'sign_up_failed')

    trackEvent(eventName, {
      form_name: formName,
      form_type: formType,
      duration_ms: duration,
      fields_interacted: fieldInteractionsRef.current.size,
      success,
      ...metadata,
      ...submissionData
    })

    // Track performance
    if (duration > 0) {
      Analytics.trackPerformance('form_completion_time', duration, {
        form: formName,
        type: formType,
        success: success.toString()
      })
    }

    // Reset for next submission
    hasStartedRef.current = false
    startTimeRef.current = undefined
    fieldInteractionsRef.current.clear()
  }, [formName, formType, metadata])

  // Track form abandonment
  const trackFormAbandon = useCallback((reason?: string) => {
    if (!hasStartedRef.current) return

    const duration = startTimeRef.current 
      ? Date.now() - startTimeRef.current 
      : 0

    trackEvent('sign_up_started', {
      form_name: formName,
      form_type: formType,
      abandon_reason: reason || 'unknown',
      duration_ms: duration,
      fields_interacted: fieldInteractionsRef.current.size,
      completed_fields: Array.from(fieldInteractionsRef.current),
      ...metadata
    })

    // Reset
    hasStartedRef.current = false
    startTimeRef.current = undefined
    fieldInteractionsRef.current.clear()
  }, [formName, formType, metadata])

  // Track validation errors
  const trackValidationError = useCallback((fieldName: string, errorType: string) => {
    Analytics.addBreadcrumb(`Form validation error`, {
      form: formName,
      field: fieldName,
      error: errorType
    })

    trackEvent('sign_up_started', {
      form_name: formName,
      field_name: fieldName,
      error_type: errorType,
      ...metadata
    })
  }, [formName, metadata])

  return {
    trackFormStart,
    trackFieldInteraction,
    trackFormSubmit,
    trackFormAbandon,
    trackValidationError
  }
}

// Specialized hook for job application tracking
export function useJobApplicationTracking(jobId: string, jobTitle: string) {
  return useFormTracking({
    formName: 'job_application',
    formType: 'application',
    metadata: {
      job_id: jobId,
      job_title: jobTitle
    }
  })
}

// Specialized hook for search form tracking
export function useSearchTracking(searchType: 'jobs' | 'candidates' | 'companies') {
  const trackSearch = useCallback((query: string, filters: any, resultsCount: number) => {
    trackEvent('job_search', {
      search_type: searchType,
      query,
      query_length: query.length,
      has_filters: Object.keys(filters).length > 0,
      filter_count: Object.keys(filters).length,
      results_count: resultsCount,
      ...filters
    })
  }, [searchType])

  return { trackSearch }
}