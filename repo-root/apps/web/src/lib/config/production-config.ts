/**
 * Production Configuration Validation
 * Ensures all production settings are properly configured for HIPAA compliance
 */

import { logger } from '@locumtruerate/shared/src/utils/logger'

export interface ProductionConfig {
  nodeEnv: string
  debugLogsEnabled: boolean
  profilingEnabled: boolean
  logLevel: string
  securityHeadersEnabled: boolean
  httpsOnly: boolean
  deploymentInfo: {
    id?: string
    commitSha?: string
    timestamp?: string
    environment: string
  }
}

/**
 * Validates production configuration and logs warnings for security issues
 */
export function validateProductionConfig(): ProductionConfig {
  const config: ProductionConfig = {
    nodeEnv: process.env.NODE_ENV || 'development',
    debugLogsEnabled: process.env.ENABLE_DEBUG_LOGS === 'true',
    profilingEnabled: process.env.ENABLE_PROFILING === 'true',
    logLevel: process.env.LOG_LEVEL || 'INFO',
    securityHeadersEnabled: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    httpsOnly: process.env.HTTPS_ONLY === 'true',
    deploymentInfo: {
      id: process.env.DEPLOYMENT_ID,
      commitSha: process.env.DEPLOYMENT_COMMIT_SHA,
      timestamp: process.env.DEPLOYMENT_TIMESTAMP,
      environment: process.env.DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV || 'unknown'
    }
  }

  // Production-specific validations
  if (config.nodeEnv === 'production') {
    validateProductionSecurity(config)
  }

  return config
}

/**
 * Validates security settings for production deployment
 */
function validateProductionSecurity(config: ProductionConfig): void {
  const errors: string[] = []
  const warnings: string[] = []

  // Critical security checks
  if (config.debugLogsEnabled) {
    errors.push('Debug logging is enabled in production - this poses a security risk')
  }

  if (config.logLevel === 'DEBUG' || config.logLevel === 'INFO') {
    warnings.push(`Log level is set to '${config.logLevel}' - consider using 'WARN' or 'ERROR' for production`)
  }

  if (config.profilingEnabled) {
    warnings.push('Profiling is enabled in production - this may impact performance')
  }

  if (!config.securityHeadersEnabled) {
    errors.push('Security headers are disabled - this is required for HIPAA compliance')
  }

  if (!config.httpsOnly) {
    errors.push('HTTPS-only mode is disabled - this is required for healthcare applications')
  }

  // Environment variable checks
  const requiredProductionVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NEXTAUTH_SECRET',
    'SENTRY_DSN'
  ]

  const missingVars = requiredProductionVars.filter(varName => !process.env[varName])
  if (missingVars.length > 0) {
    errors.push(`Missing required production environment variables: ${missingVars.join(', ')}`)
  }

  // Check for placeholder values
  const placeholderPatterns = ['placeholder', 'CHANGE_ME', 'YOUR_', 'test_', 'dev_']
  const envVars = Object.entries(process.env)
  
  for (const [key, value] of envVars) {
    if (value && placeholderPatterns.some(pattern => value.includes(pattern))) {
      errors.push(`Environment variable ${key} contains placeholder value`)
    }
  }

  // Log findings
  if (errors.length > 0) {
    errors.forEach(error => logger.error(`Production Config Error: ${error}`))
    throw new Error(`Production configuration errors detected: ${errors.join('; ')}`)
  }

  if (warnings.length > 0) {
    warnings.forEach(warning => logger.warn(`Production Config Warning: ${warning}`))
  }

  logger.info('Production configuration validation completed successfully', {
    environment: config.nodeEnv,
    deploymentId: config.deploymentInfo.id,
    timestamp: config.deploymentInfo.timestamp
  })
}

/**
 * Applies production-specific console overrides to disable debug logging
 */
export function applyProductionLogging(): void {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_DEBUG_LOGS !== 'true') {
    // Override console methods in production
    const originalConsole = { ...console }
    
    // Disable debug and info logs in production
    console.debug = () => {}
    console.info = () => {}
    
    // Keep warnings and errors but format them consistently
    console.warn = (...args) => {
      originalConsole.warn('[WARN]', new Date().toISOString(), ...args)
    }
    
    console.error = (...args) => {
      originalConsole.error('[ERROR]', new Date().toISOString(), ...args)
    }
    
    logger.info('Production logging configuration applied - debug and info logs disabled')
  }
}

/**
 * Gets deployment information for monitoring and debugging
 */
export function getDeploymentInfo() {
  return {
    id: process.env.DEPLOYMENT_ID,
    commitSha: process.env.DEPLOYMENT_COMMIT_SHA,
    timestamp: process.env.DEPLOYMENT_TIMESTAMP,
    environment: process.env.DEPLOYMENT_ENVIRONMENT || process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME
  }
}

/**
 * Security configuration for HIPAA compliance
 */
export function getSecurityConfig() {
  return {
    httpsOnly: process.env.HTTPS_ONLY === 'true',
    hstsMaxAge: parseInt(process.env.HSTS_MAX_AGE || '31536000'), // 1 year default
    securityHeaders: process.env.SECURITY_HEADERS_ENABLED !== 'false',
    auditLogging: {
      enabled: true,
      retentionDays: parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555'), // 7 years
      encryptionEnabled: !!process.env.AUDIT_LOG_ENCRYPTION_KEY
    },
    rateLimiting: {
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '3600000') // 1 hour
    }
  }
}

/**
 * Feature flags configuration based on environment
 */
export function getFeatureFlags() {
  const isProduction = process.env.NODE_ENV === 'production'
  
  return {
    // Analytics and tracking
    analytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    chat: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
    notifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    advancedSearch: process.env.NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH === 'true',
    
    // Payment features
    jobBoostPayments: process.env.ENABLE_JOB_BOOST_PAYMENTS === 'true',
    companyVerification: process.env.ENABLE_COMPANY_VERIFICATION === 'true',
    
    // Development/debugging features (should be disabled in production)
    debugLogs: process.env.ENABLE_DEBUG_LOGS === 'true' && !isProduction,
    profiling: process.env.ENABLE_PROFILING === 'true' && !isProduction,
  }
}