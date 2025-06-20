/**
 * Stripe Webhook Validation Schemas
 * 
 * Validates incoming Stripe webhook payloads to ensure data integrity
 * and prevent processing of malformed or malicious data
 */

import { z } from 'zod'

// Common Stripe object schemas
const stripeMetadataSchema = z.record(z.string()).optional()

const stripePriceSchema = z.object({
  id: z.string(),
  object: z.literal('price'),
  active: z.boolean(),
  currency: z.string(),
  product: z.string(),
  unit_amount: z.number().nullable(),
  recurring: z.object({
    interval: z.enum(['day', 'week', 'month', 'year']),
    interval_count: z.number()
  }).nullable().optional()
})

const stripeSubscriptionItemSchema = z.object({
  id: z.string(),
  object: z.literal('subscription_item'),
  price: z.union([z.string(), stripePriceSchema]),
  quantity: z.number().optional()
})

// Stripe Subscription Schema
export const stripeSubscriptionSchema = z.object({
  id: z.string(),
  object: z.literal('subscription'),
  customer: z.string(),
  status: z.enum([
    'incomplete',
    'incomplete_expired', 
    'trialing',
    'active',
    'past_due',
    'canceled',
    'unpaid',
    'paused'
  ]),
  items: z.object({
    data: z.array(stripeSubscriptionItemSchema)
  }),
  created: z.number(),
  current_period_start: z.number(),
  current_period_end: z.number(),
  cancel_at_period_end: z.boolean(),
  canceled_at: z.number().nullable(),
  ended_at: z.number().nullable(),
  metadata: stripeMetadataSchema,
  // Additional fields as needed
  billing_cycle_anchor: z.number().optional(),
  trial_start: z.number().nullable().optional(),
  trial_end: z.number().nullable().optional()
})

// Stripe Invoice Schema
export const stripeInvoiceSchema = z.object({
  id: z.string(),
  object: z.literal('invoice'),
  customer: z.string(),
  subscription: z.string().nullable(),
  status: z.enum([
    'draft',
    'open',
    'paid',
    'uncollectible',
    'void'
  ]).optional(),
  amount_due: z.number(),
  amount_paid: z.number(),
  amount_remaining: z.number(),
  currency: z.string(),
  hosted_invoice_url: z.string().nullable(),
  invoice_pdf: z.string().nullable(),
  payment_intent: z.string().nullable(),
  metadata: stripeMetadataSchema,
  lines: z.object({
    data: z.array(z.any()) // Simplified for now
  }).optional()
})

// Stripe Customer Schema
export const stripeCustomerSchema = z.object({
  id: z.string(),
  object: z.literal('customer'),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  description: z.string().nullable(),
  created: z.number(),
  metadata: stripeMetadataSchema,
  phone: z.string().nullable(),
  balance: z.number().optional(),
  currency: z.string().nullable().optional(),
  default_source: z.string().nullable().optional()
})

// Stripe Payment Method Schema
export const stripePaymentMethodSchema = z.object({
  id: z.string(),
  object: z.literal('payment_method'),
  customer: z.string().nullable(),
  type: z.enum([
    'card',
    'bank_account',
    'ach_debit',
    'sepa_debit'
  ]),
  card: z.object({
    brand: z.string(),
    last4: z.string(),
    exp_month: z.number(),
    exp_year: z.number()
  }).optional(),
  created: z.number(),
  livemode: z.boolean(),
  metadata: stripeMetadataSchema
})

// Webhook Event Schema
export const stripeWebhookEventSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  api_version: z.string(),
  created: z.number(),
  type: z.string(),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().nullable(),
    idempotency_key: z.string().nullable()
  }).nullable(),
  data: z.object({
    object: z.any() // Will be validated based on event type
  })
})

// Event-specific validation functions
export function validateSubscriptionEvent(data: unknown) {
  return stripeSubscriptionSchema.parse(data)
}

export function validateInvoiceEvent(data: unknown) {
  return stripeInvoiceSchema.parse(data)
}

export function validateCustomerEvent(data: unknown) {
  return stripeCustomerSchema.parse(data)
}

export function validatePaymentMethodEvent(data: unknown) {
  return stripePaymentMethodSchema.parse(data)
}

// Helper to validate webhook payload based on event type
export function validateWebhookPayload(event: { type: string; data: { object: unknown } }) {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      return validateSubscriptionEvent(event.data.object)
    
    case 'invoice.payment_succeeded':
    case 'invoice.payment_failed':
      return validateInvoiceEvent(event.data.object)
    
    case 'customer.created':
    case 'customer.updated':
      return validateCustomerEvent(event.data.object)
    
    case 'payment_method.attached':
      return validatePaymentMethodEvent(event.data.object)
    
    default:
      // For unhandled events, just return the raw data
      return event.data.object
  }
}