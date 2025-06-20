/**
 * HIPAA-Compliant Audit Logging for LocumTrueRate.com
 * 
 * This module provides structured logging capabilities required for HIPAA compliance,
 * including PHI access tracking, security events, and user activity monitoring.
 */

import { z } from 'zod'

// Audit event types for healthcare compliance
export const AuditEventType = z.enum([
  // Authentication events
  'auth.login.success',
  'auth.login.failure',
  'auth.logout',
  'auth.password_reset',
  'auth.account_locked',
  
  // PHI access events (critical for HIPAA)
  'phi.access',
  'phi.create',
  'phi.update', 
  'phi.delete',
  'phi.export',
  'phi.print',
  
  // User management
  'user.create',
  'user.update',
  'user.delete',
  'user.role_change',
  'user.permission_change',
  
  // Data operations
  'data.backup',
  'data.restore',
  'data.migration',
  'data.purge',
  
  // Security events
  'security.breach_attempt',
  'security.suspicious_activity',
  'security.admin_access',
  'security.configuration_change',
  
  // System events
  'system.startup',
  'system.shutdown',
  'system.error',
  'system.maintenance',
  
  // Application-specific events
  'job.create',
  'job.update',
  'job.delete',
  'application.submit',
  'application.view',
  'payment.process',
  'email.send'
])

export type AuditEventType = z.infer<typeof AuditEventType>

// Severity levels for audit events
export const AuditSeverity = z.enum([
  'critical',   // Security breaches, PHI exposure
  'high',       // Failed authentications, admin actions
  'medium',     // PHI access, data modifications
  'low',        // Normal user activities
  'info'        // System informational events
])

export type AuditSeverity = z.infer<typeof AuditSeverity>

// User context for audit trail
export const AuditUser = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  role: z.string(),
  sessionId: z.string().optional(),
  ipAddress: z.string(),
  userAgent: z.string().optional()
})

export type AuditUser = z.infer<typeof AuditUser>

// PHI-related metadata (when applicable)
export const PHIMetadata = z.object({
  dataType: z.enum(['resume', 'application', 'profile', 'communication']),
  recordId: z.string(),
  fieldAccessed: z.string().optional(),
  purpose: z.string(), // Business justification for access
  patientId: z.string().optional() // If applicable for healthcare workers
})

export type PHIMetadata = z.infer<typeof PHIMetadata>

// Main audit log entry schema
export const AuditLogEntry = z.object({
  // Core identification
  id: z.string(),
  timestamp: z.date(),
  eventType: AuditEventType,
  severity: AuditSeverity,
  
  // User context (required for HIPAA)
  user: AuditUser.optional(),
  
  // Event details
  message: z.string(),
  details: z.record(z.any()).optional(),
  
  // PHI-specific metadata (when applicable)
  phi: PHIMetadata.optional(),
  
  // Technical context
  requestId: z.string().optional(),
  service: z.string(),
  endpoint: z.string().optional(),
  method: z.string().optional(),
  
  // Compliance tracking
  retentionDate: z.date(), // When this log can be purged (7 years for HIPAA)
  encrypted: z.boolean().default(true),
  
  // Error context (if applicable)
  error: z.object({
    code: z.string(),
    message: z.string(),
    stack: z.string().optional()
  }).optional()
})

export type AuditLogEntry = z.infer<typeof AuditLogEntry>

/**
 * HIPAA-compliant audit logger
 */
export class AuditLogger {
  private serviceName: string
  private encryptionKey: string
  
  constructor(serviceName: string, encryptionKey?: string) {
    this.serviceName = serviceName
    this.encryptionKey = encryptionKey || process.env.AUDIT_LOG_ENCRYPTION_KEY || ''
  }

  /**
   * Log a PHI access event (critical for HIPAA compliance)
   */
  async logPHIAccess(
    eventType: Extract<AuditEventType, 'phi.access' | 'phi.create' | 'phi.update' | 'phi.delete' | 'phi.export'>,
    user: AuditUser,
    phi: PHIMetadata,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: 'medium',
      user,
      phi,
      message: `PHI ${eventType.split('.')[1]} by user ${user.id}`,
      details,
      requestId: this.generateRequestId(),
      service: this.serviceName
    })
  }

  /**
   * Log authentication events
   */
  async logAuth(
    eventType: Extract<AuditEventType, 'auth.login.success' | 'auth.login.failure' | 'auth.logout'>,
    user: Partial<AuditUser>,
    details?: Record<string, any>
  ): Promise<void> {
    const severity = eventType === 'auth.login.failure' ? 'high' : 'low'
    
    await this.log({
      eventType,
      severity,
      user: user as AuditUser,
      message: `Authentication event: ${eventType}`,
      details,
      requestId: this.generateRequestId(),
      service: this.serviceName
    })
  }

  /**
   * Log security events
   */
  async logSecurity(
    eventType: Extract<AuditEventType, 'security.breach_attempt' | 'security.suspicious_activity' | 'security.admin_access'>,
    user: AuditUser | undefined,
    message: string,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity: 'critical',
      user,
      message,
      details,
      requestId: this.generateRequestId(),
      service: this.serviceName
    })
  }

  /**
   * Log general application events
   */
  async logEvent(
    eventType: AuditEventType,
    severity: AuditSeverity,
    message: string,
    user?: AuditUser,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType,
      severity,
      user,
      message,
      details,
      requestId: this.generateRequestId(),
      service: this.serviceName
    })
  }

  /**
   * Log system errors with security implications
   */
  async logError(
    error: Error,
    user?: AuditUser,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      eventType: 'system.error',
      severity: 'high',
      user,
      message: `System error: ${error.message}`,
      details,
      error: {
        code: error.name,
        message: error.message,
        stack: error.stack
      },
      requestId: this.generateRequestId(),
      service: this.serviceName
    })
  }

  /**
   * Core logging method with encryption and validation
   */
  private async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'retentionDate' | 'encrypted'>): Promise<void> {
    try {
      // Generate audit log entry
      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        timestamp: new Date(),
        retentionDate: this.calculateRetentionDate(),
        encrypted: true,
        ...entry
      }

      // Validate the entry
      const validatedEntry = AuditLogEntry.parse(auditEntry)

      // Encrypt sensitive data if encryption key is available
      const processedEntry = this.encryptionKey 
        ? await this.encryptSensitiveFields(validatedEntry)
        : validatedEntry

      // Send to multiple destinations for redundancy
      await Promise.all([
        this.writeToDatabase(processedEntry),
        this.writeToLogFile(processedEntry),
        this.sendToSIEM(processedEntry) // Security Information and Event Management
      ])

      // Real-time alerting for critical events
      if (validatedEntry.severity === 'critical') {
        await this.sendCriticalAlert(validatedEntry)
      }

    } catch (error) {
      // Fallback logging - never let audit logging fail silently
      console.error('Audit logging failed:', error)
      await this.writeEmergencyLog(entry, error as Error)
    }
  }

  /**
   * Encrypt sensitive fields in audit log
   */
  private async encryptSensitiveFields(entry: AuditLogEntry): Promise<AuditLogEntry> {
    // In production, implement proper encryption
    // For now, redact sensitive information
    const sanitized = { ...entry }
    
    if (sanitized.user?.email) {
      sanitized.user.email = this.hashPII(sanitized.user.email)
    }
    
    if (sanitized.details) {
      sanitized.details = this.sanitizeDetails(sanitized.details)
    }
    
    return sanitized
  }

  /**
   * Write audit log to database for querying and compliance reporting
   */
  private async writeToDatabase(entry: AuditLogEntry): Promise<void> {
    // In production, implement database writing
    // This would typically use your database client
    console.log('[AUDIT-DB]', JSON.stringify(entry, null, 2))
  }

  /**
   * Write audit log to file for backup and external processing
   */
  private async writeToLogFile(entry: AuditLogEntry): Promise<void> {
    // In production, implement structured log file writing
    // This would typically use a logging library like Winston
    console.log('[AUDIT-FILE]', JSON.stringify(entry))
  }

  /**
   * Send audit log to SIEM system for security monitoring
   */
  private async sendToSIEM(entry: AuditLogEntry): Promise<void> {
    // In production, implement SIEM integration (Splunk, ELK, etc.)
    if (entry.severity === 'critical' || entry.severity === 'high') {
      console.log('[AUDIT-SIEM]', JSON.stringify(entry))
    }
  }

  /**
   * Send critical security alerts
   */
  private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
    // In production, implement alerting (email, Slack, PagerDuty, etc.)
    console.error('[CRITICAL-ALERT]', {
      event: entry.eventType,
      user: entry.user?.id,
      message: entry.message,
      timestamp: entry.timestamp
    })
  }

  /**
   * Emergency logging when primary audit system fails
   */
  private async writeEmergencyLog(entry: any, error: Error): Promise<void> {
    const emergencyEntry = {
      timestamp: new Date().toISOString(),
      level: 'AUDIT_FAILURE',
      originalEntry: entry,
      error: error.message,
      service: this.serviceName
    }
    
    // Write to stderr as last resort
    console.error('[EMERGENCY-AUDIT]', JSON.stringify(emergencyEntry))
  }

  /**
   * Generate unique audit log ID
   */
  private generateAuditId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 15)
    return `audit_${timestamp}_${random}`
  }

  /**
   * Generate unique request ID for correlation
   */
  private generateRequestId(): string {
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 11)}`
  }

  /**
   * Calculate retention date (7 years for HIPAA)
   */
  private calculateRetentionDate(): Date {
    const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555') // 7 years
    const retentionDate = new Date()
    retentionDate.setDate(retentionDate.getDate() + retentionDays)
    return retentionDate
  }

  /**
   * Hash PII for privacy protection
   */
  private hashPII(value: string): string {
    // In production, use proper cryptographic hashing
    // This is a simple example - use bcrypt or similar in production
    return `[HASHED:${value.length}]`
  }

  /**
   * Sanitize details object to remove sensitive information
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details }
    
    // Remove common sensitive field names
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount', 'apiKey', 'token']
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }
    
    return sanitized
  }
}

/**
 * Singleton audit logger instance
 */
let auditLogger: AuditLogger | null = null

/**
 * Get or create the audit logger instance
 */
export function getAuditLogger(serviceName?: string): AuditLogger {
  if (!auditLogger) {
    auditLogger = new AuditLogger(serviceName || 'locumtruerate-api')
  }
  return auditLogger
}

/**
 * Convenience functions for common audit events
 */
export const audit = {
  /**
   * Log PHI access (required for HIPAA)
   */
  phiAccess: (user: AuditUser, phi: PHIMetadata, details?: Record<string, any>) => 
    getAuditLogger().logPHIAccess('phi.access', user, phi, details),

  /**
   * Log user login
   */
  loginSuccess: (user: AuditUser, details?: Record<string, any>) =>
    getAuditLogger().logAuth('auth.login.success', user, details),

  /**
   * Log failed login attempt
   */
  loginFailure: (attempt: Partial<AuditUser>, details?: Record<string, any>) =>
    getAuditLogger().logAuth('auth.login.failure', attempt, details),

  /**
   * Log security event
   */
  securityEvent: (type: Extract<AuditEventType, 'security.breach_attempt' | 'security.suspicious_activity'>, user: AuditUser | undefined, message: string, details?: Record<string, any>) =>
    getAuditLogger().logSecurity(type, user, message, details),

  /**
   * Log application error
   */
  error: (error: Error, user?: AuditUser, details?: Record<string, any>) =>
    getAuditLogger().logError(error, user, details),

  /**
   * Log general event
   */
  event: (type: AuditEventType, severity: AuditSeverity, message: string, user?: AuditUser, details?: Record<string, any>) =>
    getAuditLogger().logEvent(type, severity, message, user, details)
}

export default audit