'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@locumtruerate/ui'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@locumtruerate/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { z } from 'zod'

// Validation schema for time range selection
const timeRangeSchema = z.enum(['7d', '30d', '90d', '1y'])

// Mock data for demonstration - would come from tRPC in real implementation
const mockBillingData = {
  overview: {
    monthlyRecurringRevenue: 45750,
    totalActiveSubscriptions: 287,
    conversionRate: 3.2,
    churnRate: 2.1,
    averageRevenuePerUser: 159.38,
    customerLifetimeValue: 2547,
  },
  tierDistribution: {
    FREE: { count: 1847, percentage: 78.2, revenue: 0 },
    PRO: { count: 287, percentage: 12.1, revenue: 85813, avgRevenue: 299 },
    ENTERPRISE: { count: 95, percentage: 4.0, revenue: 66405, avgRevenue: 699 },
  },
  recentPayments: [
    {
      id: 'pay_1234',
      customer: 'Acme Healthcare',
      amount: 69900,
      status: 'succeeded',
      tier: 'ENTERPRISE',
      date: '2024-01-15T10:30:00Z',
      method: 'card',
    },
    {
      id: 'pay_1235',
      customer: 'Regional Medical Group',
      amount: 29900,
      status: 'succeeded',
      tier: 'PRO',
      date: '2024-01-15T09:15:00Z',
      method: 'card',
    },
    {
      id: 'pay_1236',
      customer: 'City Hospital Network',
      amount: 29900,
      status: 'failed',
      tier: 'PRO',
      date: '2024-01-15T08:45:00Z',
      method: 'card',
      error: 'Your card was declined.',
    },
  ],
  monthlyTrends: [
    { month: 'Jul', revenue: 32400, subscribers: 215 },
    { month: 'Aug', revenue: 35200, subscribers: 234 },
    { month: 'Sep', revenue: 38100, subscribers: 251 },
    { month: 'Oct', revenue: 41300, subscribers: 268 },
    { month: 'Nov', revenue: 43800, subscribers: 275 },
    { month: 'Dec', revenue: 45750, subscribers: 287 },
  ],
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon: React.ComponentType<{ className?: string }>
  description?: string
  format?: 'currency' | 'percentage' | 'number'
}

function StatCard({ title, value, change, icon: Icon, description, format = 'number' }: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency' && typeof val === 'number') {
      return formatCurrency(val)
    }
    if (format === 'percentage' && typeof val === 'number') {
      return formatPercentage(val)
    }
    return val.toString()
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatValue(value)}
            </p>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        
        {change && (
          <div className="mt-4 flex items-center gap-2">
            {change.type === 'increase' ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              'text-sm font-medium',
              change.type === 'increase' ? 'text-green-600' : 'text-red-600'
            )}>
              {change.value > 0 ? '+' : ''}{change.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TierDistributionChart() {
  const { tierDistribution } = mockBillingData
  const totalRevenue = Object.values(tierDistribution).reduce((sum, tier) => sum + tier.revenue, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Subscription Tier Distribution
        </CardTitle>
        <CardDescription>
          Revenue and subscriber distribution across tiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(tierDistribution).map(([tier, data]) => (
            <div key={tier} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  tier === 'FREE' && 'bg-gray-400',
                  tier === 'PRO' && 'bg-purple-500',
                  tier === 'ENTERPRISE' && 'bg-orange-500'
                )} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tier}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.count} subscribers ({formatPercentage(data.percentage)})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(data.revenue)}
                </p>
                {data.revenue > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatPercentage((data.revenue / totalRevenue) * 100)} of total
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentPaymentsTable() {
  const { recentPayments } = mockBillingData

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Payments
        </CardTitle>
        <CardDescription>
          Latest payment transactions and their status
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentPayments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {payment.customer}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(payment.date).toLocaleDateString()} • {payment.tier}
                    </p>
                    {payment.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        {payment.error}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </p>
                </div>
                <Badge
                  variant={payment.status === 'succeeded' ? 'default' : 'destructive'}
                  className={cn(
                    payment.status === 'succeeded' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  )}
                >
                  {payment.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueChart() {
  const { monthlyTrends } = mockBillingData
  const maxRevenue = Math.max(...monthlyTrends.map(d => d.revenue))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Monthly Recurring Revenue Trend
        </CardTitle>
        <CardDescription>
          Revenue growth over the last 6 months
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {monthlyTrends.map((data, index) => (
            <div key={data.month} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-gray-600 dark:text-gray-400">
                {data.month}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(data.revenue)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.subscribers} subscribers
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <motion.div
                    className="bg-blue-600 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function BillingDashboard() {
  const [timeRange, setTimeRange] = useState<z.infer<typeof timeRangeSchema>>('30d')
  const { overview } = mockBillingData

  const handleTimeRangeChange = (value: string) => {
    try {
      const validated = timeRangeSchema.parse(value)
      setTimeRange(validated)
    } catch (error) {
      console.error('Invalid time range:', value)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Billing Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor subscription revenue, customer metrics, and payment analytics
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            aria-label="Select time range for billing data"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard
          title="Monthly Recurring Revenue"
          value={overview.monthlyRecurringRevenue}
          format="currency"
          icon={DollarSign}
          change={{ value: 12.5, type: 'increase' }}
          description="Total MRR from active subscriptions"
        />
        
        <StatCard
          title="Active Subscriptions"
          value={overview.totalActiveSubscriptions}
          icon={Users}
          change={{ value: 8.2, type: 'increase' }}
          description="Paying subscribers"
        />
        
        <StatCard
          title="Conversion Rate"
          value={overview.conversionRate}
          format="percentage"
          icon={TrendingUp}
          change={{ value: 0.8, type: 'increase' }}
          description="Free to paid conversion"
        />
        
        <StatCard
          title="Monthly Churn Rate"
          value={overview.churnRate}
          format="percentage"
          icon={AlertTriangle}
          change={{ value: -0.3, type: 'increase' }}
          description="Subscription cancellations"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Average Revenue Per User"
          value={overview.averageRevenuePerUser}
          format="currency"
          icon={BarChart3}
          description="Monthly average per paying customer"
        />
        
        <StatCard
          title="Customer Lifetime Value"
          value={overview.customerLifetimeValue}
          format="currency"
          icon={TrendingUp}
          description="Predicted total customer value"
        />
      </div>

      {/* Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart />
            <TierDistributionChart />
          </div>
          
          <RecentPaymentsTable />
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TierDistributionChart />
            <Card>
              <CardHeader>
                <CardTitle>Subscription Health</CardTitle>
                <CardDescription>
                  Key metrics for subscription performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Trial to Paid Conversion</span>
                  <span className="font-semibold">{formatPercentage(overview.conversionRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Churn Rate</span>
                  <span className="font-semibold text-red-600">{formatPercentage(overview.churnRate)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Average Revenue Per User</span>
                  <span className="font-semibold">{formatCurrency(overview.averageRevenuePerUser * 100)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Customer Lifetime Value</span>
                  <span className="font-semibold">{formatCurrency(overview.customerLifetimeValue * 100)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <RecentPaymentsTable />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Distribution of payment methods used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Credit Card</span>
                    <span className="font-semibold">89.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Bank Transfer</span>
                    <span className="font-semibold">7.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">PayPal</span>
                    <span className="font-semibold">3.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Failed Payments</CardTitle>
                <CardDescription>
                  Payment failure analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Total Failed This Month</span>
                    <span className="font-semibold text-red-600">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Recovery Rate</span>
                    <span className="font-semibold">75%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">Lost Revenue</span>
                    <span className="font-semibold text-red-600">{formatCurrency(358500)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <RevenueChart />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>
                  Key performance indicators for business growth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Growth Rate</span>
                  <span className="font-semibold text-green-600">+12.5%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Net Revenue Retention</span>
                  <span className="font-semibold">108%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Quick Ratio</span>
                  <span className="font-semibold">4.2</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cohort Analysis</CardTitle>
                <CardDescription>
                  Customer retention by signup month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Cohort analysis chart would be displayed here
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Showing customer retention rates by signup period
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}