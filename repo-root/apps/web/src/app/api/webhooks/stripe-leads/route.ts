import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_LEADS!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = headers()
  const sig = headersList.get('stripe-signature')

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Log webhook event for monitoring

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (error) {
    console.error('Error handling webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Process successful payment

  // Check if this is a lead purchase
  if (paymentIntent.metadata.type !== 'lead_purchase') {
    return
  }

  const { leadId, buyerId, listingId } = paymentIntent.metadata

  try {
    // Update the purchase record
    const purchase = await db.leadPurchase.update({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        paymentStatus: 'completed',
        accessGranted: true,
        accessGrantedAt: new Date(),
      },
    })

    // Update listing availability if max purchases reached
    const listing = await db.leadListing.findUnique({
      where: { id: listingId },
    })

    if (listing && listing.currentPurchases >= listing.maxPurchases) {
      await db.leadListing.update({
        where: { id: listingId },
        data: { isAvailable: false },
      })
    }

    // Send notification email
    await sendPurchaseConfirmationEmail(purchase, paymentIntent.amount)
  } catch (error) {
    console.error('Error updating lead purchase:', error)
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Process failed payment

  if (paymentIntent.metadata.type !== 'lead_purchase') {
    return
  }

  try {
    // Update the purchase record
    await db.leadPurchase.update({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        paymentStatus: 'failed',
      },
    })

    // Restore listing availability
    const { listingId } = paymentIntent.metadata
    if (listingId) {
      await db.leadListing.update({
        where: { id: listingId },
        data: {
          currentPurchases: { decrement: 1 },
          isAvailable: true,
        },
      })
    }

    // Lead purchase marked as failed
  } catch (error) {
    console.error('Error handling failed payment:', error)
    throw error
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  // Process canceled payment

  if (paymentIntent.metadata.type !== 'lead_purchase') {
    return
  }

  try {
    // Update the purchase record
    await db.leadPurchase.update({
      where: {
        stripePaymentId: paymentIntent.id,
      },
      data: {
        paymentStatus: 'failed',
      },
    })

    // Restore listing availability
    const { listingId } = paymentIntent.metadata
    if (listingId) {
      await db.leadListing.update({
        where: { id: listingId },
        data: {
          currentPurchases: { decrement: 1 },
          isAvailable: true,
        },
      })
    }

    // Lead purchase marked as canceled
  } catch (error) {
    console.error('Error handling canceled payment:', error)
    throw error
  }
}

// Email notification helper
async function sendPurchaseConfirmationEmail(purchase: any, amount: number) {
  // TODO: Implement email notification using SendGrid, AWS SES, or another email service

  // Example implementation:
  /*
  await emailService.send({
    to: purchase.buyer.email,
    template: 'lead-purchase-confirmation',
    data: {
      purchaseId: purchase.id,
      amount: amount / 100,
      leadPreview: purchase.lead.preview,
    },
  })
  */
}