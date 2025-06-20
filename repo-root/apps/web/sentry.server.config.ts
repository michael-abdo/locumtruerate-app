import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Healthcare-specific server configuration
  environment: process.env.NODE_ENV,
  
  // Performance monitoring for server-side operations
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Server-side performance monitoring
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // HIPAA compliance configurations for server-side errors
  beforeSend: (event) => {
    // Enhanced PHI protection for server-side events
    if (event.user) {
      // Complete removal of user PII for server-side logging
      event.user = {
        id: '[REDACTED]',
        role: event.user.role || 'unknown'
      }
    }
    
    // Sanitize server request data
    if (event.request) {
      // Remove headers that might contain sensitive information
      if (event.request.headers) {
        const sanitizedHeaders = { ...event.request.headers }
        delete sanitizedHeaders.authorization
        delete sanitizedHeaders.cookie
        delete sanitizedHeaders['x-api-key']
        delete sanitizedHeaders['x-auth-token']
        event.request.headers = sanitizedHeaders
      }
      
      // Sanitize request body for PHI
      if (event.request.data) {
        const sanitizedData = { ...event.request.data }
        
        // Comprehensive PHI field removal
        const phiFields = [
          'ssn', 'socialSecurityNumber', 'dateOfBirth', 'dob',
          'medicalRecordNumber', 'mrn', 'patientId', 'diagnosis',
          'treatment', 'medication', 'bloodType', 'allergies',
          'insuranceNumber', 'policyNumber', 'phone', 'address',
          'emergencyContact', 'nextOfKin', 'email', 'password',
          'creditCard', 'bankAccount', 'routingNumber', 'taxId'
        ]
        
        phiFields.forEach(field => {
          if (sanitizedData[field]) {
            sanitizedData[field] = '[REDACTED-PHI]'
          }
        })
        
        event.request.data = sanitizedData
      }
      
      // Sanitize URL parameters that might contain patient identifiers
      if (event.request.url) {
        event.request.url = event.request.url
          .replace(/\/patient\/\d+/g, '/patient/[ID]')
          .replace(/\/medical-record\/\d+/g, '/medical-record/[ID]')
          .replace(/\/appointment\/\d+/g, '/appointment/[ID]')
          .replace(/ssn=[\d-]+/g, 'ssn=[REDACTED]')
          .replace(/mrn=\w+/g, 'mrn=[REDACTED]')
      }
    }
    
    // Filter database errors that might expose sensitive data
    if (event.exception?.values?.[0]?.value?.includes('DETAIL:')) {
      // PostgreSQL detail messages might contain sensitive data
      const exception = event.exception.values[0]
      exception.value = exception.value.split('DETAIL:')[0] + 'DETAIL: [REDACTED]'
    }
    
    // Filter authentication errors
    if (event.message?.includes('Authentication failed') ||
        event.message?.includes('Invalid credentials')) {
      return null // Don't send auth failures to reduce noise
    }
    
    return event
  },
  
  // Server-side breadcrumb filtering
  beforeBreadcrumb: (breadcrumb) => {
    // Filter database query breadcrumbs that might contain PHI
    if (breadcrumb.category === 'query' && breadcrumb.data?.sql) {
      // Redact potential PHI from SQL queries
      breadcrumb.data.sql = breadcrumb.data.sql
        .replace(/ssn\s*=\s*'[^']+'/gi, "ssn = '[REDACTED]'")
        .replace(/email\s*=\s*'[^']+'/gi, "email = '[REDACTED]'")
        .replace(/phone\s*=\s*'[^']+'/gi, "phone = '[REDACTED]'")
    }
    
    // Filter HTTP request breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      breadcrumb.data.url = breadcrumb.data.url
        .replace(/\/patient\/\d+/g, '/patient/[ID]')
        .replace(/\/medical-record\/\d+/g, '/medical-record/[ID]')
    }
    
    return breadcrumb
  },
  
  // Healthcare application specific tags for server
  tags: {
    component: 'backend',
    application: 'locumtruerate',
    compliance: 'hipaa',
    server: true
  },
  
  // Release tracking
  release: process.env.APP_VERSION,
  
  // Server-specific integrations
  integrations: [
    // Database query tracking (with PHI filtering)
    new Sentry.Integrations.Postgres({
      usePgNative: false
    }),
    
    // HTTP request tracking
    new Sentry.Integrations.Http({
      tracing: true,
      breadcrumbs: true
    })
  ],
  
  // Server error filtering
  ignoreErrors: [
    // Database connection errors (handled by connection pool)
    'Connection terminated',
    'Connection refused',
    
    // Authentication errors (handled by middleware)
    'JsonWebTokenError',
    'TokenExpiredError',
    'NotBeforeError',
    
    // Rate limiting errors
    'Too Many Requests',
    
    // Client disconnect errors
    'ECONNRESET',
    'EPIPE'
  ],
  
  // Additional server configuration for healthcare compliance
  maxBreadcrumbs: 50, // Limit breadcrumbs to prevent PHI accumulation
  maxValueLength: 1000, // Limit value length to prevent PHI exposure
  normalizeDepth: 3, // Limit object depth to prevent PHI in nested objects
  
  // Sampling for high-volume healthcare applications
  beforeSendTransaction: (transaction) => {
    // Reduce noise from health check endpoints
    if (transaction.name?.includes('/health') || 
        transaction.name?.includes('/status')) {
      return Math.random() < 0.1 ? transaction : null
    }
    
    return transaction
  }
})