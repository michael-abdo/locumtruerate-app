'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Crown,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  Briefcase,
  BarChart3,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import { SubscriptionCard, subscriptionPlans, type SubscriptionTier } from './subscription-card'

interface CurrentSubscription {
  tier: SubscriptionTier
  status: 'active' | 'cancelled' | 'past_due' | 'trial'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialEnd?: Date
  usage: {
    jobPostings: number
    teamMembers: number
    boostCredits: number
    analyticsViews: number
  }
  limits: {
    jobPostings: number | 'unlimited'
    teamMembers: number | 'unlimited'
    boostCredits: number
    analyticsRetention: number
  }
}

interface UsageStats {
  totalJobs: number
  activeJobs: number
  totalApplications: number
  totalViews: number
  conversionRate: number
  avgTimeToHire: number
}

interface SubscriptionDashboardProps {
  subscription: CurrentSubscription
  usage: UsageStats
  onUpgrade: (tier: SubscriptionTier) => void
  onCancelSubscription: () => void
  onReactivateSubscription: () => void
  onManagePayment: () => void
  className?: string
}

// Mock data
const mockSubscription: CurrentSubscription = {
  tier: 'PROFESSIONAL',
  status: 'active',
  currentPeriodStart: new Date('2024-01-01'),
  currentPeriodEnd: new Date('2024-02-01'),
  cancelAtPeriodEnd: false,
  usage: {
    jobPostings: 8,
    teamMembers: 4,
    boostCredits: 3,
    analyticsViews: 1250
  },
  limits: {
    jobPostings: 25,
    teamMembers: 10,
    boostCredits: 10,
    analyticsRetention: 12
  }
}

const mockUsageStats: UsageStats = {
  totalJobs: 23,
  activeJobs: 8,
  totalApplications: 156,
  totalViews: 3420,
  conversionRate: 4.6,
  avgTimeToHire: 18
}

function UsageBar({ 
  label, 
  current, 
  limit, 
  color = 'blue' 
}: { 
  label: string
  current: number
  limit: number | 'unlimited'
  color?: 'blue' | 'green' | 'yellow' | 'red'
}) {
  const percentage = limit === 'unlimited' ? 0 : Math.min((current / limit) * 100, 100)
  const isNearLimit = percentage > 80
  const isOverLimit = percentage >= 100

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  const barColor = isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : colorClasses[color]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {current} {limit === 'unlimited' ? '' : `/ ${limit}`}
        </span>
      </div>
      {limit !== 'unlimited' && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', barColor)}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {limit === 'unlimited' && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Unlimited usage
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'positive',
  icon: Icon,
  format = 'number'
}: {
  title: string
  value: number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  format?: 'number' | 'percentage' | 'currency' | 'days'
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val}%`
      case 'currency':
        return `$${val.toLocaleString()}`
      case 'days':
        return `${val} days`
      default:
        return val.toLocaleString()
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        {change !== undefined && (
          <div className={cn(
            'text-sm font-medium',
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          )}>
            {changeType === 'positive' ? '+' : changeType === 'negative' ? '-' : ''}{Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {formatValue(value)}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </div>
    </div>
  )
}

export function SubscriptionDashboard({
  subscription = mockSubscription,
  usage = mockUsageStats,
  onUpgrade,
  onCancelSubscription,
  onReactivateSubscription,
  onManagePayment,
  className
}: SubscriptionDashboardProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const currentPlan = subscriptionPlans.find(p => p.tier === subscription.tier)
  const daysUntilRenewal = Math.ceil(
    (subscription.currentPeriodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const getStatusIcon = (status: CurrentSubscription['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'trial':
        return <Clock className="w-5 h-5 text-blue-500" />
      case 'past_due':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
    }
  }

  const getStatusColor = (status: CurrentSubscription['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'trial':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Current Plan Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentPlan && (
                <div className={cn(
                  'p-3 rounded-lg bg-gradient-to-r',
                  currentPlan.color
                )}>
                  <currentPlan.icon className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {currentPlan?.name || subscription.tier} Plan
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(subscription.status)}
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(subscription.status)
                  )}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={onManagePayment}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                Manage Payment
              </Button>
              
              {subscription.tier !== 'ENTERPRISE' && (
                <Button onClick={() => setShowUpgradeModal(true)}>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Billing Info */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Billing Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Period:</span>
                  <span className="font-medium">
                    {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Renewal:</span>
                  <span className="font-medium">
                    {subscription.cancelAtPeriodEnd ? 'Cancelled' : `${daysUntilRenewal} days`}
                  </span>
                </div>
                {currentPlan && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Monthly Cost:</span>
                    <span className="font-medium">${currentPlan.price.monthly}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Usage Overview */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Usage This Period
              </h3>
              <div className="space-y-3">
                <UsageBar
                  label="Job Postings"
                  current={subscription.usage.jobPostings}
                  limit={subscription.limits.jobPostings}
                  color="blue"
                />
                <UsageBar
                  label="Team Members"
                  current={subscription.usage.teamMembers}
                  limit={subscription.limits.teamMembers}
                  color="green"
                />
                <UsageBar
                  label="Boost Credits"
                  current={subscription.usage.boostCredits}
                  limit={subscription.limits.boostCredits}
                  color="yellow"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Boost a Job
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Jobs Posted"
            value={usage.totalJobs}
            change={12}
            changeType="positive"
            icon={Briefcase}
          />
          <StatCard
            title="Active Jobs"
            value={usage.activeJobs}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Applications"
            value={usage.totalApplications}
            change={23}
            changeType="positive"
            icon={Users}
          />
          <StatCard
            title="Total Views"
            value={usage.totalViews}
            change={15}
            changeType="positive"
            icon={BarChart3}
          />
          <StatCard
            title="Conversion Rate"
            value={usage.conversionRate}
            change={8}
            changeType="positive"
            icon={TrendingUp}
            format="percentage"
          />
          <StatCard
            title="Avg Time to Hire"
            value={usage.avgTimeToHire}
            change={-12}
            changeType="positive"
            icon={Clock}
            format="days"
          />
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="space-y-4">
        {subscription.status === 'past_due' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Payment Past Due
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Your payment is overdue. Please update your payment method to avoid service interruption.
                </p>
                <Button size="sm" className="mt-3" onClick={onManagePayment}>
                  Update Payment Method
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {subscription.cancelAtPeriodEnd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900 dark:text-red-100">
                  Subscription Cancellation Scheduled
                </h3>
                <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                  Your subscription will end on {subscription.currentPeriodEnd.toLocaleDateString()}. 
                  You'll lose access to premium features.
                </p>
                <Button size="sm" className="mt-3" onClick={onReactivateSubscription}>
                  Reactivate Subscription
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {subscription.usage.jobPostings / (subscription.limits.jobPostings as number) > 0.8 && 
         subscription.limits.jobPostings !== 'unlimited' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Approaching Job Posting Limit
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  You've used {subscription.usage.jobPostings} of {subscription.limits.jobPostings} job postings. 
                  Consider upgrading for unlimited postings.
                </p>
                <Button size="sm" className="mt-3" onClick={() => setShowUpgradeModal(true)}>
                  Upgrade Plan
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Subscription Management */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Subscription Management
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Current Plan Features
            </h4>
            {currentPlan && (
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {currentPlan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Manage Subscription
            </h4>
            <div className="space-y-2">
              <Button variant="outline" onClick={onManagePayment} className="w-full justify-start">
                <CreditCard className="w-4 h-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Change Billing Cycle
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                Subscription Settings
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button 
                  variant="outline" 
                  onClick={onCancelSubscription}
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Upgrade Your Plan
                </h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {subscriptionPlans
                  .filter(plan => plan.tier !== 'FREE')
                  .map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      currentPlan={subscription.tier}
                      billingPeriod="monthly"
                      onSelect={(planId) => {
                        onUpgrade(plan.tier)
                        setShowUpgradeModal(false)
                      }}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionDashboard