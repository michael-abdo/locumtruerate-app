/**
 * Admin Interface Validation Schemas
 * 
 * Secure validation for admin panel inputs to prevent
 * injection attacks and ensure data integrity
 */

import { z } from 'zod'
import { safeTextSchema, searchQuerySchema } from './common'

// Admin search schema - more restrictive than general search
export const adminSearchSchema = z.object({
  query: searchQuerySchema
    .max(100, 'Search query is too long')
    .regex(
      /^[a-zA-Z0-9\s\-@._]+$/,
      'Search contains invalid characters. Only letters, numbers, spaces, and @.-_ are allowed'
    )
    .transform(val => val.trim())
})

// Admin filter schemas
export const adminUserFilterSchema = z.object({
  role: z.enum(['ALL', 'PHYSICIAN', 'NURSE', 'ADMIN', 'EMPLOYER']).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  verified: z.enum(['ALL', 'VERIFIED', 'UNVERIFIED']).optional(),
  subscription: z.enum(['ALL', 'FREE', 'PRO', 'ENTERPRISE']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: adminSearchSchema.shape.query.optional()
})

export const adminJobFilterSchema = z.object({
  status: z.enum(['ALL', 'ACTIVE', 'INACTIVE', 'EXPIRED', 'DRAFT']).optional(),
  boosted: z.enum(['ALL', 'BOOSTED', 'NOT_BOOSTED']).optional(),
  employer: safeTextSchema(0, 100).optional(),
  category: z.enum([
    'ALL',
    'EMERGENCY_MEDICINE',
    'FAMILY_MEDICINE',
    'INTERNAL_MEDICINE',
    'PSYCHIATRY',
    'RADIOLOGY',
    'ANESTHESIOLOGY',
    'NURSING',
    'ALLIED_HEALTH'
  ]).optional(),
  location: safeTextSchema(0, 100).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: adminSearchSchema.shape.query.optional()
})

export const adminLeadFilterSchema = z.object({
  status: z.enum(['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']).optional(),
  source: z.enum(['ALL', 'WEBSITE', 'CALCULATOR', 'CONTACT', 'DEMO', 'NEWSLETTER']).optional(),
  quality: z.enum(['ALL', 'HOT', 'WARM', 'COLD']).optional(),
  assigned: z.enum(['ALL', 'ASSIGNED', 'UNASSIGNED']).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  search: adminSearchSchema.shape.query.optional()
})

// Admin action schemas
export const adminUserActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['SUSPEND', 'ACTIVATE', 'DELETE', 'VERIFY', 'RESET_PASSWORD']),
  reason: safeTextSchema(0, 500).optional(),
  notifyUser: z.boolean().default(true)
})

export const adminJobActionSchema = z.object({
  jobId: z.string().uuid(),
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'DELETE', 'BOOST', 'FEATURE']),
  reason: safeTextSchema(0, 500).optional(),
  duration: z.number().positive().optional() // For boost/feature actions
})

export const adminBulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'Select at least one item'),
  action: z.string(),
  params: z.record(z.any()).optional()
})

// Admin settings schemas
export const adminSystemSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
  jobPostingEnabled: z.boolean(),
  paymentProcessingEnabled: z.boolean(),
  emailNotificationsEnabled: z.boolean(),
  rateLimitPerHour: z.number().positive().max(10000),
  maxUploadSizeMB: z.number().positive().max(100),
  sessionTimeoutMinutes: z.number().positive().max(1440)
})

export const adminEmailTemplateSchema = z.object({
  templateId: z.string(),
  subject: safeTextSchema(1, 200),
  body: z.string().min(1).max(10000),
  variables: z.array(z.string()).optional(),
  testEmail: z.string().email().optional()
})

// Helper function to validate admin search input
export function validateAdminSearch(query: string): { isValid: boolean; sanitized: string; error?: string } {
  try {
    const result = adminSearchSchema.parse({ query })
    return { isValid: true, sanitized: result.query }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        isValid: false, 
        sanitized: '', 
        error: error.errors[0]?.message || 'Invalid search query' 
      }
    }
    return { isValid: false, sanitized: '', error: 'Invalid search query' }
  }
}

// Export type definitions
export type AdminSearchInput = z.infer<typeof adminSearchSchema>
export type AdminUserFilter = z.infer<typeof adminUserFilterSchema>
export type AdminJobFilter = z.infer<typeof adminJobFilterSchema>
export type AdminLeadFilter = z.infer<typeof adminLeadFilterSchema>
export type AdminUserAction = z.infer<typeof adminUserActionSchema>
export type AdminJobAction = z.infer<typeof adminJobActionSchema>
export type AdminBulkAction = z.infer<typeof adminBulkActionSchema>
export type AdminSystemSettings = z.infer<typeof adminSystemSettingsSchema>
export type AdminEmailTemplate = z.infer<typeof adminEmailTemplateSchema>