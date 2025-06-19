/**
 * Feature Gating Middleware
 * 
 * Provides subscription-based feature validation for tRPC procedures
 */

import { TRPCError } from '@trpc/server'
import { MiddlewareFunction } from '@trpc/server/unstable-core-do-not-import'
import { Context } from '../context'
import { SUBSCRIPTION_TIERS, SubscriptionTier, SubscriptionFeatures } from '../routers/payments'

export interface FeatureGateOptions {
  feature: keyof SubscriptionFeatures
  requiredTier?: SubscriptionTier
  requiredAmount?: number
  errorMessage?: string
}

/**
 * Creates a middleware that validates subscription features
 */
export const createFeatureGate = (options: FeatureGateOptions): MiddlewareFunction<any, Context, any> => {
  return async ({ ctx, next }) => {
    try {
      // Get user's subscription tier
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.user.id },
        select: {
          subscriptionTier: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
        }
      })

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not found',
        })
      }

      const userTier = (user.subscriptionTier as SubscriptionTier) || 'FREE'
      const features = SUBSCRIPTION_TIERS[userTier]
      
      // Check if user's subscription is active
      if (user.subscriptionStatus && user.subscriptionStatus !== 'active' && userTier !== 'FREE') {
        throw new TRPCError({
          code: 'PAYMENT_REQUIRED',
          message: 'Your subscription is not active. Please update your billing information.',
        })
      }

      // Check required tier
      if (options.requiredTier) {
        const tierOrder = { FREE: 0, PRO: 1, ENTERPRISE: 2 }
        if (tierOrder[userTier] < tierOrder[options.requiredTier]) {
          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: options.errorMessage || `This feature requires a ${options.requiredTier} subscription.`,
          })
        }
      }

      // Check specific feature access
      const featureValue = features[options.feature]
      
      // Boolean features (simple access check)
      if (typeof featureValue === 'boolean') {
        if (!featureValue) {
          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: options.errorMessage || `This feature is not available in your current plan.`,
          })
        }
      }
      
      // Numeric features (check limits)
      else if (typeof featureValue === 'number' && options.requiredAmount) {
        if (options.requiredAmount > featureValue) {
          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: options.errorMessage || `You have reached your limit of ${featureValue} for this feature. Upgrade to access more.`,
          })
        }
      }

      // Add feature context to the request
      return next({
        ctx: {
          ...ctx,
          subscription: {
            tier: userTier,
            features,
            status: user.subscriptionStatus || 'active',
          }
        }
      })
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      console.error('Feature gate error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate subscription access',
      })
    }
  }
}

/**
 * Predefined feature gates for common use cases
 */
export const featureGates = {
  // Job posting limits
  jobPosting: createFeatureGate({
    feature: 'jobPostings',
    errorMessage: 'You have reached your job posting limit. Upgrade to post more jobs.',
  }),

  // Lead marketplace access
  leadAccess: createFeatureGate({
    feature: 'leadAccess',
    requiredTier: 'PRO',
    errorMessage: 'Lead marketplace access requires a Pro or Enterprise subscription.',
  }),

  // Advanced analytics
  advancedAnalytics: createFeatureGate({
    feature: 'advancedAnalytics',
    requiredTier: 'PRO',
    errorMessage: 'Advanced analytics require a Pro or Enterprise subscription.',
  }),

  // Priority support
  prioritySupport: createFeatureGate({
    feature: 'prioritySupport',
    requiredTier: 'PRO',
    errorMessage: 'Priority support requires a Pro or Enterprise subscription.',
  }),

  // Custom branding
  customBranding: createFeatureGate({
    feature: 'customBranding',
    requiredTier: 'ENTERPRISE',
    errorMessage: 'Custom branding requires an Enterprise subscription.',
  }),

  // API access
  apiAccess: createFeatureGate({
    feature: 'apiAccess',
    requiredTier: 'ENTERPRISE',
    errorMessage: 'API access requires an Enterprise subscription.',
  }),

  // Calculator exports
  calculatorExport: createFeatureGate({
    feature: 'calculatorExports',
    errorMessage: 'You have reached your calculator export limit. Upgrade for unlimited exports.',
  }),
}

/**
 * Helper function to check feature access without throwing errors
 */
export async function checkFeatureAccess(
  ctx: Context,
  feature: keyof SubscriptionFeatures,
  requiredAmount?: number
): Promise<{
  hasAccess: boolean
  tier: SubscriptionTier
  limit: number | 'unlimited'
  currentUsage?: number
  message?: string
}> {
  try {
    // Import usage tracking functions
    const { getCurrentUsage } = await import('./usage-tracking')
    
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { subscriptionTier: true }
    })

    const tier = (user?.subscriptionTier as SubscriptionTier) || 'FREE'
    const features = SUBSCRIPTION_TIERS[tier]
    const featureValue = features[feature]

    // Get current usage for the billing period
    const currentUsage = await getCurrentUsage(ctx, feature)

    // Boolean features
    if (typeof featureValue === 'boolean') {
      return {
        hasAccess: featureValue,
        tier,
        limit: featureValue ? 'unlimited' : 0,
        currentUsage,
        message: featureValue ? undefined : 'Feature not available in current plan',
      }
    }

    // Unlimited features
    if (featureValue === 'unlimited') {
      return {
        hasAccess: true,
        tier,
        limit: 'unlimited',
        currentUsage,
      }
    }

    // Numeric features - check current usage + requested amount
    const requestedAmount = requiredAmount || 1
    const totalAfterRequest = currentUsage + requestedAmount
    
    return {
      hasAccess: totalAfterRequest <= featureValue,
      tier,
      limit: featureValue,
      currentUsage,
      message: totalAfterRequest > featureValue ? `Limit exceeded (${featureValue} allowed, ${currentUsage} used)` : undefined,
    }
  } catch (error) {
    console.error('Feature access check failed:', error)
    return {
      hasAccess: false,
      tier: 'FREE',
      limit: 0,
      currentUsage: 0,
      message: 'Unable to verify feature access',
    }
  }
}

/**
 * Usage tracking for subscription features
 */
export async function trackFeatureUsage(
  ctx: Context,
  feature: keyof SubscriptionFeatures,
  amount: number = 1
): Promise<void> {
  try {
    // Import the usage tracking function
    const { trackUsage } = await import('./usage-tracking')
    
    // Track the actual usage with billing period enforcement
    await trackUsage(ctx, feature, amount)
  } catch (error) {
    console.error('Feature usage tracking failed:', error)
    // Don't throw - usage tracking failure shouldn't block the operation
  }
}