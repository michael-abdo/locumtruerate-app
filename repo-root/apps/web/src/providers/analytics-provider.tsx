'use client'

import { createContext, useContext, useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
// Safe useUser hook that doesn't fail if Clerk isn't initialized
const useSafeUser = () => {
  try {
    const { useUser } = require('@clerk/nextjs')
    return useUser()
  } catch {
    return { user: null }
  }
}
import { trpc } from './trpc-provider'

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void
  pageView: (page: string, title?: string) => void
  identify: (userId: string, traits?: Record<string, any>) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useSafeUser()
  const trackMutation = trpc.analytics.track.useMutation()
  const pageViewMutation = trpc.analytics.pageView.useMutation()
  
  // Track page loads
  const pageLoadTime = useRef<number>(Date.now())
  const hasTrackedPageView = useRef<boolean>(false)
  
  // Generate session ID (persist in sessionStorage)
  const getSessionId = () => {
    if (typeof window === 'undefined') return 'ssr-session'
    
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }
  
  // Track page views on route changes
  useEffect(() => {
    const trackPageView = async () => {
      if (hasTrackedPageView.current) return
      hasTrackedPageView.current = true
      
      const loadTime = Date.now() - pageLoadTime.current
      const page = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
      
      try {
        await pageViewMutation.mutateAsync({
          page,
          title: document.title,
          referrer: document.referrer,
          loadTime
        })
      } catch (error) {
        // Fail silently for analytics
        console.warn('Analytics tracking failed:', error)
      }
    }
    
    // Track after a short delay to ensure page is loaded
    const timeout = setTimeout(trackPageView, 100)
    return () => clearTimeout(timeout)
  }, [pathname, searchParams, pageViewMutation])
  
  // Reset page view tracking on route change
  useEffect(() => {
    hasTrackedPageView.current = false
    pageLoadTime.current = Date.now()
  }, [pathname])
  
  const track = async (event: string, properties: Record<string, any> = {}) => {
    try {
      await trackMutation.mutateAsync({
        event,
        properties: {
          ...properties,
          sessionId: getSessionId(),
          timestamp: new Date().toISOString(),
          userId: user?.id,
          userEmail: user?.emailAddresses[0]?.emailAddress
        },
        page: pathname,
        referrer: document.referrer
      })
    } catch (error) {
      // Fail silently for analytics
      console.warn('Analytics tracking failed:', error)
    }
  }
  
  const pageView = async (page: string, title?: string) => {
    try {
      await pageViewMutation.mutateAsync({
        page,
        title: title || document.title,
        referrer: document.referrer,
        loadTime: Date.now() - pageLoadTime.current
      })
    } catch (error) {
      // Fail silently for analytics
      console.warn('Analytics page view tracking failed:', error)
    }
  }
  
  const identify = async (userId: string, traits: Record<string, any> = {}) => {
    // Track user identification
    await track('user_identified', {
      userId,
      traits
    })
  }
  
  // Track user login/logout events
  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt
      })
    }
  }, [user])
  
  const value: AnalyticsContextType = {
    track,
    pageView,
    identify
  }
  
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}

// Higher-order component for tracking component interactions
export function withAnalytics<T extends object>(
  Component: React.ComponentType<T>,
  eventName: string
) {
  return function AnalyticsWrappedComponent(props: T) {
    const { track } = useAnalytics()
    
    useEffect(() => {
      track(`component_mounted`, { component: eventName })
    }, [])
    
    return <Component {...props} />
  }
}

// Hook for tracking specific interactions
export function useTrackEvent() {
  const { track } = useAnalytics()
  
  return {
    trackClick: (element: string, properties?: Record<string, any>) => {
      track('click', { element, ...properties })
    },
    trackFormSubmit: (formName: string, properties?: Record<string, any>) => {
      track('form_submit', { formName, ...properties })
    },
    trackJobView: (jobId: string, jobTitle: string, properties?: Record<string, any>) => {
      track('job_view', { jobId, jobTitle, ...properties })
    },
    trackJobApplication: (jobId: string, jobTitle: string, properties?: Record<string, any>) => {
      track('job_application', { jobId, jobTitle, ...properties })
    },
    trackSearch: (query: string, results: number, properties?: Record<string, any>) => {
      track('search', { query, results, ...properties })
    },
    trackFeatureUsage: (feature: string, properties?: Record<string, any>) => {
      track('feature_usage', { feature, ...properties })
    },
    trackError: (error: string, context?: string, properties?: Record<string, any>) => {
      track('error', { error, context, ...properties })
    }
  }
}