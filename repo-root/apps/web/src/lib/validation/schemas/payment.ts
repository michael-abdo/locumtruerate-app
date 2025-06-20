/**
 * Payment Validation Schemas for LocumTrueRate.com
 * 
 * Validation schemas for payment forms and financial data.
 * Ensures PCI compliance and secure handling of payment information.
 */

import { z } from 'zod'
import { emailSchema, phoneSchema, addressSchema, moneySchema, safeTextSchema } from './common'

/**
 * Credit card number validation (for display only - never store)
 */
export const creditCardNumberSchema = z
  .string()
  .regex(/^\d{13,19}$/, 'Invalid credit card number')
  .transform(val => val.replace(/\s/g, ''))

/**
 * Credit card expiry validation
 */
export const cardExpirySchema = z
  .string()
  .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Invalid expiry format (MM/YY)')
  .refine(val => {
    const [month, year] = val.split('/').map(Number)
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    
    if (year < currentYear) return false
    if (year === currentYear && month < currentMonth) return false
    return true
  }, 'Card has expired')

/**
 * CVV validation
 */
export const cvvSchema = z
  .string()
  .regex(/^\d{3,4}$/, 'Invalid CVV')

/**
 * Billing information validation
 */
export const billingInfoSchema = z.object({
  cardholderName: safeTextSchema(2, 100),
  email: emailSchema,
  phone: phoneSchema.optional(),
  billingAddress: addressSchema
})

/**
 * Payment method validation
 */
export const paymentMethodSchema = z.object({
  type: z.enum(['card', 'ach', 'wire']),
  last4: z.string().regex(/^\d{4}$/).optional(),
  brand: z.enum(['visa', 'mastercard', 'amex', 'discover']).optional(),
  bankName: safeTextSchema(2, 100).optional(),
  accountType: z.enum(['checking', 'savings']).optional()
})

/**
 * Job boost payment validation
 */
export const boostPaymentSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  boostType: z.enum(['featured', 'urgent', 'premium', 'sponsored']),
  duration: z.number().int().min(1).max(30),
  amount: moneySchema
})

/**
 * Subscription plan validation
 */
export const subscriptionPlanSchema = z.object({
  planId: z.enum(['basic', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'annual']),
  seats: z.number().int().min(1).max(1000).optional(),
  addons: z.array(z.enum(['analytics', 'api_access', 'priority_support'])).optional()
})

/**
 * Invoice validation
 */
export const invoiceSchema = z.object({
  invoiceNumber: z.string().regex(/^INV-\d{6,}$/, 'Invalid invoice number'),
  amount: moneySchema,
  dueDate: z.coerce.date(),
  items: z.array(z.object({
    description: safeTextSchema(1, 200),
    quantity: z.number().positive(),
    unitPrice: moneySchema,
    total: moneySchema
  }))
})

/**
 * Refund request validation
 */
export const refundRequestSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  reason: z.enum(['duplicate', 'fraudulent', 'service_issue', 'other']),
  amount: moneySchema,
  description: safeTextSchema(10, 500)
})

/**
 * Payment intent validation (Stripe)
 */
export const paymentIntentSchema = z.object({
  amount: moneySchema,
  currency: z.literal('usd'),
  paymentMethodId: z.string().optional(),
  setupFutureUsage: z.enum(['on_session', 'off_session']).optional(),
  metadata: z.record(z.string()).optional()
})

/**
 * ACH bank account validation
 */
export const achAccountSchema = z.object({
  accountHolderName: safeTextSchema(2, 100),
  accountNumber: z.string().regex(/^\d{4,17}$/, 'Invalid account number'),
  routingNumber: z.string().regex(/^\d{9}$/, 'Routing number must be 9 digits'),
  accountType: z.enum(['checking', 'savings'])
})

/**
 * Wire transfer validation
 */
export const wireTransferSchema = z.object({
  beneficiaryName: safeTextSchema(2, 100),
  beneficiaryAddress: addressSchema,
  bankName: safeTextSchema(2, 100),
  bankAddress: addressSchema,
  swiftCode: z.string().regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code'),
  accountNumber: z.string().min(8).max(34),
  reference: safeTextSchema(0, 140).optional()
})

/**
 * Discount code validation
 */
export const discountCodeSchema = z
  .string()
  .toUpperCase()
  .regex(/^[A-Z0-9]{4,20}$/, 'Invalid discount code format')

/**
 * Payment confirmation validation
 */
export const paymentConfirmationSchema = z.object({
  paymentIntentId: z.string().min(1),
  status: z.enum(['succeeded', 'processing', 'requires_action', 'failed']),
  amount: moneySchema,
  receiptUrl: z.string().url().optional()
})

export default {
  creditCardNumber: creditCardNumberSchema,
  cardExpiry: cardExpirySchema,
  cvv: cvvSchema,
  billingInfo: billingInfoSchema,
  paymentMethod: paymentMethodSchema,
  boostPayment: boostPaymentSchema,
  subscriptionPlan: subscriptionPlanSchema,
  invoice: invoiceSchema,
  refundRequest: refundRequestSchema,
  paymentIntent: paymentIntentSchema,
  achAccount: achAccountSchema,
  wireTransfer: wireTransferSchema,
  discountCode: discountCodeSchema,
  paymentConfirmation: paymentConfirmationSchema
}