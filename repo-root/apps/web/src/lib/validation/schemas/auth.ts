/**
 * Authentication Validation Schemas for LocumTrueRate.com
 * 
 * Validation schemas for authentication-related forms and API endpoints.
 * Ensures HIPAA-compliant security for user authentication flows.
 */

import { z } from 'zod'
import { emailSchema, phoneSchema, safeTextSchema } from './common'

/**
 * Password validation with security requirements
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password is too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  )

/**
 * Sign up form validation
 */
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: safeTextSchema(2, 50),
  lastName: safeTextSchema(2, 50),
  userType: z.enum(['locum', 'recruiter', 'admin', 'enterprise']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  }),
  acceptHipaa: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge HIPAA compliance requirements'
  })
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

/**
 * Sign in form validation
 */
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
})

/**
 * Password reset request
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema
})

/**
 * Password reset confirmation
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

/**
 * Two-factor authentication
 */
export const twoFactorSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only numbers')
})

/**
 * Email verification
 */
export const emailVerificationSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

/**
 * Profile update validation
 */
export const profileUpdateSchema = z.object({
  firstName: safeTextSchema(2, 50).optional(),
  lastName: safeTextSchema(2, 50).optional(),
  phone: phoneSchema.optional(),
  bio: safeTextSchema(0, 500).optional(),
  specialty: safeTextSchema(2, 100).optional(),
  licenseNumber: z
    .string()
    .regex(/^[A-Z0-9-]+$/i, 'Invalid license format')
    .optional(),
  npiNumber: z
    .string()
    .regex(/^\d{10}$/, 'NPI must be 10 digits')
    .optional()
})

/**
 * Change password validation
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

/**
 * Session validation
 */
export const sessionTokenSchema = z
  .string()
  .min(32, 'Invalid session token')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid token format')

/**
 * API key validation
 */
export const apiKeySchema = z
  .string()
  .min(32, 'Invalid API key')
  .regex(/^[A-Za-z0-9_-]+$/, 'Invalid API key format')

/**
 * OAuth provider validation
 */
export const oauthProviderSchema = z.enum(['google', 'microsoft', 'apple'])

/**
 * Device trust validation
 */
export const deviceTrustSchema = z.object({
  deviceId: z.string().uuid(),
  deviceName: safeTextSchema(1, 100),
  trustToken: z.string().min(32),
  expiresAt: z.coerce.date()
})

export default {
  password: passwordSchema,
  signUp: signUpSchema,
  signIn: signInSchema,
  resetPasswordRequest: resetPasswordRequestSchema,
  resetPassword: resetPasswordSchema,
  twoFactor: twoFactorSchema,
  emailVerification: emailVerificationSchema,
  profileUpdate: profileUpdateSchema,
  changePassword: changePasswordSchema,
  sessionToken: sessionTokenSchema,
  apiKey: apiKeySchema,
  oauthProvider: oauthProviderSchema,
  deviceTrust: deviceTrustSchema
}