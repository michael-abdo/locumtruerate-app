/**
 * Validation Helper Functions for LocumTrueRate.com
 * 
 * Utility functions to help apply validation across the application
 */

import { z, ZodError } from 'zod'
import type { FieldErrors } from 'react-hook-form'

/**
 * Convert Zod errors to React Hook Form field errors
 */
export function zodErrorsToFieldErrors<T>(
  error: ZodError
): FieldErrors<T> {
  const fieldErrors: FieldErrors<T> = {}
  
  error.errors.forEach((err) => {
    const field = err.path.join('.') as keyof T
    if (!fieldErrors[field]) {
      fieldErrors[field] = {
        type: err.code,
        message: err.message
      }
    }
  })
  
  return fieldErrors
}

/**
 * Safe parse with error handling
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const field = err.path.join('.')
        errors[field] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _root: 'Validation failed' } }
  }
}

/**
 * Sanitize form data before submission
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  fields: Array<keyof T>
): T {
  const sanitized = { ...data }
  
  fields.forEach((field) => {
    if (typeof sanitized[field] === 'string') {
      // Trim whitespace
      sanitized[field] = sanitized[field].trim() as T[typeof field]
      
      // Remove null bytes
      sanitized[field] = sanitized[field].replace(/\0/g, '') as T[typeof field]
    }
  })
  
  return sanitized
}

/**
 * Create a validated form handler
 */
export function createValidatedHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T) => void | Promise<void>,
  onError?: (errors: Record<string, string>) => void
) {
  return async (data: unknown) => {
    const result = safeParse(schema, data)
    
    if (result.success) {
      await handler(result.data)
    } else if (onError) {
      onError(result.errors)
    }
  }
}

/**
 * Validation error messages helper
 */
export const ValidationMessages = {
  required: (field: string) => `${field} is required`,
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  url: 'Please enter a valid URL',
  password: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character',
  passwordMatch: 'Passwords do not match',
  terms: 'You must accept the terms and conditions',
  privacy: 'You must accept the privacy policy',
  fileSize: (maxMB: number) => `File must be less than ${maxMB}MB`,
  fileType: (types: string[]) => `Only ${types.join(', ')} files are allowed`
}

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // US phone number
  phone: /^(\+1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  
  // Strong password
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  
  // Safe text (no HTML)
  safeText: /^[^<>]*$/,
  
  // Alphanumeric with spaces and basic punctuation
  alphanumericExtended: /^[a-zA-Z0-9\s\-_.,'!?@#$%&*()+=]+$/,
  
  // US ZIP code
  zipCode: /^\d{5}(-\d{4})?$/,
  
  // NPI number
  npi: /^\d{10}$/,
  
  // License number
  license: /^[A-Z0-9-]+$/i
}

/**
 * Input sanitization functions
 */
export const Sanitizers = {
  // Remove HTML tags
  stripHtml: (input: string): string => {
    return input.replace(/<[^>]*>/g, '')
  },
  
  // Remove SQL injection characters
  stripSqlChars: (input: string): string => {
    return input.replace(/[';\\]/g, '')
  },
  
  // Normalize whitespace
  normalizeWhitespace: (input: string): string => {
    return input.replace(/\s+/g, ' ').trim()
  },
  
  // Format phone number
  formatPhone: (input: string): string => {
    return input.replace(/\D/g, '')
  },
  
  // Sanitize for display
  sanitizeForDisplay: (input: string): string => {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
}

export default {
  zodErrorsToFieldErrors,
  safeParse,
  sanitizeFormData,
  createValidatedHandler,
  ValidationMessages,
  ValidationPatterns,
  Sanitizers
}