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

    // Send notification emails
    await sendPurchaseConfirmationEmail(purchase, paymentIntent.amount)
    await sendInternalPurchaseNotification(purchase, paymentIntent.amount)
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

// Email notification helpers
async function sendPurchaseConfirmationEmail(purchase: any, amount: number) {
  try {
    const { EmailService } = await import('@/services/email-service')
    
    const buyer = await db.user.findUnique({
      where: { id: purchase.buyerId },
      select: { email: true, name: true }
    })

    if (!buyer) return

    await EmailService.sendTemplateEmail('lead_purchase_confirmation', buyer.email, {
      purchaseId: purchase.id,
      amount,
      leadPreview: {
        industry: purchase.lead?.metadata?.industry || 'Healthcare',
        location: purchase.lead?.metadata?.location || 'United States',
        source: purchase.leadSource,
        score: purchase.leadScore,
      },
      purchaseDate: purchase.createdAt,
    })
  } catch (error) {
    console.error('Failed to send purchase confirmation email:', error)
  }
}

async function sendInternalPurchaseNotification(purchase: any, amount: number) {
  try {
    const { EmailService } = await import('@/services/email-service')
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@locumtruerate.com'
    
    const buyer = await db.user.findUnique({
      where: { id: purchase.buyerId },
      select: { email: true, name: true }
    })

    await EmailService.sendTemplateEmail('lead_purchase_notification', adminEmail, {
      purchaseId: purchase.id,
      amount,
      buyerInfo: buyer,
      leadInfo: {
        id: purchase.leadId,
        source: purchase.leadSource,
        score: purchase.leadScore,
      },
    })
  } catch (error) {
    console.error('Failed to send internal purchase notification:', error)
  }
}