'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { 
  SubscriptionDashboard,
  BillingHistory,
  PaymentMethodManager,
  SubscriptionCard,
  subscriptionPlans,
  type SubscriptionTier
} from '@/components/subscription'
import { Button } from '@locumtruerate/ui'
import { 
  Crown,
  CreditCard,
  Receipt,
  Settings,
  ArrowLeft,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SubscriptionView = 'dashboard' | 'plans' | 'billing' | 'payment-methods'

export default function SubscriptionPage() {
  const [currentView, setCurrentView] = useState<SubscriptionView>('dashboard')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  // Mock current subscription - in real app this would come from API/context
  const currentSubscription = {
    tier: 'PROFESSIONAL' as SubscriptionTier,
    status: 'active' as const,
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

  const mockUsageStats = {
    totalJobs: 23,
    activeJobs: 8,
    totalApplications: 156,
    totalViews: 3420,
    conversionRate: 4.6,
    avgTimeToHire: 18
  }

  const handlePlanSelection = (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    console.log('Selected plan:', planId, billingPeriod)
    // In real app, integrate with Stripe
  }

  const handleUpgrade = (tier: SubscriptionTier) => {
    console.log('Upgrading to:', tier)
    // In real app, integrate with Stripe
  }

  const handleCancelSubscription = () => {
    console.log('Cancelling subscription')
    // In real app, show confirmation modal and call API
  }

  const handleReactivateSubscription = () => {
    console.log('Reactivating subscription')
    // In real app, call API to reactivate
  }

  const handleManagePayment = () => {
    setCurrentView('payment-methods')
  }

  const renderNavigation = () => (
    <div className="mb-8">
      <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Settings },
          { id: 'plans', label: 'Plans & Pricing', icon: Crown },
          { id: 'billing', label: 'Billing History', icon: Receipt },
          { id: 'payment-methods', label: 'Payment Methods', icon: CreditCard }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id as SubscriptionView)}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2',
              currentView === id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )

  const renderBackButton = () => {
    if (currentView === 'dashboard') return null
    
    return (
      <button
        onClick={() => setCurrentView('dashboard')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Subscription Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your plan, billing, and payment methods
            </p>
          </div>

          {renderNavigation()}
          {renderBackButton()}

          {/* Content */}
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'dashboard' && (
              <SubscriptionDashboard
                subscription={currentSubscription}
                usage={mockUsageStats}
                onUpgrade={handleUpgrade}
                onCancelSubscription={handleCancelSubscription}
                onReactivateSubscription={handleReactivateSubscription}
                onManagePayment={handleManagePayment}
              />
            )}

            {currentView === 'plans' && (
              <div className="space-y-8">
                {/* Billing Period Toggle */}
                <div className="flex items-center justify-center">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center">
                      <button
                        onClick={() => setBillingPeriod('monthly')}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                          billingPeriod === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        )}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingPeriod('yearly')}
                        className={cn(
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors relative',
                          billingPeriod === 'yearly'
                            ? 'bg-blue-500 text-white'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        )}
                      >
                        Yearly
                        <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                          Save 20%
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPlans.map((plan) => (
                    <SubscriptionCard
                      key={plan.id}
                      plan={plan}
                      currentPlan={currentSubscription.tier}
                      billingPeriod={billingPeriod}
                      onSelect={handlePlanSelection}
                    />
                  ))}
                </div>

                {/* Feature Comparison */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Feature Comparison
                    </h2>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Feature
                          </th>
                          {subscriptionPlans.map((plan) => (
                            <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              {plan.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Job Postings
                          </td>
                          {subscriptionPlans.map((plan) => (
                            <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {plan.limits.jobPostings === 'unlimited' ? 'Unlimited' : plan.limits.jobPostings}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Team Members
                          </td>
                          {subscriptionPlans.map((plan) => (
                            <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {plan.limits.teamMembers === 'unlimited' ? 'Unlimited' : plan.limits.teamMembers}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Boost Credits/Month
                          </td>
                          {subscriptionPlans.map((plan) => (
                            <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {plan.limits.boostCredits === 0 ? 'None' : 
                               plan.limits.boostCredits >= 999 ? 'Unlimited' : 
                               plan.limits.boostCredits}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            Support Level
                          </td>
                          {subscriptionPlans.map((plan) => (
                            <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              {plan.limits.supportLevel === 'community' && '🌐 Community'}
                              {plan.limits.supportLevel === 'email' && '📧 Email'}
                              {plan.limits.supportLevel === 'priority' && '⚡ Priority'}
                              {plan.limits.supportLevel === 'dedicated' && '👤 Dedicated'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'billing' && (
              <BillingHistory
                onDownloadInvoice={(recordId) => console.log('Download invoice:', recordId)}
                onViewDetails={(recordId) => console.log('View details:', recordId)}
              />
            )}

            {currentView === 'payment-methods' && (
              <PaymentMethodManager
                onAddPaymentMethod={() => console.log('Add payment method')}
                onEditPaymentMethod={(methodId) => console.log('Edit payment method:', methodId)}
                onDeletePaymentMethod={(methodId) => console.log('Delete payment method:', methodId)}
                onSetDefault={(methodId) => console.log('Set default:', methodId)}
              />
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  )
}