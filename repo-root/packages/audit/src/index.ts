/**
 * HIPAA-Compliant Audit Logging Package
 * 
 * Provides comprehensive audit logging capabilities for healthcare applications
 * handling Protected Health Information (PHI) as required by HIPAA regulations.
 */

export {
  // Core audit logger
  AuditLogger,
  getAuditLogger,
  audit,
  
  // Types and schemas
  type AuditEventType,
  type AuditSeverity,
  type AuditUser,
  type PHIMetadata,
  type AuditLogEntry,
  
  // Zod schemas for validation
  AuditEventType as AuditEventTypeSchema,
  AuditSeverity as AuditSeveritySchema,
  AuditUser as AuditUserSchema,
  PHIMetadata as PHIMetadataSchema,
  AuditLogEntry as AuditLogEntrySchema
} from './logger'

// Default export
export { audit as default }