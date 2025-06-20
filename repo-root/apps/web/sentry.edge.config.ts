import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Edge runtime configuration for healthcare middleware
  environment: process.env.NODE_ENV,
  
  // Minimal sampling for edge runtime (performance critical)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  
  // HIPAA compliance for edge runtime
  beforeSend: (event) => {
    // Strict PHI protection in edge runtime
    if (event.user) {
      event.user = {
        id: '[REDACTED]',
        role: 'unknown'
      }
    }
    
    // Sanitize middleware requests
    if (event.request) {
      if (event.request.headers) {
        // Remove all potentially sensitive headers
        event.request.headers = {
          'user-agent': event.request.headers['user-agent'] || 'unknown',
          'content-type': event.request.headers['content-type'] || 'unknown'
        }
      }
      
      // Sanitize URLs in edge runtime
      if (event.request.url) {
        event.request.url = event.request.url
          .replace(/\/patient\/\d+/g, '/patient/[ID]')
          .replace(/\/api\/.*?\/\d+/g, '/api/[ENDPOINT]/[ID]')
          .replace(/[?&](?:ssn|mrn|patient_id)=[^&]*/g, '')
      }
      
      // Remove request body in edge runtime (too risky for PHI)
      delete event.request.data
    }
    
    return event
  },
  
  // Minimal breadcrumbs for edge runtime
  beforeBreadcrumb: (breadcrumb) => {
    // Only allow navigation and error breadcrumbs
    if (breadcrumb.category !== 'navigation' && breadcrumb.category !== 'error') {
      return null
    }
    
    // Sanitize navigation URLs
    if (breadcrumb.category === 'navigation' && breadcrumb.data?.to) {
      breadcrumb.data.to = breadcrumb.data.to.replace(/\/patient\/\d+/g, '/patient/[ID]')
    }
    
    return breadcrumb
  },
  
  // Edge runtime specific tags
  tags: {
    component: 'edge',
    application: 'locumtruerate',
    compliance: 'hipaa',
    runtime: 'edge'
  },
  
  // Minimal configuration for edge performance
  maxBreadcrumbs: 10,
  maxValueLength: 250,
  normalizeDepth: 1,
  
  // Filter high-frequency edge events
  ignoreErrors: [
    'AbortError',
    'TimeoutError',
    'NetworkError',
    'FetchError'
  ]
})