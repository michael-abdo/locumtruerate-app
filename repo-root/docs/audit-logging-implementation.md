# HIPAA-Compliant Audit Logging Implementation

This document outlines the comprehensive audit logging system implemented for LocumTrueRate.com to meet HIPAA compliance requirements for handling Protected Health Information (PHI).

## 🏥 HIPAA Audit Requirements

### Administrative Safeguards (§164.308)
- **Assigned Security Responsibility** - Designated person responsible for security
- **Workforce Training** - Security awareness and training program
- **Information System Activity Review** - Regular review of audit logs
- **Contingency Plan** - Audit log backup and recovery procedures

### Technical Safeguards (§164.312)
- **Audit Controls** - Hardware, software, and procedural mechanisms
- **Integrity** - PHI must not be improperly altered or destroyed
- **Person or Entity Authentication** - Verify user identity before access
- **Transmission Security** - Guard against unauthorized access during transmission

### Specific Audit Requirements
- **Access Logging** - All PHI access must be logged
- **7-Year Retention** - Audit logs must be retained for 7 years
- **Tamper Resistance** - Logs must be protected from alteration
- **Real-time Monitoring** - Critical events require immediate alerts

## 🛡️ Audit Logger Architecture

### Core Components

#### 1. AuditLogger Class
Central logging service with HIPAA-compliant features:

```typescript
export class AuditLogger {
  private serviceName: string
  private encryptionKey: string
  
  // Core logging methods
  async logPHIAccess(eventType, user, phi, details)
  async logAuth(eventType, user, details)
  async logSecurity(eventType, user, message, details)
  async logEvent(eventType, severity, message, user, details)
  async logError(error, user, details)
}
```

#### 2. Event Types
Comprehensive event taxonomy for healthcare applications:

```typescript
// Authentication events
'auth.login.success' | 'auth.login.failure' | 'auth.logout'

// PHI access events (critical for HIPAA)
'phi.access' | 'phi.create' | 'phi.update' | 'phi.delete' | 'phi.export'

// Security events
'security.breach_attempt' | 'security.suspicious_activity' | 'security.admin_access'

// User management
'user.create' | 'user.update' | 'user.delete' | 'user.role_change'

// Application-specific
'job.create' | 'application.submit' | 'payment.process'
```

#### 3. Severity Levels
Risk-based classification for prioritizing responses:

```typescript
'critical'  // Security breaches, PHI exposure
'high'      // Failed authentications, admin actions  
'medium'    // PHI access, data modifications
'low'       // Normal user activities
'info'      // System informational events
```

### Data Structures

#### Audit Log Entry Schema
```typescript
interface AuditLogEntry {
  // Core identification
  id: string                    // Unique audit log ID
  timestamp: Date              // When event occurred
  eventType: AuditEventType    // What happened
  severity: AuditSeverity      // Risk level
  
  // User context (required for HIPAA)
  user?: AuditUser             // Who performed the action
  
  // Event details
  message: string              // Human-readable description
  details?: Record<string, any> // Additional context
  
  // PHI-specific metadata
  phi?: PHIMetadata            // PHI access details
  
  // Technical context
  requestId?: string           // Request correlation ID
  service: string              // Which service logged the event
  endpoint?: string            // API endpoint accessed
  
  // Compliance tracking
  retentionDate: Date          // When log can be purged (7 years)
  encrypted: boolean           // Encryption status
  
  // Error context
  error?: ErrorDetails         // Stack trace and error info
}
```

#### PHI Metadata Schema
```typescript
interface PHIMetadata {
  dataType: 'resume' | 'application' | 'profile' | 'communication'
  recordId: string             // Unique identifier for PHI record
  fieldAccessed?: string       // Specific field accessed
  purpose: string              // Business justification
  patientId?: string           // Healthcare worker ID (if applicable)
}
```

## 🔧 Implementation Details

### 1. Integration with tRPC API
Audit logging is integrated at the context level for automatic event capture:

```typescript
// packages/api/src/context.ts
import { getAuditLogger, type AuditUser } from '@locumtruerate/audit'

export const createContext = (opts: CreateContextOptions) => {
  return {
    db,
    logger,
    auditLogger: getAuditLogger('locumtruerate-api'),
    user: opts.userId ? {
      id: opts.userId,
      role: opts.userRole,
      sessionId: opts.sessionId
    } : null,
    request: {
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent
    }
  }
}
```

### 2. Automatic PHI Access Logging
Every access to PHI is automatically logged:

```typescript
// Example: Job application viewing
export const getApplication = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input, ctx }) => {
    const auditUser = getAuditUser(ctx)
    
    // Log PHI access before retrieving data
    await ctx.auditLogger.logPHIAccess('phi.access', auditUser!, {
      dataType: 'application',
      recordId: input.id,
      purpose: 'Application review by employer'
    })
    
    const application = await ctx.db.application.findUnique({
      where: { id: input.id }
    })
    
    return application
  })
```

### 3. Authentication Event Logging
All authentication events are captured for security monitoring:

```typescript
// Login success
await ctx.auditLogger.logAuth('auth.login.success', {
  id: user.id,
  email: user.email,
  role: user.role,
  ipAddress: ctx.request.ipAddress,
  userAgent: ctx.request.userAgent
})

// Failed login attempt
await ctx.auditLogger.logAuth('auth.login.failure', {
  email: attemptedEmail,
  ipAddress: ctx.request.ipAddress,
  userAgent: ctx.request.userAgent
}, {
  reason: 'Invalid credentials',
  attemptCount: failedAttempts
})
```

### 4. Security Event Monitoring
Critical security events trigger immediate alerts:

```typescript
// Suspicious activity detection
if (suspiciousActivityDetected) {
  await ctx.auditLogger.logSecurity(
    'security.suspicious_activity',
    auditUser,
    'Multiple failed login attempts from same IP',
    {
      ipAddress: ctx.request.ipAddress,
      attemptCount: failedAttempts,
      timeWindow: '5 minutes'
    }
  )
}
```

## 📊 Multi-Destination Logging

### 1. Database Storage
Primary storage for querying and compliance reporting:

```typescript
private async writeToDatabase(entry: AuditLogEntry): Promise<void> {
  await this.db.auditLog.create({
    data: {
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      severity: entry.severity,
      userId: entry.user?.id,
      message: entry.message,
      details: entry.details,
      retentionDate: entry.retentionDate,
      encrypted: entry.encrypted
    }
  })
}
```

### 2. Structured Log Files
Backup storage for external processing:

```typescript
private async writeToLogFile(entry: AuditLogEntry): Promise<void> {
  const logLine = JSON.stringify({
    timestamp: entry.timestamp.toISOString(),
    level: entry.severity.toUpperCase(),
    event: entry.eventType,
    user: entry.user?.id,
    message: entry.message,
    details: entry.details
  })
  
  // Write to rotating log files
  fs.appendFileSync(`/var/log/locumtruerate/audit-${getDateString()}.log`, logLine + '\n')
}
```

### 3. SIEM Integration
Real-time security monitoring:

```typescript
private async sendToSIEM(entry: AuditLogEntry): Promise<void> {
  if (entry.severity === 'critical' || entry.severity === 'high') {
    // Send to Splunk, ELK, or other SIEM system
    await this.siemClient.send({
      timestamp: entry.timestamp,
      source: 'locumtruerate-audit',
      sourcetype: 'healthcare_audit',
      event: entry
    })
  }
}
```

## 🔐 Security and Privacy

### 1. PII Protection
Sensitive information is hashed or redacted:

```typescript
private hashPII(value: string): string {
  // Use cryptographic hashing for email addresses
  return crypto.createHash('sha256').update(value + this.encryptionKey).digest('hex')
}

private sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sensitiveFields = ['password', 'ssn', 'creditCard', 'apiKey']
  const sanitized = { ...details }
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}
```

### 2. Encryption at Rest
Audit logs are encrypted using AES-256:

```typescript
private async encryptSensitiveFields(entry: AuditLogEntry): Promise<AuditLogEntry> {
  if (!this.encryptionKey) return entry
  
  const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey)
  
  // Encrypt sensitive fields
  if (entry.details) {
    entry.details = this.encryptObject(entry.details, cipher)
  }
  
  return entry
}
```

### 3. Access Control
Audit logs have strict access controls:

```typescript
// Only authorized compliance officers can access audit logs
export const getAuditLogs = adminProcedure
  .use(requireRole('COMPLIANCE_OFFICER'))
  .input(auditQuerySchema)
  .query(async ({ input, ctx }) => {
    // Log the audit log access (meta-audit)
    await ctx.auditLogger.logEvent(
      'audit.log_access',
      'medium',
      `Audit logs accessed by compliance officer`,
      getAuditUser(ctx)
    )
    
    return await ctx.db.auditLog.findMany({
      where: input.filters,
      orderBy: { timestamp: 'desc' },
      take: input.limit
    })
  })
```

## 📈 Monitoring and Alerting

### 1. Real-time Alerts
Critical events trigger immediate notifications:

```typescript
private async sendCriticalAlert(entry: AuditLogEntry): Promise<void> {
  const alert = {
    timestamp: entry.timestamp,
    severity: 'CRITICAL',
    event: entry.eventType,
    user: entry.user?.id,
    message: entry.message,
    service: entry.service
  }
  
  // Send to multiple channels
  await Promise.all([
    this.sendEmail(process.env.HIPAA_OFFICER_EMAIL!, alert),
    this.sendSlack(process.env.SECURITY_SLACK_CHANNEL!, alert),
    this.sendPagerDuty(alert)
  ])
}
```

### 2. Metrics and Dashboards
Key metrics for compliance reporting:

```typescript
// Audit metrics collection
export const auditMetrics = {
  // Daily PHI access count
  phiAccessCount: await db.auditLog.count({
    where: {
      eventType: { startsWith: 'phi.' },
      timestamp: { gte: startOfDay(new Date()) }
    }
  }),
  
  // Failed login attempts
  failedLogins: await db.auditLog.count({
    where: {
      eventType: 'auth.login.failure',
      timestamp: { gte: subHours(new Date(), 24) }
    }
  }),
  
  // Security events
  securityEvents: await db.auditLog.count({
    where: {
      eventType: { startsWith: 'security.' },
      severity: { in: ['critical', 'high'] },
      timestamp: { gte: subDays(new Date(), 7) }
    }
  })
}
```

### 3. Automated Compliance Reports
Weekly and monthly compliance reports:

```typescript
export async function generateComplianceReport(
  startDate: Date,
  endDate: Date
): Promise<ComplianceReport> {
  const auditSummary = await db.auditLog.groupBy({
    by: ['eventType', 'severity'],
    where: {
      timestamp: { gte: startDate, lte: endDate }
    },
    _count: true
  })
  
  return {
    period: { startDate, endDate },
    totalEvents: auditSummary.reduce((sum, group) => sum + group._count, 0),
    phiAccessEvents: auditSummary.filter(g => g.eventType.startsWith('phi.')),
    securityEvents: auditSummary.filter(g => g.eventType.startsWith('security.')),
    criticalEvents: auditSummary.filter(g => g.severity === 'critical'),
    recommendations: generateRecommendations(auditSummary)
  }
}
```

## 🔄 Retention and Archival

### 1. 7-Year Retention Policy
HIPAA requires 7-year retention of audit logs:

```typescript
// Calculate retention date (7 years from creation)
private calculateRetentionDate(): Date {
  const retentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '2555') // 7 years
  const retentionDate = new Date()
  retentionDate.setDate(retentionDate.getDate() + retentionDays)
  return retentionDate
}

// Automated archival process
export async function archiveExpiredLogs(): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 2555) // 7 years ago
  
  // Move to cold storage before deletion
  const expiredLogs = await db.auditLog.findMany({
    where: { retentionDate: { lte: cutoffDate } }
  })
  
  if (expiredLogs.length > 0) {
    // Archive to cold storage (S3 Glacier, etc.)
    await archiveToCloudStorage(expiredLogs)
    
    // Delete from active database
    await db.auditLog.deleteMany({
      where: { retentionDate: { lte: cutoffDate } }
    })
    
    console.log(`Archived ${expiredLogs.length} expired audit logs`)
  }
}
```

### 2. Backup and Recovery
Multiple backup strategies for audit logs:

```typescript
// Daily backup of audit logs
export async function backupAuditLogs(): Promise<void> {
  const yesterday = subDays(new Date(), 1)
  
  const logs = await db.auditLog.findMany({
    where: {
      timestamp: {
        gte: startOfDay(yesterday),
        lte: endOfDay(yesterday)
      }
    }
  })
  
  // Encrypt and backup to multiple locations
  const encryptedBackup = await encryptBackup(logs)
  
  await Promise.all([
    uploadToS3(encryptedBackup, `audit-logs/${format(yesterday, 'yyyy-MM-dd')}.json.enc`),
    uploadToAzure(encryptedBackup, `audit-logs/${format(yesterday, 'yyyy-MM-dd')}.json.enc`),
    writeToLocalBackup(encryptedBackup, yesterday)
  ])
}
```

## 🚨 Emergency Procedures

### 1. Audit System Failure
When audit logging fails, emergency procedures activate:

```typescript
private async writeEmergencyLog(entry: any, error: Error): Promise<void> {
  const emergencyEntry = {
    timestamp: new Date().toISOString(),
    level: 'AUDIT_FAILURE',
    originalEntry: entry,
    error: error.message,
    service: this.serviceName,
    emergencyBackup: true
  }
  
  // Write to multiple emergency locations
  console.error('[EMERGENCY-AUDIT]', JSON.stringify(emergencyEntry))
  
  // Write to emergency file
  fs.appendFileSync('/var/log/emergency-audit.log', JSON.stringify(emergencyEntry) + '\n')
  
  // Send immediate alert
  await this.sendEmergencyAlert(emergencyEntry)
}
```

### 2. Security Incident Response
Automated response to security breaches:

```typescript
export async function handleSecurityIncident(
  incident: SecurityIncident
): Promise<void> {
  // Log the incident
  await audit.securityEvent(
    'security.breach_attempt',
    incident.user,
    `Security incident detected: ${incident.type}`,
    incident.details
  )
  
  // Immediate actions
  if (incident.severity === 'critical') {
    // Lock affected user accounts
    await lockUserAccount(incident.user?.id)
    
    // Revoke active sessions
    await revokeUserSessions(incident.user?.id)
    
    // Send emergency alerts
    await sendSecurityAlert(incident)
    
    // Create incident ticket
    await createIncidentTicket(incident)
  }
}
```

## 📋 Compliance Verification

### 1. Automated Compliance Checks
Daily verification of audit system compliance:

```typescript
export async function verifyAuditCompliance(): Promise<ComplianceStatus> {
  const checks = {
    // Verify all PHI access is logged
    phiAccessLogged: await verifyPHIAccessLogging(),
    
    // Verify 7-year retention
    retentionCompliance: await verifyRetentionCompliance(),
    
    // Verify encryption
    encryptionStatus: await verifyEncryptionStatus(),
    
    // Verify backup integrity
    backupIntegrity: await verifyBackupIntegrity(),
    
    // Verify access controls
    accessControls: await verifyAccessControls()
  }
  
  const overallCompliance = Object.values(checks).every(check => check.compliant)
  
  return {
    compliant: overallCompliance,
    checks,
    lastVerified: new Date(),
    nextReview: addDays(new Date(), 1)
  }
}
```

### 2. External Audit Support
Generate audit evidence for external auditors:

```typescript
export async function generateAuditEvidence(
  startDate: Date,
  endDate: Date
): Promise<AuditEvidence> {
  return {
    // Audit log statistics
    logStatistics: await generateLogStatistics(startDate, endDate),
    
    // Sample audit logs for review
    sampleLogs: await getSampleAuditLogs(startDate, endDate),
    
    // Compliance verification results
    complianceResults: await getComplianceResults(startDate, endDate),
    
    // Security incident summary
    securityIncidents: await getSecurityIncidents(startDate, endDate),
    
    // Access control verification
    accessControlsEvidence: await getAccessControlsEvidence(),
    
    // Backup and recovery evidence
    backupEvidence: await getBackupEvidence(startDate, endDate)
  }
}
```

---

**Last Updated:** June 2025  
**Next Review:** Monthly compliance review  
**Compliance Officer:** [HIPAA Officer Email]