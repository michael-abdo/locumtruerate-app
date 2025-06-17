import { OnboardingAnalytics } from './types'

interface AnalyticsEvent {
  event: string
  properties: Record<string, any>
  timestamp: Date
  userId?: string
  sessionId: string
}

class OnboardingAnalyticsImpl implements OnboardingAnalytics {
  private events: AnalyticsEvent[] = []
  private sessionId: string
  private analyticsProvider?: (event: AnalyticsEvent) => void

  constructor(analyticsProvider?: (event: AnalyticsEvent) => void) {
    this.sessionId = this.generateSessionId()
    this.analyticsProvider = analyticsProvider
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private track(event: string, properties: Record<string, any>, userId?: string) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: new Date(),
      userId,
      sessionId: this.sessionId,
    }

    this.events.push(analyticsEvent)

    // Send to external analytics if provider is configured
    if (this.analyticsProvider) {
      try {
        this.analyticsProvider(analyticsEvent)
      } catch (error) {
        console.warn('Analytics provider error:', error)
      }
    }

    // Also track in local storage for analysis
    this.persistEvent(analyticsEvent)
  }

  private persistEvent(event: AnalyticsEvent) {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('locumtruerate_onboarding_analytics') || '[]'
      const events = JSON.parse(stored)
      events.push(event)
      
      // Keep only last 1000 events
      if (events.length > 1000) {
        events.splice(0, events.length - 1000)
      }
      
      localStorage.setItem('locumtruerate_onboarding_analytics', JSON.stringify(events))
    } catch (error) {
      console.warn('Failed to persist analytics event:', error)
    }
  }

  flowStarted(flowId: string, userId?: string): void {
    this.track('onboarding_flow_started', {
      flow_id: flowId,
      user_agent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      screen_resolution: typeof window !== 'undefined' 
        ? `${window.screen.width}x${window.screen.height}` 
        : 'unknown',
      viewport_size: typeof window !== 'undefined' 
        ? `${window.innerWidth}x${window.innerHeight}` 
        : 'unknown',
    }, userId)
  }

  stepCompleted(flowId: string, stepId: string, timeSpent: number, userId?: string): void {
    this.track('onboarding_step_completed', {
      flow_id: flowId,
      step_id: stepId,
      time_spent_ms: timeSpent,
      time_spent_seconds: Math.round(timeSpent / 1000),
    }, userId)
  }

  stepSkipped(flowId: string, stepId: string, reason?: string, userId?: string): void {
    this.track('onboarding_step_skipped', {
      flow_id: flowId,
      step_id: stepId,
      skip_reason: reason || 'user_skipped',
    }, userId)
  }

  flowCompleted(flowId: string, totalTime: number, completionRate: number, userId?: string): void {
    this.track('onboarding_flow_completed', {
      flow_id: flowId,
      total_time_ms: totalTime,
      total_time_minutes: Math.round(totalTime / 60000),
      completion_rate: completionRate,
      completion_percentage: Math.round(completionRate * 100),
    }, userId)
  }

  flowAbandoned(flowId: string, lastStepId: string, reason?: string, userId?: string): void {
    this.track('onboarding_flow_abandoned', {
      flow_id: flowId,
      last_step_id: lastStepId,
      abandon_reason: reason || 'user_exit',
    }, userId)
  }

  errorOccurred(flowId: string, stepId: string, error: string, userId?: string): void {
    this.track('onboarding_error', {
      flow_id: flowId,
      step_id: stepId,
      error_message: error,
      error_type: 'step_error',
    }, userId)
  }

  // Additional analytics methods
  customEvent(event: string, properties: Record<string, any>, userId?: string): void {
    this.track(event, properties, userId)
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  getStoredEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem('locumtruerate_onboarding_analytics') || '[]'
      return JSON.parse(stored).map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }))
    } catch (error) {
      console.warn('Failed to retrieve stored analytics:', error)
      return []
    }
  }

  getAnalyticsSummary(): {
    totalFlowsStarted: number
    totalFlowsCompleted: number
    averageCompletionRate: number
    averageTimePerFlow: number
    mostSkippedSteps: Array<{ stepId: string; count: number }>
    errorRate: number
    popularFlows: Array<{ flowId: string; starts: number; completions: number }>
  } {
    const events = this.getStoredEvents()
    
    const flowsStarted = events.filter(e => e.event === 'onboarding_flow_started')
    const flowsCompleted = events.filter(e => e.event === 'onboarding_flow_completed')
    const stepsSkipped = events.filter(e => e.event === 'onboarding_step_skipped')
    const errors = events.filter(e => e.event === 'onboarding_error')
    
    // Calculate completion rates
    const completionRates = flowsCompleted.map(e => e.properties.completion_rate).filter(Boolean)
    const averageCompletionRate = completionRates.length > 0 
      ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length 
      : 0
    
    // Calculate average time
    const flowTimes = flowsCompleted.map(e => e.properties.total_time_ms).filter(Boolean)
    const averageTimePerFlow = flowTimes.length > 0 
      ? flowTimes.reduce((sum, time) => sum + time, 0) / flowTimes.length 
      : 0
    
    // Most skipped steps
    const skipCounts: Record<string, number> = {}
    stepsSkipped.forEach(event => {
      const stepId = event.properties.step_id
      skipCounts[stepId] = (skipCounts[stepId] || 0) + 1
    })
    const mostSkippedSteps = Object.entries(skipCounts)
      .map(([stepId, count]) => ({ stepId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    // Popular flows
    const flowStats: Record<string, { starts: number; completions: number }> = {}
    flowsStarted.forEach(event => {
      const flowId = event.properties.flow_id
      if (!flowStats[flowId]) flowStats[flowId] = { starts: 0, completions: 0 }
      flowStats[flowId].starts++
    })
    flowsCompleted.forEach(event => {
      const flowId = event.properties.flow_id
      if (!flowStats[flowId]) flowStats[flowId] = { starts: 0, completions: 0 }
      flowStats[flowId].completions++
    })
    const popularFlows = Object.entries(flowStats)
      .map(([flowId, stats]) => ({ flowId, ...stats }))
      .sort((a, b) => b.starts - a.starts)
      .slice(0, 5)
    
    // Error rate
    const totalSteps = events.filter(e => 
      e.event === 'onboarding_step_completed' || e.event === 'onboarding_error'
    ).length
    const errorRate = totalSteps > 0 ? errors.length / totalSteps : 0
    
    return {
      totalFlowsStarted: flowsStarted.length,
      totalFlowsCompleted: flowsCompleted.length,
      averageCompletionRate,
      averageTimePerFlow,
      mostSkippedSteps,
      errorRate,
      popularFlows,
    }
  }

  clearStoredEvents(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('locumtruerate_onboarding_analytics')
    this.events = []
  }
}

// Factory function to create analytics instance
export function createOnboardingAnalytics(analyticsProvider?: (event: AnalyticsEvent) => void): OnboardingAnalytics {
  return new OnboardingAnalyticsImpl(analyticsProvider)
}

// Integration helpers for popular analytics platforms
export const analyticsIntegrations = {
  // Google Analytics 4
  googleAnalytics: (event: AnalyticsEvent) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.event, {
        custom_parameter_1: JSON.stringify(event.properties),
        user_id: event.userId,
        session_id: event.sessionId,
      })
    }
  },
  
  // Mixpanel
  mixpanel: (event: AnalyticsEvent) => {
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      (window as any).mixpanel.track(event.event, {
        ...event.properties,
        user_id: event.userId,
        session_id: event.sessionId,
        timestamp: event.timestamp.toISOString(),
      })
    }
  },
  
  // Amplitude
  amplitude: (event: AnalyticsEvent) => {
    if (typeof window !== 'undefined' && (window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(event.event, {
        ...event.properties,
        user_id: event.userId,
        session_id: event.sessionId,
      })
    }
  },
  
  // Custom API endpoint
  customApi: (endpoint: string) => (event: AnalyticsEvent) => {
    if (typeof window === 'undefined') return
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }).catch(error => {
      console.warn('Custom analytics API error:', error)
    })
  },
}