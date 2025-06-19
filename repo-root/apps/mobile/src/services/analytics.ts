/**
 * Analytics and Crash Reporting Service
 * 
 * Unified analytics service for tracking user behavior, performance metrics,
 * and crash reporting across the mobile application
 */

import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Analytics event types
export type AnalyticsEvent = 
  // Navigation events
  | 'screen_view'
  | 'tab_switched'
  | 'deep_link_opened'
  
  // Authentication events
  | 'sign_up_started'
  | 'sign_up_completed'
  | 'sign_in'
  | 'sign_out'
  | 'biometric_auth_enabled'
  | 'biometric_auth_used'
  
  // Job interaction events
  | 'job_viewed'
  | 'job_saved'
  | 'job_applied'
  | 'job_shared'
  | 'job_search'
  
  // Calculator events
  | 'calculator_opened'
  | 'calculator_completed'
  | 'calculation_saved'
  | 'calculation_shared'
  
  // Payment events
  | 'subscription_viewed'
  | 'subscription_selected'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  
  // Performance events
  | 'app_launched'
  | 'app_backgrounded'
  | 'app_foregrounded'
  | 'slow_screen_load'
  | 'api_error'

interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined
}

interface UserProperties {
  userId?: string
  email?: string
  subscriptionTier?: 'FREE' | 'PRO' | 'ENTERPRISE'
  userType?: 'candidate' | 'employer'
  accountAge?: number
}

class AnalyticsService {
  private initialized = false
  private userId: string | null = null
  private userProperties: UserProperties = {}
  private sessionStartTime: number = Date.now()
  private screenStartTime: Map<string, number> = new Map()

  /**
   * Initialize analytics and crash reporting
   */
  async initialize() {
    if (this.initialized) return

    try {
      // Initialize Sentry for crash reporting
      const sentryDsn = Constants.expoConfig?.extra?.sentryDsn
      
      if (sentryDsn && sentryDsn !== 'https://your-sentry-dsn@sentry.io/your-project-id') {
        Sentry.init({
          dsn: sentryDsn,
          environment: __DEV__ ? 'development' : 'production',
          tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 10% in production
          attachScreenshot: true,
          attachStacktrace: true,
          beforeSend: (event, hint) => {
            // Filter out sensitive information
            if (event.request?.cookies) {
              delete event.request.cookies
            }
            if (event.user?.email) {
              event.user.email = this.hashEmail(event.user.email)
            }
            return event
          },
          integrations: [
            new Sentry.ReactNativeTracing({
              routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
              tracingOptions: {
                shouldCreateSpanForRequest: (url) => {
                  // Don't create spans for analytics endpoints
                  return !url.includes('analytics') && !url.includes('tracking')
                },
              },
            }),
          ],
        })
      }

      // Track app launch
      this.trackEvent('app_launched', {
        platform: Platform.OS,
        version: Constants.expoConfig?.version,
        buildNumber: Platform.OS === 'ios' 
          ? Constants.expoConfig?.ios?.buildNumber 
          : Constants.expoConfig?.android?.versionCode,
      })

      this.initialized = true
    } catch (error) {
      // Log initialization errors in development only
      if (__DEV__) {
        console.error('Failed to initialize analytics:', error)
      }
    }
  }

  /**
   * Set user identity for analytics
   */
  identify(userId: string, properties?: UserProperties) {
    this.userId = userId
    this.userProperties = { ...this.userProperties, ...properties }

    // Set Sentry user context
    Sentry.setUser({
      id: userId,
      email: properties?.email ? this.hashEmail(properties.email) : undefined,
      subscription_tier: properties?.subscriptionTier,
    })

    // Set custom user properties
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined) {
          Sentry.setTag(key, String(value))
        }
      })
    }
  }

  /**
   * Clear user identity (on logout)
   */
  reset() {
    this.userId = null
    this.userProperties = {}
    Sentry.setUser(null)
  }

  /**
   * Track analytics event
   */
  trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties) {
    if (!this.initialized || !Constants.expoConfig?.extra?.analyticsEnabled) {
      return
    }

    try {
      const eventData = {
        event,
        timestamp: new Date().toISOString(),
        session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000),
        platform: Platform.OS,
        ...properties,
      }

      // Send to Sentry as breadcrumb
      Sentry.addBreadcrumb({
        message: event,
        category: 'analytics',
        level: 'info',
        data: eventData,
      })

      // Log in development
      if (__DEV__) {
        console.log('📊 Analytics Event:', event, properties)
      }

      // Here you would send to your analytics backend
      // For now, we'll store in a queue for batch sending
      this.queueEvent(eventData)
    } catch (error) {
      console.error('Failed to track event:', error)
    }
  }

  /**
   * Track screen view with performance monitoring
   */
  trackScreen(screenName: string, properties?: AnalyticsProperties) {
    // Track screen view event
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    })

    // Start performance tracking for this screen
    this.screenStartTime.set(screenName, Date.now())

    // Create Sentry transaction for screen
    const transaction = Sentry.startTransaction({
      name: `Screen: ${screenName}`,
      op: 'navigation',
    })
    
    Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction))

    // Auto-finish transaction after 3 seconds if not manually finished
    setTimeout(() => {
      if (transaction.status !== 'ok') {
        transaction.finish()
      }
    }, 3000)
  }

  /**
   * Track screen load performance
   */
  trackScreenLoadTime(screenName: string) {
    const startTime = this.screenStartTime.get(screenName)
    if (!startTime) return

    const loadTime = Date.now() - startTime
    this.screenStartTime.delete(screenName)

    // Track as performance metric
    this.trackPerformance('screen_load_time', loadTime, {
      screen_name: screenName,
    })

    // Track slow loads as separate events
    if (loadTime > 3000) {
      this.trackEvent('slow_screen_load', {
        screen_name: screenName,
        load_time_ms: loadTime,
      })
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: string, value: number, tags?: Record<string, string>) {
    if (!Constants.expoConfig?.extra?.performanceMonitoring) {
      return
    }

    try {
      // Send to Sentry as measurement
      const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
      if (transaction) {
        transaction.setMeasurement(metric, value, 'millisecond')
        
        if (tags) {
          Object.entries(tags).forEach(([key, value]) => {
            transaction.setTag(key, value)
          })
        }
      }

      // Log in development
      if (__DEV__) {
        console.log('⚡ Performance Metric:', metric, value, tags)
      }
    } catch (error) {
      console.error('Failed to track performance:', error)
    }
  }

  /**
   * Track API errors
   */
  trackApiError(endpoint: string, error: any, metadata?: Record<string, any>) {
    this.trackEvent('api_error', {
      endpoint,
      error_message: error.message || 'Unknown error',
      error_code: error.code,
      ...metadata,
    })

    // Also capture in Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'api_error',
        endpoint,
      },
      extra: metadata,
    })
  }

  /**
   * Capture non-fatal errors
   */
  captureError(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
      extra: context,
    })
  }

  /**
   * Capture messages (for debugging)
   */
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level)
  }

  /**
   * Add custom breadcrumb
   */
  addBreadcrumb(message: string, data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    })
  }

  /**
   * Set custom context
   */
  setContext(key: string, context: Record<string, any>) {
    Sentry.setContext(key, context)
  }

  /**
   * Start a custom transaction
   */
  startTransaction(name: string, op: string = 'custom') {
    return Sentry.startTransaction({ name, op })
  }

  // Private helper methods

  private hashEmail(email: string): string {
    // Simple hash for privacy (in production, use proper hashing)
    return email.split('@')[0].substring(0, 3) + '***@' + email.split('@')[1]
  }

  private eventQueue: any[] = []
  private queueEvent(event: any) {
    this.eventQueue.push(event)
    
    // Batch send every 10 events or 30 seconds
    if (this.eventQueue.length >= 10) {
      this.flushEvents()
    }
  }

  private flushEvents() {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    // In production, send to your analytics endpoint
    // For now, just log
    if (__DEV__) {
      console.log('📤 Flushing analytics events:', events.length)
    }
  }
}

// Export singleton instance
export const Analytics = new AnalyticsService()

// Export convenience tracking functions
export const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => 
  Analytics.trackEvent(event, properties)

export const trackScreen = (screenName: string, properties?: AnalyticsProperties) => 
  Analytics.trackScreen(screenName, properties)

export const trackPerformance = (metric: string, value: number, tags?: Record<string, string>) => 
  Analytics.trackPerformance(metric, value, tags)

export const captureError = (error: Error, context?: Record<string, any>) => 
  Analytics.captureError(error, context)