/**
 * Validation Schema Exports for LocumTrueRate.com
 * 
 * Central export point for all validation schemas.
 * Import from here to ensure consistent validation across the application.
 */

export * from './common'
export * from './auth'
export * from './payment'
export * from './search'

// Re-export default objects for convenience
import commonSchemas from './common'
import authSchemas from './auth'
import paymentSchemas from './payment'
import searchSchemas from './search'

export const schemas = {
  common: commonSchemas,
  auth: authSchemas,
  payment: paymentSchemas,
  search: searchSchemas
}

// Export commonly used schemas directly
export {
  emailSchema,
  phoneSchema,
  safeTextSchema,
  searchQuerySchema,
  paginationSchema,
  moneySchema,
  addressSchema,
  idSchema
} from './common'

export {
  signUpSchema,
  signInSchema,
  passwordSchema,
  profileUpdateSchema
} from './auth'

export {
  boostPaymentSchema,
  billingInfoSchema,
  paymentMethodSchema
} from './payment'

export {
  jobSearchFiltersSchema,
  searchRequestSchema,
  sortOptionsSchema
} from './search'