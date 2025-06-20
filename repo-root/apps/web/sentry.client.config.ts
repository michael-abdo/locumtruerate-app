import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Healthcare-specific configuration
  environment: process.env.NODE_ENV,
  
  // Performance monitoring for healthcare applications
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session tracking for HIPAA audit requirements
  autoSessionTracking: true,
  
  // Privacy and HIPAA compliance configurations
  beforeSend: (event) => {
    // Remove PII/PHI from error reports
    if (event.user) {
      // Remove email and other personal identifiers for HIPAA compliance
      delete event.user.email
      delete event.user.ip_address
      
      // Keep only minimal user context for debugging
      event.user = {
        id: event.user.id ? '[REDACTED]' : undefined,
        role: event.user.role || 'unknown'
      }
    }
    
    // Sanitize request data to remove potential PHI
    if (event.request?.data) {
      const sanitizedData = { ...event.request.data }
      
      // Remove common PHI fields
      const phiFields = [
        'ssn', 'socialSecurityNumber', 'dateOfBirth', 'dob',
        'medicalRecordNumber', 'mrn', 'patientId', 'diagnosis',
        'treatment', 'medication', 'bloodType', 'allergies',
        'insuranceNumber', 'policyNumber', 'phone', 'address',
        'emergencyContact', 'nextOfKin'
      ]
      
      phiFields.forEach(field => {
        if (sanitizedData[field]) {
          sanitizedData[field] = '[REDACTED-PHI]'
        }
      })
      
      event.request.data = sanitizedData
    }
    
    // Filter out non-critical errors in production
    if (process.env.NODE_ENV === 'production') {
      // Don't send client-side network errors (often user connectivity issues)
      if (event.exception?.values?.[0]?.type === 'NetworkError') {
        return null
      }
      
      // Don't send authentication errors (handled by Clerk)
      if (event.message?.includes('Authentication')) {
        return null
      }
    }
    
    return event
  },
  
  // Security headers and content filtering
  beforeBreadcrumb: (breadcrumb) => {
    // Filter out navigation breadcrumbs that might contain PHI in URLs
    if (breadcrumb.category === 'navigation' && breadcrumb.data?.from) {
      // Sanitize URLs to remove potential patient identifiers
      breadcrumb.data.from = breadcrumb.data.from.replace(/\/patient\/\d+/g, '/patient/[ID]')
      breadcrumb.data.to = breadcrumb.data.to?.replace(/\/patient\/\d+/g, '/patient/[ID]')
    }
    
    // Filter out console logs that might contain sensitive data
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      if (breadcrumb.message?.includes('password') || 
          breadcrumb.message?.includes('ssn') ||
          breadcrumb.message?.includes('medical')) {
        return null
      }
    }
    
    return breadcrumb
  },
  
  // Healthcare application specific tags
  tags: {
    component: 'frontend',
    application: 'locumtruerate',
    compliance: 'hipaa'
  },
  
  // Release tracking for production deployments
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Integration configurations
  integrations: [
    new Sentry.BrowserTracing({
      // Performance monitoring for critical healthcare flows
      tracingOrigins: [
        'localhost',
        process.env.NEXT_PUBLIC_API_URL,
        /^\//  // Relative URLs
      ]
    })
  ],
  
  // Error filtering for production
  ignoreErrors: [
    // Browser extension errors
    'Non-Error promise rejection captured',
    'ResizeObserver loop limit exceeded',
    
    // Network errors that don't indicate application issues
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    
    // Authentication errors handled by Clerk
    'Unauthenticated',
    'Session expired'
  ]
})