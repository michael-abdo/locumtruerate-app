import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { z } from 'zod'
import { db } from '@locumtruerate/database'
import { SubscriptionTier } from '@locumtruerate/database'
import { 
  validateWebhookPayload,
  stripeWebhookEventSchema 
} from '@/lib/validation/schemas/stripe-webhook'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

/**
 * Stripe Webhook Handler
 * 
 * Critical for maintaining subscription state synchronization between Stripe and our database
 * Handles all subscription lifecycle events to prevent revenue loss
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = headers().get('stripe-signature') as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('Processing Stripe webhook:', event.type, event.id)

  try {
    // Validate the event structure first
    const validatedEvent = stripeWebhookEventSchema.parse(event)
    
    // Validate the payload based on event type
    const validatedData = validateWebhookPayload(validatedEvent)

    switch (event.type) {
      // Subscription created - customer successfully subscribed
      case 'customer.subscription.created':
        await handleSubscriptionCreated(validatedData as Stripe.Subscription)
        break

      // Subscription updated - plan changes, status changes
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(validatedData as Stripe.Subscription)
        break

      // Subscription deleted - cancellation
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(validatedData as Stripe.Subscription)
        break

      // Invoice payment succeeded - successful billing
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(validatedData as Stripe.Invoice)
        break

      // Invoice payment failed - failed billing
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(validatedData as Stripe.Invoice)
        break

      // Payment method attached - customer adds payment method
      case 'payment_method.attached':
        await handlePaymentMethodAttached(validatedData as Stripe.PaymentMethod)
        break

      // Customer created - new customer in Stripe
      case 'customer.created':
        await handleCustomerCreated(validatedData as Stripe.Customer)
        break

      // Customer updated - customer info changed
      case 'customer.updated':
        await handleCustomerUpdated(validatedData as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      console.error('Webhook validation error:', error.errors)
      return NextResponse.json(
        { error: 'Invalid webhook payload', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  
  // Determine subscription tier from price ID
  const tier = getTierFromPriceId(priceId)
  
  // Update user subscription in database
  await db.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
      subscriptionStartDate: new Date(subscription.created * 1000),
    }
  })

  console.log('Subscription created:', {
    customerId,
    subscriptionId: subscription.id,
    tier,
    status: subscription.status,
  })
}

/**
 * Handle subscription updates (plan changes, status changes)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const priceId = subscription.items.data[0]?.price.id
  
  // Determine new subscription tier
  const tier = getTierFromPriceId(priceId)
  
  // Update user subscription in database
  await db.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: tier,
      subscriptionStatus: subscription.status,
    }
  })

  console.log('Subscription updated:', {
    customerId,
    subscriptionId: subscription.id,
    tier,
    status: subscription.status,
  })
}

/**
 * Handle subscription deletion (cancellation)
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Downgrade to FREE tier
  await db.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'cancelled',
    }
  })

  console.log('Subscription deleted:', {
    customerId,
    subscriptionId: subscription.id,
  })
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    // Payment succeeded - ensure subscription is active
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: 'active',
      }
    })

    console.log('Invoice payment succeeded:', {
      customerId,
      subscriptionId,
      amount: invoice.amount_paid,
    })
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  const subscriptionId = invoice.subscription as string
  
  if (subscriptionId) {
    // Payment failed - mark as past due
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        subscriptionStatus: 'past_due',
      }
    })

    // Get user info for notification
    const user = await db.user.findFirst({
      where: { stripeCustomerId: customerId },
      select: { email: true, contactName: true }
    })

    if (user) {
      // Import email service dynamically to avoid circular dependencies
      try {
        const { EmailService } = await import('@locumtruerate/api')
        
        await EmailService.sendTemplateEmail('payment_failed', user.email, {
          customerName: user.contactName,
          amount: invoice.amount_due / 100, // Convert from cents
          updatePaymentUrl: `${process.env.NEXTAUTH_URL}/subscription/update-payment`,
          invoiceUrl: invoice.hosted_invoice_url,
        })
      } catch (error) {
        console.error('Failed to send payment failed email:', error)
      }
    }

    console.log('Invoice payment failed:', {
      customerId,
      subscriptionId,
      amount: invoice.amount_due,
    })
  }
}

/**
 * Handle payment method attachment
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', {
    customerId: paymentMethod.customer,
    paymentMethodId: paymentMethod.id,
    type: paymentMethod.type,
  })
  
  // Could trigger email notification about new payment method
}

/**
 * Handle customer creation
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', {
    customerId: customer.id,
    email: customer.email,
  })
}

/**
 * Handle customer updates
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', {
    customerId: customer.id,
    email: customer.email,
  })
}

/**
 * Determine subscription tier from Stripe price ID
 */
function getTierFromPriceId(priceId?: string): SubscriptionTier {
  if (!priceId) return 'FREE'
  
  // Match against our defined price IDs
  if (priceId.includes('pro') || priceId.includes('299')) {
    return 'PRO'
  } else if (priceId.includes('enterprise') || priceId.includes('699')) {
    return 'ENTERPRISE'
  }
  
  return 'FREE'
}

// Handle CORS for webhook endpoint
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://api.stripe.com',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'stripe-signature, content-type',
    },
  })
}