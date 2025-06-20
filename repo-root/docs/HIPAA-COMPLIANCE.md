# HIPAA Compliance Documentation
# LocumTrueRate.com Data Flows and PHI Handling

## Overview

This document outlines LocumTrueRate.com's approach to HIPAA compliance, detailing data flows, PHI handling procedures, and technical safeguards implemented throughout the platform.

## Table of Contents

1. [Data Classification](#data-classification)
2. [Data Flow Architecture](#data-flow-architecture)
3. [PHI Handling Procedures](#phi-handling-procedures)
4. [Technical Safeguards](#technical-safeguards)
5. [Administrative Safeguards](#administrative-safeguards)
6. [Physical Safeguards](#physical-safeguards)
7. [Audit and Compliance](#audit-and-compliance)

## Data Classification

### Protected Health Information (PHI)

LocumTrueRate.com handles the following types of PHI:

#### Primary PHI
- **Medical License Numbers**: State medical license identifiers
- **DEA Numbers**: Drug Enforcement Administration registration numbers
- **NPI Numbers**: National Provider Identifier numbers
- **Specialty Certifications**: Board certification details
- **Medical Background**: Malpractice history, disciplinary actions

#### Secondary PHI
- **Employment History**: Previous healthcare positions
- **Education Records**: Medical school, residency, fellowship details
- **Professional References**: Contact information for healthcare supervisors
- **Salary Information**: Compensation data linked to medical specialties

#### Associated PII (Personally Identifiable Information)
- **Contact Information**: Email, phone, address
- **Identity Information**: Name, date of birth, SSN (encrypted)
- **Financial Information**: Bank account details, tax information

### Non-PHI Data

The following data is not considered PHI under HIPAA:

- Job posting information (without provider details)
- Aggregated salary data (anonymized)
- General platform usage analytics
- Marketing and communication preferences

## Data Flow Architecture

### High-Level Data Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │───▶│  Application    │───▶│   Database      │
│   (Frontend)    │    │   (Backend)     │    │  (Encrypted)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Audit Logs     │    │  Background     │    │  Backup &       │
│  (Immutable)    │    │  Services       │    │  Archive        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Detailed Data Flows

#### 1. User Registration and Profile Creation

```
User Registration Flow:
┌─────────────────┐
│ User submits    │
│ registration    │
│ form            │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Frontend        │
│ validation      │
│ (Zod schemas)   │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ HTTPS transport │
│ with CSP        │
│ headers         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Backend API     │
│ validation &    │
│ sanitization    │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ PHI encryption  │
│ before storage  │
│ (AES-256)       │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Database        │
│ storage with    │
│ field-level     │
│ encryption      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Audit log       │
│ entry created   │
│ (immutable)     │
└─────────────────┘
```

#### 2. Job Application Process

```
Job Application Flow:
┌─────────────────┐
│ Provider        │
│ selects job     │
│ opportunity     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Application     │
│ form with PHI   │
│ fields          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Multi-step      │
│ validation:     │
│ - Frontend Zod  │
│ - Backend API   │
│ - Database      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ PHI tokenization│
│ for employer    │
│ review          │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Employer        │
│ receives        │
│ anonymized      │
│ application     │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Full PHI        │
│ revealed only   │
│ after mutual    │
│ interest        │
└─────────────────┘
```

#### 3. Background Verification Process

```
Background Check Flow:
┌─────────────────┐
│ Provider        │
│ consents to     │
│ background      │
│ check           │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Encrypted       │
│ transmission    │
│ to verified     │
│ partner         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Third-party     │
│ verification    │
│ (HIPAA covered │
│ entity)         │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Results         │
│ encrypted and   │
│ stored with     │
│ expiration      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ Automatic       │
│ purging after   │
│ retention       │
│ period          │
└─────────────────┘
```

## PHI Handling Procedures

### Data Collection

#### Minimum Necessary Standard
- Only collect PHI essential for platform functionality
- Use progressive disclosure for sensitive information
- Implement role-based data access controls

#### Consent Management
```typescript
// Example consent tracking
interface ConsentRecord {
  userId: string
  consentType: 'data_collection' | 'background_check' | 'data_sharing'
  granted: boolean
  timestamp: Date
  ipAddress: string
  userAgent: string
  expirationDate?: Date
}
```

### Data Processing

#### Encryption at Rest
- **Algorithm**: AES-256-GCM
- **Key Management**: AWS KMS with automatic rotation
- **Field-Level Encryption**: Applied to all PHI fields

```sql
-- Example encrypted field storage
CREATE TABLE provider_profiles (
    id UUID PRIMARY KEY,
    email_encrypted BYTEA, -- AES-256 encrypted
    license_number_encrypted BYTEA, -- AES-256 encrypted
    dea_number_encrypted BYTEA, -- AES-256 encrypted
    npi_number_encrypted BYTEA, -- AES-256 encrypted
    encryption_key_id VARCHAR(255), -- KMS key reference
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

#### Encryption in Transit
- **Protocol**: TLS 1.3 minimum
- **Certificate**: EV SSL certificate
- **HSTS**: Enabled with preload list inclusion

### Data Storage

#### Database Security
- **Access Control**: Role-based with principle of least privilege
- **Network Security**: VPC with private subnets
- **Monitoring**: Real-time query monitoring and anomaly detection

#### Backup and Recovery
- **Frequency**: Continuous backup with point-in-time recovery
- **Encryption**: All backups encrypted with separate keys
- **Geographic Distribution**: Multi-region backup storage
- **Retention**: 7-year retention for HIPAA compliance

### Data Transmission

#### API Security
```typescript
// Example API endpoint with PHI handling
app.post('/api/providers/profile', [
  authenticateUser,
  validateHIPAAConsent,
  encryptPHIFields,
  auditLogMiddleware
], async (req, res) => {
  try {
    // Validate and sanitize input
    const validatedData = profileSchema.parse(req.body)
    
    // Encrypt PHI fields
    const encryptedData = await encryptPHIFields(validatedData)
    
    // Store with audit trail
    const profile = await createProviderProfile(encryptedData)
    
    // Log the action
    await auditLog.logDataAccess({
      userId: req.user.id,
      action: 'CREATE_PROFILE',
      dataType: 'PHI',
      timestamp: new Date()
    })
    
    res.json({ success: true, profileId: profile.id })
  } catch (error) {
    await auditLog.logSecurityEvent({
      event: 'PHI_ACCESS_ERROR',
      severity: 'HIGH',
      details: error.message
    })
    throw error
  }
})
```

#### Third-Party Integrations
- **BAAs Required**: All vendors handling PHI must sign Business Associate Agreements
- **API Security**: OAuth 2.0 with PKCE for external integrations
- **Data Minimization**: Only share minimum necessary PHI

## Technical Safeguards

### Access Control

#### Authentication
- **Multi-Factor Authentication**: Required for all users accessing PHI
- **Password Policy**: Minimum 12 characters, complexity requirements
- **Session Management**: Automatic timeout after 30 minutes of inactivity

#### Authorization
```typescript
// Role-based access control example
enum Role {
  PROVIDER = 'provider',
  EMPLOYER = 'employer',
  ADMIN = 'admin',
  COMPLIANCE_OFFICER = 'compliance_officer'
}

enum Permission {
  READ_OWN_PHI = 'read_own_phi',
  READ_PROVIDER_PHI = 'read_provider_phi',
  MODIFY_PHI = 'modify_phi',
  DELETE_PHI = 'delete_phi',
  ACCESS_AUDIT_LOGS = 'access_audit_logs'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.PROVIDER]: [Permission.READ_OWN_PHI],
  [Role.EMPLOYER]: [Permission.READ_PROVIDER_PHI],
  [Role.ADMIN]: [Permission.MODIFY_PHI, Permission.DELETE_PHI],
  [Role.COMPLIANCE_OFFICER]: [Permission.ACCESS_AUDIT_LOGS]
}
```

### Audit Controls

#### Comprehensive Logging
```typescript
interface AuditLogEntry {
  id: string
  timestamp: Date
  userId: string
  action: AuditAction
  resourceType: 'PHI' | 'PII' | 'SYSTEM'
  resourceId?: string
  ipAddress: string
  userAgent: string
  outcome: 'SUCCESS' | 'FAILURE'
  details?: Record<string, any>
  retentionUntil: Date // 7 years from creation
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  BACKUP = 'BACKUP'
}
```

#### Audit Log Protection
- **Immutable Storage**: Write-only audit logs
- **Digital Signatures**: Cryptographic integrity verification
- **Separate Database**: Audit logs stored in dedicated system
- **Real-time Monitoring**: Automated anomaly detection

### Integrity Controls

#### Data Validation
```typescript
// PHI validation schemas
const licenseNumberSchema = z.string()
  .min(1, 'License number is required')
  .max(50, 'License number too long')
  .regex(/^[A-Z0-9\-]+$/, 'Invalid license number format')
  .transform(val => sanitizeInput(val))

const npiNumberSchema = z.string()
  .regex(/^\d{10}$/, 'NPI must be exactly 10 digits')
  .refine(validateNPIChecksum, 'Invalid NPI checksum')
```

#### Data Integrity Verification
- **Checksums**: SHA-256 hashes for all PHI records
- **Version Control**: Full audit trail of data modifications
- **Backup Verification**: Regular integrity checks of backup data

### Transmission Security

#### Network Security
```typescript
// Security headers configuration
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' wss:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

## Administrative Safeguards

### Security Officer
- **Designated Officer**: Chief Information Security Officer (CISO)
- **Responsibilities**: HIPAA compliance oversight, incident response
- **Training**: Annual HIPAA training and security awareness

### Workforce Training
- **Initial Training**: All employees complete HIPAA training before PHI access
- **Annual Refresher**: Yearly training updates and assessments
- **Role-Specific Training**: Additional training for specific job functions

### Information System Access Management
- **User Provisioning**: Formal process for granting system access
- **Regular Reviews**: Quarterly access reviews and certifications
- **Termination Procedures**: Immediate access revocation upon termination

### Security Incident Procedures
```typescript
interface SecurityIncident {
  id: string
  reportedAt: Date
  reportedBy: string
  incidentType: 'BREACH' | 'UNAUTHORIZED_ACCESS' | 'SYSTEM_FAILURE' | 'MALWARE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  affectedUsers?: string[]
  containmentActions: string[]
  resolutionStatus: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'
  notificationRequired: boolean
  notificationDeadline?: Date
}

// Incident response workflow
async function handleSecurityIncident(incident: SecurityIncident) {
  // Immediate containment
  if (incident.severity === 'CRITICAL') {
    await implementEmergencyContainment(incident)
  }
  
  // Notification requirements
  if (incident.notificationRequired) {
    await scheduleBreachNotification(incident)
  }
  
  // Investigation and forensics
  await initiateIncidentInvestigation(incident)
  
  // Compliance reporting
  await generateComplianceReport(incident)
}
```

## Physical Safeguards

### Facility Access Controls
- **Data Centers**: SOC 2 Type II certified facilities
- **Biometric Access**: Multi-factor authentication for physical access
- **24/7 Monitoring**: Continuous security monitoring and recording

### Workstation Security
- **Endpoint Protection**: Advanced threat protection on all workstations
- **Device Encryption**: Full disk encryption required
- **Screen Locks**: Automatic locking after inactivity

### Media Controls
- **Secure Disposal**: NIST 800-88 compliant data destruction
- **Backup Security**: Encrypted backup media stored in secure facilities
- **Transportation**: Secure courier services for media transport

## Audit and Compliance

### Regular Assessments

#### Internal Audits
- **Frequency**: Quarterly compliance assessments
- **Scope**: Technical, administrative, and physical safeguards
- **Documentation**: Formal audit reports with remediation plans

#### External Audits
- **Annual Assessment**: Third-party HIPAA compliance audit
- **Penetration Testing**: Quarterly security assessments
- **Vulnerability Scanning**: Continuous automated scanning

### Compliance Monitoring

#### Key Performance Indicators
```typescript
interface ComplianceMetrics {
  month: string
  phiAccessEvents: number
  unauthorizedAccessAttempts: number
  dataBreachIncidents: number
  auditLogCompleteness: number // percentage
  encryptionCompliance: number // percentage
  trainingCompletionRate: number // percentage
  incidentResponseTime: number // hours
  backupSuccessRate: number // percentage
}

// Compliance dashboard
const generateComplianceReport = async (timeframe: string) => {
  const metrics = await getComplianceMetrics(timeframe)
  
  return {
    overallScore: calculateComplianceScore(metrics),
    riskAssessment: assessComplianceRisk(metrics),
    recommendations: generateRecommendations(metrics),
    nextAuditDate: calculateNextAuditDate()
  }
}
```

### Breach Response

#### Detection and Reporting
```typescript
// Automated breach detection
class BreachDetectionSystem {
  async detectPotentialBreach(auditLogs: AuditLogEntry[]): Promise<BreachAlert[]> {
    const alerts: BreachAlert[] = []
    
    // Mass data access pattern
    const massAccess = this.detectMassDataAccess(auditLogs)
    if (massAccess.length > 0) {
      alerts.push({
        type: 'MASS_DATA_ACCESS',
        severity: 'HIGH',
        affectedRecords: massAccess.length,
        detectedAt: new Date()
      })
    }
    
    // Unusual access patterns
    const unusualAccess = this.detectUnusualAccess(auditLogs)
    if (unusualAccess.length > 0) {
      alerts.push({
        type: 'UNUSUAL_ACCESS_PATTERN',
        severity: 'MEDIUM',
        details: unusualAccess
      })
    }
    
    return alerts
  }
  
  private detectMassDataAccess(logs: AuditLogEntry[]): AuditLogEntry[] {
    // Flag if user accesses >100 PHI records in 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentAccess = logs.filter(log => 
      log.timestamp > oneHourAgo && 
      log.resourceType === 'PHI' && 
      log.action === AuditAction.READ
    )
    
    const accessCounts = new Map<string, number>()
    recentAccess.forEach(log => {
      accessCounts.set(log.userId, (accessCounts.get(log.userId) || 0) + 1)
    })
    
    return recentAccess.filter(log => 
      (accessCounts.get(log.userId) || 0) > 100
    )
  }
}
```

#### Notification Requirements
- **HHS Notification**: Within 60 days of discovery
- **Individual Notification**: Within 60 days of discovery
- **Media Notification**: If breach affects >500 individuals
- **State Notification**: As required by state laws

### Documentation Requirements

#### Policies and Procedures
- **HIPAA Policies**: Comprehensive written policies
- **Procedure Documentation**: Step-by-step operational procedures
- **Training Materials**: Current training documentation
- **Incident Reports**: Detailed incident documentation

#### Record Retention
- **Audit Logs**: 7 years minimum retention
- **Training Records**: 6 years retention
- **Incident Reports**: 6 years retention
- **Policy Updates**: Historical versions maintained

## Technology Implementation

### Database Schema Design

```sql
-- PHI-compliant user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Encrypted PHI fields
    first_name_encrypted BYTEA,
    last_name_encrypted BYTEA,
    email_encrypted BYTEA,
    phone_encrypted BYTEA,
    ssn_encrypted BYTEA,
    date_of_birth_encrypted BYTEA,
    
    -- Medical credentials (encrypted)
    medical_license_encrypted BYTEA,
    dea_number_encrypted BYTEA,
    npi_number_encrypted BYTEA,
    
    -- Encryption metadata
    encryption_key_id VARCHAR(255) NOT NULL,
    encrypted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Compliance fields
    consent_granted BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    data_retention_until TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete for compliance
    deleted_at TIMESTAMP WITH TIME ZONE,
    deletion_reason TEXT
);

-- Separate audit table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    outcome VARCHAR(20) NOT NULL,
    details JSONB,
    
    -- Immutable once written
    CONSTRAINT audit_logs_immutable CHECK (false)
);

-- Create immutable audit trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'Audit logs are immutable';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutable_trigger
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### Application Code Patterns

```typescript
// PHI service with encryption
class PHIService {
  private encryptionService: EncryptionService
  private auditService: AuditService
  
  async storePHI(data: PHIData, userId: string): Promise<string> {
    try {
      // Validate input
      const validatedData = phiSchema.parse(data)
      
      // Encrypt sensitive fields
      const encryptedData = await this.encryptionService.encrypt(validatedData)
      
      // Store in database
      const record = await this.database.storePHI(encryptedData)
      
      // Audit the action
      await this.auditService.log({
        userId,
        action: 'STORE_PHI',
        resourceId: record.id,
        outcome: 'SUCCESS'
      })
      
      return record.id
    } catch (error) {
      await this.auditService.log({
        userId,
        action: 'STORE_PHI',
        outcome: 'FAILURE',
        details: { error: error.message }
      })
      throw error
    }
  }
  
  async retrievePHI(id: string, userId: string): Promise<PHIData> {
    // Check authorization
    await this.checkPHIAccess(userId, id)
    
    // Retrieve and decrypt
    const encryptedData = await this.database.retrievePHI(id)
    const decryptedData = await this.encryptionService.decrypt(encryptedData)
    
    // Audit the access
    await this.auditService.log({
      userId,
      action: 'ACCESS_PHI',
      resourceId: id,
      outcome: 'SUCCESS'
    })
    
    return decryptedData
  }
}
```

## Conclusion

This HIPAA compliance documentation provides a comprehensive framework for handling PHI within LocumTrueRate.com. The implementation covers all required technical, administrative, and physical safeguards while maintaining usability and performance.

Regular reviews and updates of these procedures ensure ongoing compliance with HIPAA requirements and industry best practices for healthcare data protection.

---

**Document Control:**
- **Version**: 1.0
- **Last Updated**: 2024-12-20
- **Next Review Date**: 2025-06-20
- **Approved By**: Chief Information Security Officer
- **Classification**: Confidential - Internal Use Only