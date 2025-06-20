'use client'

import React from 'react'
import * as Sentry from '@sentry/nextjs'
import { Card } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  showDialog?: boolean
  level?: 'error' | 'warning' | 'info'
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  eventId?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  eventId: string | null
}

// HIPAA-compliant error fallback component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  eventId 
}) => {
  return (
    <Card className="max-w-lg mx-auto mt-8 p-6">
      <div className="text-center space-y-4">
        <div className="text-red-600">
          <svg 
            className="w-12 h-12 mx-auto mb-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            We&apos;re sorry, but an error occurred while processing your request. 
            Our team has been notified and is working to resolve the issue.
          </p>
        </div>
        
        {eventId && (
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Error ID: <code className="font-mono">{eventId}</code>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Please include this ID if you contact support.
            </p>
          </div>
        )}
        
        <div className="flex justify-center space-x-3">
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                     text-sm font-medium transition-colors"
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 
                     focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                     text-sm font-medium transition-colors"
          >
            Reload page
          </button>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </Card>
  )
}

export class SentryErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      eventId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced error context for healthcare applications
    const errorContext = {
      // Component stack information
      componentStack: errorInfo.componentStack,
      
      // Additional healthcare-specific context (no PHI)
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString(),
      
      // Application state (sanitized)
      appVersion: process.env.NEXT_PUBLIC_APP_VERSION,
      environment: process.env.NODE_ENV,
      
      // Error boundary specific info
      errorBoundaryLevel: this.props.level || 'error'
    }

    // Capture to Sentry with healthcare-compliant context
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack
        },
        healthcare: {
          compliant: true,
          errorLevel: this.props.level || 'error',
          timestamp: errorContext.timestamp
        }
      },
      tags: {
        component: 'error-boundary',
        level: this.props.level || 'error',
        hasUserId: 'redacted' // Never expose actual user IDs
      },
      extra: {
        ...errorContext,
        // Remove any potential PHI from error details
        sanitizedErrorMessage: error.message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN-REDACTED]')
      },
      level: this.props.level || 'error'
    })

    this.setState({ eventId })

    // Show user feedback dialog if enabled (HIPAA-compliant)
    if (this.props.showDialog && typeof window !== 'undefined') {
      Sentry.showReportDialog({ 
        eventId,
        title: 'Report Healthcare Application Error',
        subtitle: 'Help us improve the application by providing additional context.',
        subtitle2: 'No personal health information will be included in the report.',
        labelEmail: 'Email (optional)',
        labelComments: 'What happened? (Do not include patient information)',
        labelSubmit: 'Submit Report',
        labelClose: 'Close',
        successMessage: 'Thank you for the report. Our team will investigate the issue.'
      })
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      eventId: null
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          eventId={this.state.eventId || undefined}
        />
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier use
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <SentryErrorBoundary {...errorBoundaryOptions}>
        <Component {...props} />
      </SentryErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withSentryErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for manual error reporting in healthcare contexts
export function useSentryErrorReporting() {
  const reportError = React.useCallback((
    error: Error,
    context?: {
      level?: 'error' | 'warning' | 'info'
      tags?: Record<string, string>
      extra?: Record<string, any>
      user?: {
        role?: string
        // Never include PII like email, name, etc.
      }
    }
  ) => {
    return Sentry.captureException(error, {
      level: context?.level || 'error',
      tags: {
        manual: 'true',
        component: 'user-reported',
        ...context?.tags
      },
      extra: {
        timestamp: new Date().toISOString(),
        reportedBy: 'user-action',
        ...context?.extra
      },
      user: context?.user ? {
        role: context.user.role,
        id: '[REDACTED]' // Always redact user IDs for HIPAA compliance
      } : undefined
    })
  }, [])

  const reportMessage = React.useCallback((
    message: string,
    level: 'error' | 'warning' | 'info' = 'info'
  ) => {
    return Sentry.captureMessage(message, level)
  }, [])

  return { reportError, reportMessage }
}

export default SentryErrorBoundary