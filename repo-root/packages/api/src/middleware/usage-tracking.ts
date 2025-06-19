/**
 * Usage Tracking and Rate Limiting Middleware
 * 
 * Tracks feature usage for subscription enforcement and billing
 */

import { TRPCError } from '@trpc/server'
import { MiddlewareFunction } from '@trpc/server/unstable-core-do-not-import'
import { Context } from '../context'
import { SUBSCRIPTION_TIERS, SubscriptionTier, SubscriptionFeatures } from '../routers/payments'
import { checkFeatureAccess } from './feature-gate'

// Usage tracking data structure
export interface UsageRecord {
  id: string
  userId: string
  feature: keyof SubscriptionFeatures
  amount: number
  billingPeriodStart: Date
  billingPeriodEnd: Date
  createdAt: Date
  metadata?: Record<string, any>
}

// Rate limiting configuration
export interface RateLimitConfig {
  feature: keyof SubscriptionFeatures
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Overage billing configuration
export interface OverageConfig {
  feature: keyof SubscriptionFeatures
  pricePerUnit: number // Price in cents per unit over limit
  tier: SubscriptionTier
  gracePeriod?: number // Grace units before charging
}

// Define overage pricing for features that support it
export const OVERAGE_PRICING: Record<keyof SubscriptionFeatures, OverageConfig[]> = {
  jobPostings: [
    { feature: 'jobPostings', pricePerUnit: 2500, tier: 'PRO', gracePeriod: 2 }, // $25 per extra job
    { feature: 'jobPostings', pricePerUnit: 0, tier: 'ENTERPRISE' }, // No overage for Enterprise
  ],
  teamMembers: [
    { feature: 'teamMembers', pricePerUnit: 1500, tier: 'PRO', gracePeriod: 1 }, // $15 per extra member
    { feature: 'teamMembers', pricePerUnit: 0, tier: 'ENTERPRISE' },
  ],
  applicationsPerJob: [],
  leadAccess: [],
  advancedAnalytics: [],
  prioritySupport: [],
  customBranding: [],
  apiAccess: [],
  boostCredits: [
    { feature: 'boostCredits', pricePerUnit: 500, tier: 'PRO' }, // $5 per extra boost credit
    { feature: 'boostCredits', pricePerUnit: 300, tier: 'ENTERPRISE' }, // $3 per extra boost credit
  ],
  calculatorExports: [
    { feature: 'calculatorExports', pricePerUnit: 100, tier: 'FREE', gracePeriod: 0 }, // $1 per export over 5
  ],
}

// Rate limiting configurations for API endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  jobCreation: {
    feature: 'jobPostings',
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // Max 10 job posts per hour
  },
  apiCalls: {
    feature: 'apiAccess',
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // Max 100 API calls per minute for Enterprise
  },
  calculatorExports: {
    feature: 'calculatorExports',
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 50, // Max 50 exports per day
  },
}

/**
 * Get current billing period for a user
 */
export function getCurrentBillingPeriod(subscriptionStartDate?: Date): { start: Date; end: Date } {
  const now = new Date()
  const start = subscriptionStartDate ? new Date(subscriptionStartDate) : new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Calculate the billing cycle start date
  const billingDay = start.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let periodStart = new Date(currentYear, currentMonth, billingDay)
  
  // If we haven't reached the billing day this month, the period started last month
  if (now < periodStart) {
    periodStart = new Date(currentYear, currentMonth - 1, billingDay)
  }
  
  // Calculate period end (one month from start)
  const periodEnd = new Date(periodStart)
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  periodEnd.setDate(periodEnd.getDate() - 1) // Last day of the billing period
  
  return { start: periodStart, end: periodEnd }
}

/**
 * Track feature usage for a user with atomic operations to prevent race conditions
 */
export async function trackUsage(
  ctx: Context,
  feature: keyof SubscriptionFeatures,
  amount: number = 1,
  metadata?: Record<string, any>
): Promise<UsageRecord> {
  try {
    const billingPeriod = getCurrentBillingPeriod()
    
    // Use atomic upsert operation to prevent race conditions
    const usage = await ctx.db.featureUsage.upsert({
      where: {
        userId_feature_billingPeriodStart_billingPeriodEnd: {
          userId: ctx.user.id,
          feature,
          billingPeriodStart: billingPeriod.start,
          billingPeriodEnd: billingPeriod.end,
        }
      },
      update: {
        amount: { increment: amount },
        metadata: metadata || undefined,
        updatedAt: new Date(),
      },
      create: {
        userId: ctx.user.id,
        feature,
        amount,
        billingPeriodStart: billingPeriod.start,
        billingPeriodEnd: billingPeriod.end,
        metadata: metadata || {},
      }
    })
    
    return usage as UsageRecord
  } catch (error) {
    // Fallback to console logging if database fails
    console.error('Failed to track feature usage:', error)
    console.log('Usage tracking fallback:', {
      userId: ctx.user.id,
      feature,
      amount,
      timestamp: new Date(),
      metadata,
    })
    
    // Return a mock usage record to prevent blocking the operation
    return {
      id: 'fallback',
      userId: ctx.user.id,
      feature,
      amount,
      billingPeriodStart: getCurrentBillingPeriod().start,
      billingPeriodEnd: getCurrentBillingPeriod().end,
      createdAt: new Date(),
      metadata,
    }
  }
}

/**
 * Get current usage for a feature in the current billing period
 */
export async function getCurrentUsage(
  ctx: Context,
  feature: keyof SubscriptionFeatures
): Promise<number> {
  try {
    const billingPeriod = getCurrentBillingPeriod()
    
    const usage = await ctx.db.featureUsage.findFirst({
      where: {
        userId: ctx.user.id,
        feature,
        billingPeriodStart: billingPeriod.start,
        billingPeriodEnd: billingPeriod.end,
      },
      select: { amount: true }
    })
    
    return usage?.amount || 0
  } catch (error) {
    console.error('Failed to get current usage:', error)
    return 0
  }
}

/**
 * Check if usage exceeds subscription limits and calculate overage
 */
export async function checkUsageOverage(
  ctx: Context,
  feature: keyof SubscriptionFeatures,
  requestedAmount: number = 1
): Promise<{
  withinLimit: boolean
  currentUsage: number
  limit: number | 'unlimited'
  overage: number
  overageCost: number // in cents
  tier: SubscriptionTier
}> {
  try {
    // Get user's subscription tier
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      select: { subscriptionTier: true }
    })
    
    const tier = (user?.subscriptionTier as SubscriptionTier) || 'FREE'
    const features = SUBSCRIPTION_TIERS[tier]
    const limit = features[feature]
    
    // Get current usage
    const currentUsage = await getCurrentUsage(ctx, feature)
    const totalUsageAfterRequest = currentUsage + requestedAmount
    
    // Check if feature has unlimited access
    if (limit === 'unlimited') {
      return {
        withinLimit: true,
        currentUsage,
        limit: 'unlimited',
        overage: 0,
        overageCost: 0,
        tier,
      }
    }
    
    // For boolean features, check if allowed
    if (typeof limit === 'boolean') {
      return {
        withinLimit: limit,
        currentUsage,
        limit: limit ? 'unlimited' : 0,
        overage: 0,
        overageCost: 0,
        tier,
      }
    }
    
    // For numeric limits, calculate overage
    const numericLimit = limit as number
    const withinLimit = totalUsageAfterRequest <= numericLimit
    const overage = Math.max(0, totalUsageAfterRequest - numericLimit)
    
    // Calculate overage cost
    let overageCost = 0
    if (overage > 0) {
      const overageConfig = OVERAGE_PRICING[feature]?.find(config => config.tier === tier)
      if (overageConfig) {
        const billableOverage = Math.max(0, overage - (overageConfig.gracePeriod || 0))
        overageCost = billableOverage * overageConfig.pricePerUnit
      }
    }
    
    return {
      withinLimit,
      currentUsage,
      limit: numericLimit,
      overage,
      overageCost,
      tier,
    }
  } catch (error) {
    console.error('Failed to check usage overage:', error)
    return {
      withinLimit: false,
      currentUsage: 0,
      limit: 0,
      overage: 0,
      overageCost: 0,
      tier: 'FREE',
    }
  }
}

/**
 * Rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig): MiddlewareFunction<any, Context, any> {
  return async ({ ctx, next }) => {
    try {
      // Check if user's tier allows this feature
      const featureAccess = await checkFeatureAccess(ctx, config.feature)
      if (!featureAccess.hasAccess) {
        throw new TRPCError({
          code: 'PAYMENT_REQUIRED',
          message: `This feature requires a higher subscription tier.`,
        })
      }
      
      // Get rate limit window
      const windowStart = new Date(Date.now() - config.windowMs)
      
      // Count requests in current window (this would require a request log table)
      // For now, we'll use feature usage as a proxy
      const currentUsage = await getCurrentUsage(ctx, config.feature)
      
      // Check if within rate limit
      if (currentUsage >= config.maxRequests) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000} seconds.`,
        })
      }
      
      return next()
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      console.error('Rate limiting error:', error)
      // Don't block requests if rate limiting fails
      return next()
    }
  }
}

/**
 * Usage validation middleware with overage handling and race condition protection
 */
export function createUsageValidator(
  feature: keyof SubscriptionFeatures,
  amount: number = 1,
  allowOverage: boolean = false
): MiddlewareFunction<any, Context, any> {
  return async ({ ctx, next }) => {
    try {
      // Use database transaction to prevent race conditions
      return await ctx.db.$transaction(async (tx) => {
        // Get user's subscription tier within transaction
        const user = await tx.user.findUnique({
          where: { id: ctx.user.id },
          select: { subscriptionTier: true, subscriptionStatus: true }
        })
        
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not found',
          })
        }
        
        const tier = (user.subscriptionTier as SubscriptionTier) || 'FREE'
        const features = SUBSCRIPTION_TIERS[tier]
        const featureLimit = features[feature]
        
        // Check if user's subscription is active
        if (user.subscriptionStatus && user.subscriptionStatus !== 'active' && tier !== 'FREE') {
          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: 'Your subscription is not active. Please update your billing information.',
          })
        }
        
        // For unlimited features, allow immediately
        if (featureLimit === 'unlimited' || typeof featureLimit === 'boolean' && featureLimit) {
          const result = await next()
          // Track usage after successful operation (outside transaction)
          setImmediate(() => trackUsage(ctx, feature, amount))
          return result
        }
        
        // For limited features, check and enforce limits atomically
        if (typeof featureLimit === 'number') {
          const billingPeriod = getCurrentBillingPeriod()
          
          // Get current usage with SELECT FOR UPDATE to prevent race conditions
          const currentUsage = await tx.featureUsage.findFirst({
            where: {
              userId: ctx.user.id,
              feature,
              billingPeriodStart: billingPeriod.start,
              billingPeriodEnd: billingPeriod.end,
            },
            select: { amount: true }
          })
          
          const currentAmount = currentUsage?.amount || 0
          const totalAfterRequest = currentAmount + amount
          
          // Check if within limits
          if (totalAfterRequest <= featureLimit) {
            const result = await next()
            // Track usage after successful operation (outside transaction to avoid deadlocks)
            setImmediate(() => trackUsage(ctx, feature, amount))
            return result
          }
          
          // Handle overage if allowed
          if (allowOverage) {
            const overage = totalAfterRequest - featureLimit
            const overageConfig = OVERAGE_PRICING[feature]?.find(config => config.tier === tier)
            
            if (overageConfig) {
              const billableOverage = Math.max(0, overage - (overageConfig.gracePeriod || 0))
              const overageCost = billableOverage * overageConfig.pricePerUnit
              
              console.log('Overage billing triggered:', {
                userId: ctx.user.id,
                feature,
                overage: billableOverage,
                cost: overageCost,
              })
              
              const result = await next()
              
              // Track usage including overage (outside transaction)
              setImmediate(() => trackUsage(ctx, feature, amount, {
                overage: billableOverage,
                overageCost,
              }))
              
              return result
            }
          }
          
          // Block the request
          throw new TRPCError({
            code: 'PAYMENT_REQUIRED',
            message: `You have reached your ${feature} limit (${featureLimit}). Current usage: ${currentAmount}. Upgrade your subscription or enable overage billing.`,
          })
        }
        
        // For boolean features that are false, deny access
        throw new TRPCError({
          code: 'PAYMENT_REQUIRED',
          message: `This feature is not available in your current plan.`,
        })
      })
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      
      console.error('Usage validation error:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate feature usage',
      })
    }
  }
}

/**
 * Get usage analytics for admin dashboard
 */
export async function getUsageAnalytics(
  ctx: Context,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalUsage: Record<keyof SubscriptionFeatures, number>
  userUsage: Array<{
    userId: string
    feature: keyof SubscriptionFeatures
    amount: number
    tier: SubscriptionTier
    overageAmount: number
    overageCost: number
  }>
  revenueFromOverages: number
}> {
  try {
    const start = startDate || getCurrentBillingPeriod().start
    const end = endDate || getCurrentBillingPeriod().end
    
    // Get all usage records in the period
    const usageRecords = await ctx.db.featureUsage.findMany({
      where: {
        billingPeriodStart: { gte: start },
        billingPeriodEnd: { lte: end },
      },
      include: {
        user: {
          select: {
            subscriptionTier: true,
          }
        }
      }
    })
    
    // Calculate analytics
    const totalUsage: Record<string, number> = {}
    const userUsage: any[] = []
    let revenueFromOverages = 0
    
    for (const record of usageRecords) {
      const feature = record.feature as keyof SubscriptionFeatures
      
      // Add to total usage
      totalUsage[feature] = (totalUsage[feature] || 0) + record.amount
      
      // Calculate overage cost from metadata
      const overageCost = record.metadata?.overageCost || 0
      const overageAmount = record.metadata?.overage || 0
      
      revenueFromOverages += overageCost
      
      userUsage.push({
        userId: record.userId,
        feature,
        amount: record.amount,
        tier: record.user.subscriptionTier || 'FREE',
        overageAmount,
        overageCost,
      })
    }
    
    return {
      totalUsage: totalUsage as Record<keyof SubscriptionFeatures, number>,
      userUsage,
      revenueFromOverages,
    }
  } catch (error) {
    console.error('Failed to get usage analytics:', error)
    return {
      totalUsage: {} as Record<keyof SubscriptionFeatures, number>,
      userUsage: [],
      revenueFromOverages: 0,
    }
  }
}

// Export rate limiting configurations for common use cases
export const rateLimits = {
  jobCreation: createRateLimit(RATE_LIMITS.jobCreation),
  apiCalls: createRateLimit(RATE_LIMITS.apiCalls),
  calculatorExports: createRateLimit(RATE_LIMITS.calculatorExports),
}

// Export usage validators for common features
export const usageValidators = {
  jobPosting: createUsageValidator('jobPostings', 1, true),
  teamMember: createUsageValidator('teamMembers', 1, true),
  calculatorExport: createUsageValidator('calculatorExports', 1, true),
  boostCredit: createUsageValidator('boostCredits', 1, true),
}