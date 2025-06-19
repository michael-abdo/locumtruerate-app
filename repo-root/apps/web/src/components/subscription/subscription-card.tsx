'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Crown, Building2, Sparkles } from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'

export type SubscriptionTier = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

interface SubscriptionPlan {
  id: string
  tier: SubscriptionTier
  name: string
  description: string
  price: {
    monthly: number
    yearly: number
  }
  features: string[]
  limits: {
    jobPostings: number | 'unlimited'
    teamMembers: number | 'unlimited'
    applicationsPerJob: number | 'unlimited'
    boostCredits: number
    analyticsRetention: number // in months
    supportLevel: 'community' | 'email' | 'priority' | 'dedicated'
  }
  popular?: boolean
  badge?: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  stripePriceId?: {
    monthly: string
    yearly: string
  }
}

const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    tier: 'FREE',
    name: 'Free',
    description: 'Perfect for trying out the platform',
    price: { monthly: 0, yearly: 0 },
    features: [
      '1 active job posting',
      'Basic applicant management',
      'Email notifications',
      'Community support'
    ],
    limits: {
      jobPostings: 1,
      teamMembers: 1,
      applicationsPerJob: 50,
      boostCredits: 0,
      analyticsRetention: 1,
      supportLevel: 'community'
    },
    color: 'from-gray-500 to-gray-600',
    icon: Building2
  },
  {
    id: 'basic',
    tier: 'BASIC',
    name: 'Basic',
    description: 'Great for small businesses and startups',
    price: { monthly: 29, yearly: 290 },
    features: [
      '5 active job postings',
      'Advanced applicant tracking',
      'Email & SMS notifications',
      'Basic analytics dashboard',
      'Email support',
      '2 boost credits/month'
    ],
    limits: {
      jobPostings: 5,
      teamMembers: 3,
      applicationsPerJob: 200,
      boostCredits: 2,
      analyticsRetention: 6,
      supportLevel: 'email'
    },
    color: 'from-blue-500 to-blue-600',
    icon: Zap
  },
  {
    id: 'professional',
    tier: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Best for growing companies',
    price: { monthly: 99, yearly: 990 },
    features: [
      '25 active job postings',
      'Advanced analytics & reporting',
      'Team collaboration tools',
      'Custom branding',
      'Priority support',
      '10 boost credits/month',
      'API access',
      'Advanced integrations'
    ],
    limits: {
      jobPostings: 25,
      teamMembers: 10,
      applicationsPerJob: 500,
      boostCredits: 10,
      analyticsRetention: 12,
      supportLevel: 'priority'
    },
    popular: true,
    badge: 'Most Popular',
    color: 'from-purple-500 to-purple-600',
    icon: Crown,
    stripePriceId: {
      monthly: 'price_professional_monthly',
      yearly: 'price_professional_yearly'
    }
  },
  {
    id: 'enterprise',
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large organizations with custom needs',
    price: { monthly: 299, yearly: 2990 },
    features: [
      'Unlimited job postings',
      'Unlimited team members',
      'Advanced security & compliance',
      'Custom integrations',
      'Dedicated account manager',
      'Unlimited boost credits',
      'White-label options',
      'Custom SLA'
    ],
    limits: {
      jobPostings: 'unlimited',
      teamMembers: 'unlimited',
      applicationsPerJob: 'unlimited',
      boostCredits: 999,
      analyticsRetention: 24,
      supportLevel: 'dedicated'
    },
    badge: 'Enterprise',
    color: 'from-orange-500 to-red-500',
    icon: Sparkles,
    stripePriceId: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly'
    }
  }
]

interface SubscriptionCardProps {
  plan: SubscriptionPlan
  currentPlan?: SubscriptionTier
  billingPeriod: 'monthly' | 'yearly'
  onSelect: (planId: string, billingPeriod: 'monthly' | 'yearly') => void
  loading?: boolean
  className?: string
}

export function SubscriptionCard({
  plan,
  currentPlan,
  billingPeriod,
  onSelect,
  loading = false,
  className
}: SubscriptionCardProps) {
  const Icon = plan.icon
  const isCurrentPlan = currentPlan === plan.tier
  const price = plan.price[billingPeriod]
  const yearlyDiscount = billingPeriod === 'yearly' ? 
    Math.round((1 - plan.price.yearly / (plan.price.monthly * 12)) * 100) : 0

  const formatLimit = (limit: number | 'unlimited'): string => {
    if (limit === 'unlimited') return 'Unlimited'
    if (typeof limit === 'number' && limit >= 999) return 'Unlimited'
    return limit.toString()
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200',
        plan.popular 
          ? 'border-purple-500 shadow-lg shadow-purple-500/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
        isCurrentPlan && 'ring-2 ring-blue-500 ring-offset-2',
        className
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className={cn(
            'px-4 py-1 rounded-full text-white text-sm font-semibold',
            'bg-gradient-to-r', plan.color
          )}>
            {plan.badge}
          </div>
        </div>
      )}

      {/* Enterprise Badge */}
      {plan.tier === 'ENTERPRISE' && !plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className={cn(
            'px-4 py-1 rounded-full text-white text-sm font-semibold',
            'bg-gradient-to-r', plan.color
          )}>
            {plan.badge}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className={cn(
            'inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4',
            'bg-gradient-to-r', plan.color
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {plan.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="text-center mb-6">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              ${price}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              /{billingPeriod === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
          
          {billingPeriod === 'yearly' && yearlyDiscount > 0 && (
            <div className="mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                Save {yearlyDiscount}%
              </span>
            </div>
          )}
          
          {plan.tier === 'FREE' && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Forever free
            </p>
          )}
        </div>

        {/* Key Limits */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatLimit(plan.limits.jobPostings)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Job postings</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatLimit(plan.limits.teamMembers)}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Team members</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {plan.limits.boostCredits === 0 ? 'None' : 
                 plan.limits.boostCredits >= 999 ? 'Unlimited' : 
                 `${plan.limits.boostCredits}/mo`}
              </div>
              <div className="text-gray-600 dark:text-gray-400">Boost credits</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                {plan.limits.analyticsRetention}mo
              </div>
              <div className="text-gray-600 dark:text-gray-400">Analytics</div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-6">
          <div className="space-y-3">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <Button
          onClick={() => onSelect(plan.id, billingPeriod)}
          disabled={loading || isCurrentPlan}
          className={cn(
            'w-full',
            plan.popular && 'bg-purple-600 hover:bg-purple-700',
            isCurrentPlan && 'bg-gray-400 cursor-not-allowed'
          )}
          variant={plan.popular ? 'default' : 'outline'}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : plan.tier === 'FREE' ? (
            'Get Started Free'
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </Button>

        {/* Support Level */}
        <div className="mt-4 text-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {plan.limits.supportLevel === 'community' && '🌐 Community support'}
            {plan.limits.supportLevel === 'email' && '📧 Email support'}
            {plan.limits.supportLevel === 'priority' && '⚡ Priority support'}
            {plan.limits.supportLevel === 'dedicated' && '👤 Dedicated account manager'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Export the plans for use in other components
export { subscriptionPlans }
export type { SubscriptionPlan }
export default SubscriptionCard