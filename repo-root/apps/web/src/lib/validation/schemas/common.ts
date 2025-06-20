/**
 * Common Validation Schemas for LocumTrueRate.com
 * 
 * Reusable validation schemas for common data types across the application.
 * All schemas include proper sanitization for HIPAA compliance.
 */

import { z } from 'zod'

/**
 * Email validation with sanitization
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Please enter a valid email address')
  .max(255, 'Email address is too long')

/**
 * Phone number validation (US format)
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    'Please enter a valid phone number'
  )
  .transform(val => val.replace(/\D/g, '')) // Store as digits only

/**
 * URL validation with protocol requirement
 */
export const urlSchema = z
  .string()
  .trim()
  .url('Please enter a valid URL')
  .regex(/^https?:\/\//, 'URL must start with http:// or https://')
  .max(2048, 'URL is too long')

/**
 * Safe text input (prevents XSS)
 */
export const safeTextSchema = (minLength = 1, maxLength = 1000) => z
  .string()
  .trim()
  .min(minLength, `Must be at least ${minLength} characters`)
  .max(maxLength, `Must be no more than ${maxLength} characters`)
  .regex(/^[^<>]*$/, 'HTML tags are not allowed')

/**
 * Safe search query (prevents SQL injection)
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .min(1, 'Search query is required')
  .max(100, 'Search query is too long')
  .regex(/^[a-zA-Z0-9\s\-_.,!?@#$%&*()+=]+$/, 'Invalid characters in search query')
  .transform(val => val.replace(/[';\\]/g, '')) // Remove SQL injection characters

/**
 * Pagination parameters
 */
export const paginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'date', 'relevance'])
    .optional()
    .default('createdAt'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('desc')
})

/**
 * Date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate
    }
    return true
  },
  { message: 'Start date must be before end date' }
)

/**
 * Money/currency validation (stored as cents)
 */
export const moneySchema = z
  .number()
  .min(0, 'Amount must be positive')
  .max(999999999, 'Amount is too large')
  .multipleOf(1, 'Amount must be a whole number (in cents)')
  .or(
    z.string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid currency format')
      .transform(val => Math.round(parseFloat(val) * 100))
  )

/**
 * US State validation
 */
export const usStateSchema = z.enum([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
])

/**
 * Address validation
 */
export const addressSchema = z.object({
  street1: safeTextSchema(5, 100),
  street2: safeTextSchema(0, 100).optional(),
  city: safeTextSchema(2, 50),
  state: usStateSchema,
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code format')
})

/**
 * File upload validation
 */
export const fileUploadSchema = z.object({
  name: z.string().max(255),
  type: z.string(),
  size: z.number().max(10 * 1024 * 1024, 'File must be less than 10MB')
})

/**
 * Resume upload validation (PDFs only for security)
 */
export const resumeUploadSchema = fileUploadSchema.extend({
  type: z.literal('application/pdf', {
    errorMap: () => ({ message: 'Only PDF files are allowed for resumes' })
  })
})

/**
 * ID validation (MongoDB ObjectId or UUID)
 */
export const idSchema = z
  .string()
  .regex(
    /^[0-9a-fA-F]{24}$|^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    'Invalid ID format'
  )

/**
 * Boolean string coercion (for form inputs)
 */
export const booleanSchema = z
  .enum(['true', 'false', '1', '0', 'yes', 'no'])
  .transform(val => val === 'true' || val === '1' || val === 'yes')
  .or(z.boolean())

/**
 * Healthcare-specific: NPI number validation
 */
export const npiSchema = z
  .string()
  .regex(/^\d{10}$/, 'NPI must be exactly 10 digits')
  .refine(npi => {
    // Luhn algorithm validation for NPI
    const digits = npi.split('').map(Number)
    const check = digits.pop()!
    digits.reverse()
    
    let sum = 0
    digits.forEach((digit, index) => {
      if (index % 2 === 0) {
        digit *= 2
        if (digit > 9) digit -= 9
      }
      sum += digit
    })
    
    const checkDigit = (Math.ceil(sum / 10) * 10 - sum) % 10
    return checkDigit === check
  }, 'Invalid NPI number')

/**
 * Healthcare-specific: License number validation
 */
export const licenseNumberSchema = z
  .string()
  .trim()
  .min(4, 'License number is too short')
  .max(20, 'License number is too long')
  .regex(/^[A-Z0-9-]+$/i, 'Invalid license number format')

/**
 * Sanitize and validate JSON data
 */
export const jsonSchema = <T extends z.ZodType>(schema: T) => z
  .string()
  .transform((str, ctx) => {
    try {
      return JSON.parse(str)
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid JSON format'
      })
      return z.NEVER
    }
  })
  .pipe(schema)

/**
 * Create a required field validator with custom message
 */
export const requiredField = (fieldName: string) => 
  z.string().min(1, `${fieldName} is required`)

/**
 * Create an optional field validator that transforms empty strings to undefined
 */
export const optionalField = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal(''), schema]).transform(val => val === '' ? undefined : val)

export default {
  email: emailSchema,
  phone: phoneSchema,
  url: urlSchema,
  safeText: safeTextSchema,
  searchQuery: searchQuerySchema,
  pagination: paginationSchema,
  dateRange: dateRangeSchema,
  money: moneySchema,
  usState: usStateSchema,
  address: addressSchema,
  fileUpload: fileUploadSchema,
  resumeUpload: resumeUploadSchema,
  id: idSchema,
  boolean: booleanSchema,
  npi: npiSchema,
  licenseNumber: licenseNumberSchema,
  json: jsonSchema,
  requiredField,
  optionalField
}