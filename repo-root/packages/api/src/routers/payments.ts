import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../trpc'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
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

  // Get subscription plans
  getSubscriptionPlans: publicProcedure
    .query(async () => {
      try {
        const prices = await stripe.prices.list({
          active: true,
          type: 'recurring',
          expand: ['data.product'],
        })

        const plans = prices.data.map((price) => ({
          id: price.id,
          productId: price.product as string,
          name: (price.product as Stripe.Product).name,
          description: (price.product as Stripe.Product).description,
          price: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          intervalCount: price.recurring?.interval_count,
          features: (price.product as Stripe.Product).metadata?.features
            ? JSON.parse((price.product as Stripe.Product).metadata.features)
            : [],
        }))

        return plans
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error)
        throw new Error('Failed to fetch subscription plans')
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

  // Reactivate subscription
  reactivateSubscription: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const subscription = await stripe.subscriptions.update(
          input.subscriptionId,
          {
            cancel_at_period_end: false,
          }
        )

        return {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        }
      } catch (error) {
        console.error('Failed to reactivate subscription:', error)
        throw new Error('Failed to reactivate subscription')
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