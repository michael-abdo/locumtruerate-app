/**
 * Production Initialization
 * This module is called on app startup to ensure production configuration is correct
 */

import { validateProductionConfig, applyProductionLogging, getDeploymentInfo } from './production-config'
import { logger } from '@locumtruerate/shared/src/utils/logger'

/**
 * Initialize production configuration and apply security settings
 * This should be called as early as possible in the application startup
 */
export function initializeProduction(): void {
  try {
    // Apply production logging configuration first
    applyProductionLogging()
    
    // Validate all production settings
    const config = validateProductionConfig()
    
    // Log deployment information
    const deploymentInfo = getDeploymentInfo()
    logger.info('Application starting with deployment info', deploymentInfo)
    
    // Log environment status
    logger.info('Production initialization completed', {
      environment: config.nodeEnv,
      debugLogsEnabled: config.debugLogsEnabled,
      logLevel: config.logLevel,
      securityHeaders: config.securityHeadersEnabled,
      httpsOnly: config.httpsOnly
    })
    
    // In production, log a startup message
    if (config.nodeEnv === 'production') {
      logger.info('LocumTrueRate.com production application started successfully', {
        deploymentId: deploymentInfo.id,
        version: deploymentInfo.version,
        buildTime: deploymentInfo.buildTime
      })
    }
    
  } catch (error) {
    // Critical error - log and exit
    logger.fatal('Production initialization failed', error as Error)
    
    if (process.env.NODE_ENV === 'production') {
      // In production, exit the process if configuration is invalid
      console.error('CRITICAL: Production configuration validation failed. Exiting.')
      process.exit(1)
    } else {
      // In development, just warn but continue
      console.warn('Production validation failed in development mode:', error)
    }
  }
}

/**
 * Validate runtime environment and log status
 */
export function validateRuntimeEnvironment(): boolean {
  const checks = {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasAuth: !!process.env.CLERK_SECRET_KEY,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    hasSentry: !!process.env.SENTRY_DSN,
    hasStripe: !!process.env.STRIPE_SECRET_KEY
  }
  
  const missingRequired = []
  
  if (!checks.hasDatabase) missingRequired.push('DATABASE_URL')
  if (!checks.hasAuth) missingRequired.push('CLERK_SECRET_KEY')
  if (!checks.hasJwtSecret) missingRequired.push('JWT_SECRET')
  if (!checks.hasNextAuthSecret) missingRequired.push('NEXTAUTH_SECRET')
  
  // Sentry and Stripe are required in production
  if (checks.nodeEnv === 'production') {
    if (!checks.hasSentry) missingRequired.push('SENTRY_DSN')
    if (!checks.hasStripe) missingRequired.push('STRIPE_SECRET_KEY')
  }
  
  if (missingRequired.length > 0) {
    logger.error('Missing required environment variables', { missing: missingRequired })
    return false
  }
  
  logger.info('Runtime environment validation passed', checks)
  return true
}

/**
 * Security hardening for production
 */
export function applySecurityHardening(): void {
  if (process.env.NODE_ENV === 'production') {
    // Disable Node.js warnings in production
    process.removeAllListeners('warning')
    
    // Set process title for monitoring
    process.title = 'locumtruerate-web'
    
    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception in production', error)
      // Give time for logs to flush before exiting
      setTimeout(() => process.exit(1), 1000)
    })
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled promise rejection in production', new Error(String(reason)), {
        promise: promise.toString()
      })
    })
    
    logger.info('Production security hardening applied')
  }
}

/**
 * Performance monitoring setup
 */
export function initializePerformanceMonitoring(): void {
  if (process.env.NODE_ENV === 'production') {
    // Enable performance monitoring only in production
    if (typeof performance !== 'undefined') {
      // Log startup performance
      const startupTime = performance.now()
      logger.info('Application startup performance', {
        startupTime: `${startupTime.toFixed(2)}ms`,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      })
    }
    
    // Monitor memory usage in production
    setInterval(() => {
      const memUsage = process.memoryUsage()
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      }
      
      // Log memory usage if it exceeds thresholds
      if (memUsageMB.heapUsed > 512 || memUsageMB.rss > 1024) {
        logger.warn('High memory usage detected', memUsageMB)
      }
    }, 60000) // Check every minute
  }
}

/**
 * Complete production initialization
 * Call this in your main application entry point
 */
export function initializeProductionApp(): void {
  // Step 1: Apply security hardening
  applySecurityHardening()
  
  // Step 2: Initialize production configuration
  initializeProduction()
  
  // Step 3: Validate runtime environment
  const isValid = validateRuntimeEnvironment()
  
  if (!isValid && process.env.NODE_ENV === 'production') {
    logger.fatal('Runtime environment validation failed in production')
    process.exit(1)
  }
  
  // Step 4: Initialize performance monitoring
  initializePerformanceMonitoring()
  
  logger.info('Production application initialization completed successfully')
}