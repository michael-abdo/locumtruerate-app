import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import Stripe from 'stripe'

// Subscription tier definitions
export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE'

export interface SubscriptionFeatures {
  jobPostings: number | 'unlimited'
  teamMembers: number | 'unlimited'
  applicationsPerJob: number | 'unlimited'
  leadAccess: boolean
  advancedAnalytics: boolean
  prioritySupport: boolean
  customBranding: boolean
  apiAccess: boolean
  boostCredits: number
  calculatorExports: number | 'unlimited'
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionFeatures> = {
  FREE: {
    jobPostings: 1,
    teamMembers: 1,
    applicationsPerJob: 50,
    leadAccess: false,
    advancedAnalytics: false,
    prioritySupport: false,
    customBranding: false,
    apiAccess: false,
    boostCredits: 0,
    calculatorExports: 5,
  },
  PRO: {
    jobPostings: 25,
    teamMembers: 5,
    applicationsPerJob: 500,
    leadAccess: true,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: false,
    apiAccess: false,
    boostCredits: 10,
    calculatorExports: 'unlimited',
  },
  ENTERPRISE: {
    jobPostings: 'unlimited',
    teamMembers: 'unlimited',
    applicationsPerJob: 'unlimited',
    leadAccess: true,
    advancedAnalytics: true,
    prioritySupport: true,
    customBranding: true,
    apiAccess: true,
    boostCredits: 50,
    calculatorExports: 'unlimited',
  },
}

// Subscription plan configuration
export const SUBSCRIPTION_PLANS = {
  PRO: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly_299',
    yearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly_2990',
    name: 'Pro',
    description: 'Perfect for growing recruitment teams',
    monthlyPrice: 29900, // $299.00 in cents
    yearlyPrice: 299000, // $2,990.00 in cents (save ~17%)
    tier: 'PRO' as SubscriptionTier,
  },
  ENTERPRISE: {
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly_699',
    yearlyPriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || 'price_enterprise_yearly_6990',
    name: 'Enterprise',
    description: 'Advanced features for large organizations',
    monthlyPrice: 69900, // $699.00 in cents
    yearlyPrice: 699000, // $6,990.00 in cents (save ~17%)
    tier: 'ENTERPRISE' as SubscriptionTier,
  },
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const paymentsRouter = createTRPCRouter({
  // Create subscription checkout session
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        priceId: z.string(),
        successUrl: z.string(),
        cancelUrl: z.string(),
        customerId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user email from database
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { email: true }
        })
        
        if (!user) {
          throw new Error('User not found')
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'subscription',
          customer: input.customerId,
          customer_email: user.email,
          line_items: [
            {
              price: input.priceId,
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          allow_promotion_codes: true,
          billing_address_collection: 'required',
          customer_update: {
            address: 'auto',
            name: 'auto',
          },
          metadata: {
            userId: ctx.user.id,
            priceId: input.priceId,
          },
        })

        return {
          sessionId: session.id,
          url: session.url,
        }
      } catch (error) {
        console.error('Stripe checkout session creation failed:', error)
        throw new Error('Failed to create checkout session')
      }
    }),

  // Create customer portal session
  createCustomerPortal: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        returnUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: input.customerId,
          return_url: input.returnUrl,
        })

        return {
          url: session.url,
        }
      } catch (error) {
        console.error('Stripe customer portal creation failed:', error)
        throw new Error('Failed to create customer portal session')
      }
    }),

  // Get subscription plans with tier information
  getSubscriptionPlans: publicProcedure
    .query(async () => {
      try {
        // Return our predefined plans with features
        return [
          {
            id: 'free',
            name: 'Free',
            description: 'Perfect for trying out the platform',
            price: 0,
            currency: 'usd',
            interval: 'month',
            tier: 'FREE' as SubscriptionTier,
            features: SUBSCRIPTION_TIERS.FREE,
            priceId: null,
            popular: false,
          },
          {
            id: 'pro',
            name: SUBSCRIPTION_PLANS.PRO.name,
            description: SUBSCRIPTION_PLANS.PRO.description,
            price: SUBSCRIPTION_PLANS.PRO.monthlyPrice,
            yearlyPrice: SUBSCRIPTION_PLANS.PRO.yearlyPrice,
            currency: 'usd',
            interval: 'month',
            tier: SUBSCRIPTION_PLANS.PRO.tier,
            features: SUBSCRIPTION_TIERS.PRO,
            priceId: SUBSCRIPTION_PLANS.PRO.priceId,
            yearlyPriceId: SUBSCRIPTION_PLANS.PRO.yearlyPriceId,
            popular: true,
          },
          {
            id: 'enterprise',
            name: SUBSCRIPTION_PLANS.ENTERPRISE.name,
            description: SUBSCRIPTION_PLANS.ENTERPRISE.description,
            price: SUBSCRIPTION_PLANS.ENTERPRISE.monthlyPrice,
            yearlyPrice: SUBSCRIPTION_PLANS.ENTERPRISE.yearlyPrice,
            currency: 'usd',
            interval: 'month',
            tier: SUBSCRIPTION_PLANS.ENTERPRISE.tier,
            features: SUBSCRIPTION_TIERS.ENTERPRISE,
            priceId: SUBSCRIPTION_PLANS.ENTERPRISE.priceId,
            yearlyPriceId: SUBSCRIPTION_PLANS.ENTERPRISE.yearlyPriceId,
            popular: false,
          },
        ]
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error)
        throw new Error('Failed to fetch subscription plans')
      }
    }),

  // Get user's current subscription tier
  getUserSubscriptionTier: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Get user's subscription from database
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: {
            stripeCustomerId: true,
            subscriptionTier: true,
            subscriptionStatus: true,
          }
        })

        if (!user?.stripeCustomerId) {
          return {
            tier: 'FREE' as SubscriptionTier,
            features: SUBSCRIPTION_TIERS.FREE,
            status: 'active',
          }
        }

        // Get active subscription from Stripe
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1,
          expand: ['data.items.data.price.product'],
        })

        if (subscriptions.data.length === 0) {
          return {
            tier: 'FREE' as SubscriptionTier,
            features: SUBSCRIPTION_TIERS.FREE,
            status: 'inactive',
          }
        }

        const subscription = subscriptions.data[0]
        const priceId = subscription.items.data[0].price.id
        
        // Determine tier based on price ID
        let tier: SubscriptionTier = 'FREE'
        if (priceId === SUBSCRIPTION_PLANS.PRO.priceId || priceId === SUBSCRIPTION_PLANS.PRO.yearlyPriceId) {
          tier = 'PRO'
        } else if (priceId === SUBSCRIPTION_PLANS.ENTERPRISE.priceId || priceId === SUBSCRIPTION_PLANS.ENTERPRISE.yearlyPriceId) {
          tier = 'ENTERPRISE'
        }

        return {
          tier,
          features: SUBSCRIPTION_TIERS[tier],
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }
      } catch (error) {
        console.error('Failed to get user subscription tier:', error)
        return {
          tier: 'FREE' as SubscriptionTier,
          features: SUBSCRIPTION_TIERS.FREE,
          status: 'error',
        }
      }
    }),

  // Check if user can perform action based on subscription tier
  checkFeatureAccess: protectedProcedure
    .input(
      z.object({
        feature: z.enum(['jobPostings', 'teamMembers', 'leadAccess', 'advancedAnalytics', 'prioritySupport', 'customBranding', 'apiAccess', 'boostCredits', 'calculatorExports']),
        requestedAmount: z.number().optional(), // For features with limits
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get user's current tier
        const userTier = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { subscriptionTier: true }
        })

        const tier = (userTier?.subscriptionTier as SubscriptionTier) || 'FREE'
        const features = SUBSCRIPTION_TIERS[tier]
        const featureValue = features[input.feature]

        // Check boolean features
        if (typeof featureValue === 'boolean') {
          return {
            hasAccess: featureValue,
            tier,
            limit: featureValue ? 'unlimited' : 0,
            usage: 0,
          }
        }

        // Check numeric/unlimited features
        if (featureValue === 'unlimited') {
          return {
            hasAccess: true,
            tier,
            limit: 'unlimited',
            usage: 0,
          }
        }

        // For numeric limits, check if requested amount is within limit
        const requestedAmount = input.requestedAmount || 1
        return {
          hasAccess: requestedAmount <= featureValue,
          tier,
          limit: featureValue,
          usage: 0, // TODO: Get actual usage from database
        }
      } catch (error) {
        console.error('Failed to check feature access:', error)
        throw new Error('Failed to check feature access')
      }
    }),

  // Get customer subscription
  getCustomerSubscription: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: input.customerId,
          status: 'all',
          limit: 1,
          expand: ['data.latest_invoice', 'data.items.data.price.product'],
        })

        if (subscriptions.data.length === 0) {
          return null
        }

        const subscription = subscriptions.data[0]
        const latestInvoice = subscription.latest_invoice as Stripe.Invoice

        return {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: subscription.current_period_start,
          currentPeriodEnd: subscription.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at,
          trialStart: subscription.trial_start,
          trialEnd: subscription.trial_end,
          price: {
            id: subscription.items.data[0].price.id,
            amount: subscription.items.data[0].price.unit_amount,
            currency: subscription.items.data[0].price.currency,
            interval: subscription.items.data[0].price.recurring?.interval,
          },
          product: {
            name: (subscription.items.data[0].price.product as Stripe.Product).name,
            description: (subscription.items.data[0].price.product as Stripe.Product).description,
          },
          latestInvoice: latestInvoice ? {
            id: latestInvoice.id,
            status: latestInvoice.status,
            total: latestInvoice.total,
            paidAt: latestInvoice.status_transitions?.paid_at,
            hostedInvoiceUrl: latestInvoice.hosted_invoice_url,
          } : null,
        }
      } catch (error) {
        console.error('Failed to fetch customer subscription:', error)
        throw new Error('Failed to fetch customer subscription')
      }
    }),

  // Cancel subscription
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        cancelImmediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const subscription = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            cancel_at_period_end: !input.cancelImmediately,
            ...(input.cancelImmediately && {
              proration_behavior: 'create_prorations',
            }),
          }
        )

        return {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at,
        }
      } catch (error) {
        console.error('Failed to cancel subscription:', error)
        throw new Error('Failed to cancel subscription')
      }
    }),


  // Get customer payment methods
  getPaymentMethods: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: input.customerId,
          type: 'card',
        })

        return paymentMethods.data.map((pm) => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          } : null,
          isDefault: pm.id === paymentMethods.data[0]?.id,
        }))
      } catch (error) {
        console.error('Failed to fetch payment methods:', error)
        throw new Error('Failed to fetch payment methods')
      }
    }),

  // Get billing history
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const invoices = await stripe.invoices.list({
          customer: input.customerId,
          limit: input.limit,
          expand: ['data.subscription'],
        })

        return invoices.data.map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          total: invoice.total,
          currency: invoice.currency,
          created: invoice.created,
          dueDate: invoice.due_date,
          paidAt: invoice.status_transitions?.paid_at,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdf: invoice.invoice_pdf,
          subscription: invoice.subscription ? {
            id: (invoice.subscription as Stripe.Subscription).id,
          } : null,
        }))
      } catch (error) {
        console.error('Failed to fetch billing history:', error)
        throw new Error('Failed to fetch billing history')
      }
    }),

  // Create setup intent for adding payment method
  createSetupIntent: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const setupIntent = await stripe.setupIntents.create({
          customer: input.customerId,
          payment_method_types: ['card'],
          usage: 'off_session',
        })

        return {
          clientSecret: setupIntent.client_secret,
        }
      } catch (error) {
        console.error('Failed to create setup intent:', error)
        throw new Error('Failed to create setup intent')
      }
    }),

  // Delete payment method
  deletePaymentMethod: protectedProcedure
    .input(
      z.object({
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await stripe.paymentMethods.detach(input.paymentMethodId)
        return { success: true }
      } catch (error) {
        console.error('Failed to delete payment method:', error)
        throw new Error('Failed to delete payment method')
      }
    }),

  // Set default payment method
  setDefaultPaymentMethod: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await stripe.customers.update(input.customerId, {
          invoice_settings: {
            default_payment_method: input.paymentMethodId,
          },
        })

        return { success: true }
      } catch (error) {
        console.error('Failed to set default payment method:', error)
        throw new Error('Failed to set default payment method')
      }
    }),

  // Validate coupon
  validateCoupon: publicProcedure
    .input(
      z.object({
        couponCode: z.string(),
      })
    )
    .query(async ({ input }) => {
      try {
        const coupon = await stripe.coupons.retrieve(input.couponCode)
        
        return {
          id: coupon.id,
          valid: coupon.valid,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          currency: coupon.currency,
          duration: coupon.duration,
          durationInMonths: coupon.duration_in_months,
          maxRedemptions: coupon.max_redemptions,
          timesRedeemed: coupon.times_redeemed,
          redeemBy: coupon.redeem_by,
        }
      } catch (error) {
        console.error('Failed to validate coupon:', error)
        throw new Error('Invalid coupon code')
      }
    }),

  // Create boost payment checkout session
  createBoostCheckout: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        packageId: z.string(),
        packageName: z.string(),
        packagePrice: z.number(),
        packageDuration: z.number(),
        successUrl: z.string(),
        cancelUrl: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get user email from database
        const user = await ctx.db.user.findUnique({
          where: { id: ctx.user.id },
          select: { email: true }
        })
        
        if (!user) {
          throw new Error('User not found')
        }

        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          customer_email: user.email,
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `Job Boost: ${input.packageName}`,
                  description: `Boost your job listing for ${input.packageDuration} days`,
                  metadata: {
                    jobId: input.jobId,
                    packageId: input.packageId,
                    packageDuration: input.packageDuration.toString(),
                  },
                },
                unit_amount: input.packagePrice * 100, // Convert to cents
              },
              quantity: 1,
            },
          ],
          success_url: input.successUrl,
          cancel_url: input.cancelUrl,
          allow_promotion_codes: true,
          billing_address_collection: 'required',
          customer_update: {
            address: 'auto',
            name: 'auto',
          },
          metadata: {
            userId: ctx.user.id,
            jobId: input.jobId,
            packageId: input.packageId,
            packageDuration: input.packageDuration.toString(),
            type: 'boost',
          },
        })

        return {
          sessionId: session.id,
          url: session.url,
        }
      } catch (error) {
        console.error('Stripe boost checkout session creation failed:', error)
        throw new Error('Failed to create boost checkout session')
      }
    }),

  // Handle failed payment recovery
  retryFailedPayment: protectedProcedure
    .input(
      z.object({
        paymentIntentId: z.string(),
        paymentMethodId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Get the failed payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId)
        
        if (paymentIntent.status !== 'requires_payment_method') {
          throw new Error('Payment intent is not in a retryable state')
        }
        
        // Update with new payment method if provided
        const updateData: any = {}
        if (input.paymentMethodId) {
          updateData.payment_method = input.paymentMethodId
        }
        
        // Retry the payment
        const confirmedPayment = await stripe.paymentIntents.confirm(
          input.paymentIntentId,
          updateData
        )
        
        return {
          id: confirmedPayment.id,
          status: confirmedPayment.status,
          clientSecret: confirmedPayment.client_secret,
        }
      } catch (error) {
        console.error('Payment retry failed:', error)
        throw new Error('Failed to retry payment')
      }
    }),

  // Handle subscription recovery after failed payment
  recoverSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Update the subscription's default payment method
        const subscription = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            default_payment_method: input.paymentMethodId,
          }
        )
        
        // Get the latest invoice and retry payment
        const invoices = await stripe.invoices.list({
          subscription: input.subscriptionId,
          status: 'open',
          limit: 1,
        })
        
        if (invoices.data.length > 0) {
          const invoice = invoices.data[0]
          
          // Retry payment on the failed invoice
          const paidInvoice = await stripe.invoices.pay(invoice.id, {
            payment_method: input.paymentMethodId,
          })
          
          return {
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            invoiceId: paidInvoice.id,
            invoiceStatus: paidInvoice.status,
          }
        }
        
        return {
          subscriptionId: subscription.id,
          subscriptionStatus: subscription.status,
        }
      } catch (error) {
        console.error('Subscription recovery failed:', error)
        throw new Error('Failed to recover subscription')
      }
    }),

  // Handle dunning management for failed payments
  handleDunning: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        subscriptionId: z.string(),
        attemptCount: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { customerId, subscriptionId, attemptCount } = input
        
        // Get customer and subscription info
        const [customer, subscription] = await Promise.all([
          stripe.customers.retrieve(customerId),
          stripe.subscriptions.retrieve(subscriptionId),
        ])
        
        // Define dunning strategy based on attempt count
        let action: 'email_reminder' | 'suspend_service' | 'cancel_subscription' = 'email_reminder'
        let gracePeriodDays = 0
        
        if (attemptCount <= 3) {
          action = 'email_reminder'
          gracePeriodDays = 3
        } else if (attemptCount <= 7) {
          action = 'suspend_service'
          gracePeriodDays = 1
        } else {
          action = 'cancel_subscription'
        }
        
        // Update database to track dunning state
        await ctx.db.user.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: action === 'cancel_subscription' ? 'cancelled' : 'past_due',
          }
        })
        
        // Send appropriate notification
        const user = await ctx.db.user.findFirst({
          where: { stripeCustomerId: customerId },
          select: { email: true, contactName: true }
        })
        
        if (user) {
          const { EmailService } = await import('../services/email-service')
          
          if (action === 'email_reminder') {
            await EmailService.sendTemplateEmail('payment_failed_reminder', user.email, {
              customerName: user.contactName,
              attemptCount,
              gracePeriodDays,
              updatePaymentUrl: `${process.env.NEXTAUTH_URL}/subscription/update-payment`,
            })
          } else if (action === 'suspend_service') {
            await EmailService.sendTemplateEmail('service_suspended', user.email, {
              customerName: user.contactName,
              suspensionDate: new Date(),
              updatePaymentUrl: `${process.env.NEXTAUTH_URL}/subscription/update-payment`,
            })
          } else {
            await EmailService.sendTemplateEmail('subscription_cancelled', user.email, {
              customerName: user.contactName,
              cancellationDate: new Date(),
              reactivateUrl: `${process.env.NEXTAUTH_URL}/subscription/reactivate`,
            })
          }
        }
        
        return {
          action,
          gracePeriodDays,
          nextAttemptDate: new Date(Date.now() + gracePeriodDays * 24 * 60 * 60 * 1000),
        }
      } catch (error) {
        console.error('Dunning management failed:', error)
        throw new Error('Failed to handle dunning process')
      }
    }),

  // Reactivate cancelled subscription
  reactivateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Create a new subscription with the same price
        const oldSubscription = await stripe.subscriptions.retrieve(input.subscriptionId, {
          expand: ['items.data.price'],
        })
        
        if (oldSubscription.status !== 'canceled') {
          throw new Error('Subscription is not cancelled')
        }
        
        const customer = oldSubscription.customer as string
        const priceId = oldSubscription.items.data[0].price.id
        
        // Create new subscription
        const newSubscription = await stripe.subscriptions.create({
          customer,
          items: [{ price: priceId }],
          default_payment_method: input.paymentMethodId,
          expand: ['latest_invoice.payment_intent'],
        })
        
        // Update user's subscription status in database
        await ctx.db.user.updateMany({
          where: { stripeCustomerId: customer },
          data: {
            subscriptionStatus: 'active',
          }
        })
        
        // Send reactivation confirmation email
        const user = await ctx.db.user.findFirst({
          where: { stripeCustomerId: customer },
          select: { email: true, contactName: true }
        })
        
        if (user) {
          const { EmailService } = await import('../services/email-service')
          
          await EmailService.sendTemplateEmail('subscription_reactivated', user.email, {
            customerName: user.contactName,
            reactivationDate: new Date(),
            nextBillingDate: new Date(newSubscription.current_period_end * 1000),
          })
        }
        
        return {
          subscriptionId: newSubscription.id,
          status: newSubscription.status,
          currentPeriodEnd: newSubscription.current_period_end,
        }
      } catch (error) {
        console.error('Subscription reactivation failed:', error)
        throw new Error('Failed to reactivate subscription')
      }
    }),

  // Update payment method for subscription
  updateSubscriptionPaymentMethod: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
        paymentMethodId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Update subscription's default payment method
        const subscription = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            default_payment_method: input.paymentMethodId,
          }
        )
        
        // Also update the customer's default payment method
        await stripe.customers.update(
          subscription.customer as string,
          {
            invoice_settings: {
              default_payment_method: input.paymentMethodId,
            },
          }
        )
        
        return {
          subscriptionId: subscription.id,
          updated: true,
        }
      } catch (error) {
        console.error('Payment method update failed:', error)
        throw new Error('Failed to update payment method')
      }
    }),

  // Handle payment method failure and update
  handlePaymentMethodFailure: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        failedPaymentMethodId: z.string(),
        failureReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Mark the payment method as failed
        await stripe.paymentMethods.detach(input.failedPaymentMethodId)
        
        // Get other valid payment methods for the customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: input.customerId,
          type: 'card',
        })
        
        const validPaymentMethods = paymentMethods.data.filter(
          pm => pm.id !== input.failedPaymentMethodId
        )
        
        // Update user in database
        const user = await ctx.db.user.findFirst({
          where: { stripeCustomerId: input.customerId },
          select: { email: true, contactName: true }
        })
        
        if (user) {
          const { EmailService } = await import('../services/email-service')
          
          // Send payment method failure notification
          await EmailService.sendTemplateEmail('payment_method_failed', user.email, {
            customerName: user.contactName,
            failureReason: input.failureReason,
            hasValidBackup: validPaymentMethods.length > 0,
            updatePaymentUrl: `${process.env.NEXTAUTH_URL}/subscription/payment-methods`,
          })
        }
        
        return {
          failedPaymentMethodRemoved: true,
          validPaymentMethodsCount: validPaymentMethods.length,
          hasBackupPaymentMethod: validPaymentMethods.length > 0,
        }
      } catch (error) {
        console.error('Payment method failure handling failed:', error)
        throw new Error('Failed to handle payment method failure')
      }
    }),

  // Smart retry payment with fallback methods
  smartRetryPayment: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        amount: z.number(),
        currency: z.string().default('usd'),
        description: z.string(),
        subscriptionId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Get all customer's payment methods
        const paymentMethods = await stripe.paymentMethods.list({
          customer: input.customerId,
          type: 'card',
        })
        
        if (paymentMethods.data.length === 0) {
          throw new Error('No valid payment methods available')
        }
        
        // Try each payment method in order
        let lastError: any = null
        
        for (const paymentMethod of paymentMethods.data) {
          try {
            const paymentIntent = await stripe.paymentIntents.create({
              amount: input.amount,
              currency: input.currency,
              customer: input.customerId,
              payment_method: paymentMethod.id,
              description: input.description,
              confirm: true,
              return_url: `${process.env.NEXTAUTH_URL}/subscription/payment-success`,
              metadata: {
                subscriptionId: input.subscriptionId || '',
              },
            })
            
            // If successful, return immediately
            if (paymentIntent.status === 'succeeded') {
              return {
                success: true,
                paymentIntentId: paymentIntent.id,
                paymentMethodUsed: paymentMethod.id,
                status: paymentIntent.status,
              }
            }
          } catch (error) {
            lastError = error
            console.log(`Payment method ${paymentMethod.id} failed:`, error)
            continue
          }
        }
        
        // All payment methods failed
        throw lastError || new Error('All payment methods failed')
      } catch (error) {
        console.error('Smart retry payment failed:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Payment failed',
        }
      }
    }),

  // Activate boost after successful payment
  activateBoost: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
        packageId: z.string(),
        packageDuration: z.number(),
        stripeSessionId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Calculate boost expiration date
        const boostExpiresAt = new Date()
        boostExpiresAt.setDate(boostExpiresAt.getDate() + input.packageDuration)

        // Update job record with boost information
        const updatedJob = await ctx.db.job.update({
          where: { id: input.jobId },
          data: {
            isBoosted: true,
            boostType: input.packageId,
            boostExpiresAt,
            boostPaymentId: input.stripeSessionId,
            boostActivatedAt: new Date(),
            updatedAt: new Date(),
          },
        })

        console.log('Boost activated:', {
          jobId: input.jobId,
          packageId: input.packageId,
          duration: input.packageDuration,
          expiresAt: boostExpiresAt,
          userId: ctx.user.id
        })

        // Send confirmation email
        try {
          const user = await ctx.db.user.findUnique({
            where: { id: ctx.user.id },
            select: { email: true, contactName: true }
          })
          
          if (user) {
            const { EmailService } = await import('../services/email-service')
            
            await EmailService.sendTemplateEmail('job_boost_confirmation', user.email, {
              jobTitle: updatedJob.title,
              boostType: input.packageId,
              amount: 2999, // Default amount - could be passed from frontend
              expiresAt: boostExpiresAt,
            })
          }
        } catch (error) {
          console.error('Failed to send boost confirmation email:', error)
        }

        return {
          success: true,
          jobId: updatedJob.id,
          packageId: input.packageId,
          expiresAt: boostExpiresAt,
          message: 'Boost activated successfully'
        }
      } catch (error) {
        console.error('Failed to activate boost:', error)
        throw new Error('Failed to activate boost')
      }
    }),
})