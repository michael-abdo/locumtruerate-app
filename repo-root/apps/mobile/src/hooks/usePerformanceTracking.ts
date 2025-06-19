/**
 * Performance Tracking Hook for API Calls
 * 
 * Provides automatic performance monitoring for API calls with Sentry integration
 */

import { useEffect, useRef } from 'react'
import { Analytics } from '../services/analytics'

interface PerformanceOptions {
  operationName: string
  threshold?: number // milliseconds before considered slow
  metadata?: Record<string, any>
}

export function usePerformanceTracking({
  operationName,
  threshold = 3000,
  metadata = {}
}: PerformanceOptions) {
  const startTimeRef = useRef<number>()
  const transactionRef = useRef<any>()

  // Start performance tracking
  const startTracking = () => {
    startTimeRef.current = Date.now()
    transactionRef.current = Analytics.startTransaction(operationName, 'api_call')
    
    if (transactionRef.current && metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        transactionRef.current.setTag(key, String(value))
      })
    }
  }

  // End performance tracking
  const endTracking = (status: 'success' | 'error' = 'success', error?: any) => {
    if (!startTimeRef.current) return

    const duration = Date.now() - startTimeRef.current
    
    // Track performance metric
    Analytics.trackPerformance(`${operationName}_duration`, duration, {
      status,
      ...metadata
    })

    // Track slow operations
    if (duration > threshold) {
      Analytics.trackEvent('slow_screen_load', {
        operation: operationName,
        duration_ms: duration,
        threshold_ms: threshold,
        ...metadata
      })
    }

    // Finish Sentry transaction
    if (transactionRef.current) {
      transactionRef.current.setStatus(status === 'success' ? 'ok' : 'internal_error')
      if (error) {
        transactionRef.current.setData('error', error)
      }
      transactionRef.current.finish()
    }

    // Reset refs
    startTimeRef.current = undefined
    transactionRef.current = undefined
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (transactionRef.current) {
        transactionRef.current.finish()
      }
    }
  }, [])

  return { startTracking, endTracking }
}

// Hook for tracking TRPC query performance
export function useTRPCPerformanceTracking(
  queryKey: string,
  isLoading: boolean,
  isError: boolean,
  error?: any
) {
  const { startTracking, endTracking } = usePerformanceTracking({
    operationName: `trpc.${queryKey}`,
    metadata: {
      query_type: 'trpc',
      endpoint: queryKey
    }
  })

  useEffect(() => {
    if (isLoading) {
      startTracking()
    } else {
      endTracking(isError ? 'error' : 'success', error)
    }
  }, [isLoading, isError])
}

// Hook for tracking navigation performance
export function useNavigationPerformance(screenName: string) {
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const mountTime = Date.now() - startTimeRef.current
    
    Analytics.trackPerformance('screen_mount_time', mountTime, {
      screen: screenName
    })

    // Track if screen took too long to mount
    if (mountTime > 1000) {
      Analytics.trackEvent('slow_screen_load', {
        screen_name: screenName,
        mount_time_ms: mountTime,
        phase: 'mount'
      })
    }

    return () => {
      Analytics.trackScreenLoadTime(screenName)
    }
  }, [screenName])
}

// Hook for tracking user interactions
export function useInteractionTracking(interactionName: string) {
  const track = (metadata?: Record<string, any>) => {
    const transaction = Analytics.startTransaction(
      `interaction.${interactionName}`,
      'user_interaction'
    )

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        transaction.setTag(key, String(value))
      })
    }

    // Auto-finish after 100ms (typical interaction duration)
    setTimeout(() => {
      transaction.finish()
    }, 100)

    return transaction
  }

  return { track }
}