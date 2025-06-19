'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Users, 
  Clock, 
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Crown,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import { BoostedJobBadge, type BoostType } from './boosted-job-badge'

// Mock data interfaces
interface BoostAnalytics {
  id: string
  jobId: string
  jobTitle: string
  boostType: BoostType
  startDate: Date
  endDate: Date
  status: 'active' | 'completed' | 'paused'
  metrics: {
    totalViews: number
    viewsIncrease: number
    applications: number
    applicationsIncrease: number
    costPerApplication: number
    roi: number
    clickThroughRate: number
    conversionRate: number
  }
  dailyStats: Array<{
    date: Date
    views: number
    applications: number
    clicks: number
  }>
}

interface BoostAnalyticsDashboardProps {
  boosts: BoostAnalytics[]
  className?: string
  onRefresh?: () => void
  onExport?: () => void
}

// Mock data generator
const generateMockBoosts = (): BoostAnalytics[] => {
  const boostTypes: BoostType[] = ['featured', 'urgent', 'premium', 'sponsored']
  
  return Array.from({ length: 6 }, (_, i) => ({
    id: `boost-${i + 1}`,
    jobId: `job-${i + 1}`,
    jobTitle: [
      'Senior React Developer',
      'Emergency Medicine Physician',
      'Product Manager',
      'UX/UI Designer',
      'Data Scientist',
      'DevOps Engineer'
    ][i],
    boostType: boostTypes[i % boostTypes.length],
    startDate: new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + (7 - i) * 24 * 60 * 60 * 1000),
    status: i < 3 ? 'active' : 'completed' as const,
    metrics: {
      totalViews: Math.floor(Math.random() * 1000) + 500,
      viewsIncrease: Math.floor(Math.random() * 300) + 150,
      applications: Math.floor(Math.random() * 50) + 20,
      applicationsIncrease: Math.floor(Math.random() * 20) + 10,
      costPerApplication: Math.floor(Math.random() * 10) + 5,
      roi: Math.floor(Math.random() * 200) + 120,
      clickThroughRate: parseFloat((Math.random() * 5 + 2).toFixed(1)),
      conversionRate: parseFloat((Math.random() * 10 + 5).toFixed(1))
    },
    dailyStats: Array.from({ length: 7 }, (_, day) => ({
      date: new Date(Date.now() - (6 - day) * 24 * 60 * 60 * 1000),
      views: Math.floor(Math.random() * 100) + 50,
      applications: Math.floor(Math.random() * 10) + 2,
      clicks: Math.floor(Math.random() * 50) + 20
    }))
  }))
}

export function BoostAnalyticsDashboard({ 
  boosts = generateMockBoosts(), 
  className,
  onRefresh,
  onExport
}: BoostAnalyticsDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedBoostType, setSelectedBoostType] = useState<BoostType | 'all'>('all')

  // Calculate aggregated metrics
  const aggregatedMetrics = useMemo(() => {
    const filtered = boosts.filter(boost => 
      selectedBoostType === 'all' || boost.boostType === selectedBoostType
    )

    return {
      totalSpent: filtered.reduce((sum, boost) => sum + (boost.metrics.applications * boost.metrics.costPerApplication), 0),
      totalViews: filtered.reduce((sum, boost) => sum + boost.metrics.totalViews, 0),
      totalApplications: filtered.reduce((sum, boost) => sum + boost.metrics.applications, 0),
      averageRoi: filtered.reduce((sum, boost) => sum + boost.metrics.roi, 0) / filtered.length || 0,
      averageCostPerApp: filtered.reduce((sum, boost) => sum + boost.metrics.costPerApplication, 0) / filtered.length || 0,
      averageConversion: filtered.reduce((sum, boost) => sum + boost.metrics.conversionRate, 0) / filtered.length || 0
    }
  }, [boosts, selectedBoostType])

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType = 'positive',
    icon: Icon, 
    format = 'number' 
  }: {
    title: string
    value: number
    change: number
    changeType?: 'positive' | 'negative' | 'neutral'
    icon: React.ComponentType<{ className?: string }>
    format?: 'number' | 'currency' | 'percentage'
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `$${val.toLocaleString()}`
        case 'percentage':
          return `${val.toFixed(1)}%`
        default:
          return val.toLocaleString()
      }
    }

    const changeColor = changeType === 'positive' ? 'text-green-600' : 
                      changeType === 'negative' ? 'text-red-600' : 'text-gray-600'

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className={cn('flex items-center gap-1 text-sm', changeColor)}>
            {changeType === 'positive' ? (
              <TrendingUp className="w-4 h-4" />
            ) : changeType === 'negative' ? (
              <TrendingDown className="w-4 h-4" />
            ) : (
              <Activity className="w-4 h-4" />
            )}
            {Math.abs(change)}%
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {formatValue(value)}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {title}
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Boost Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track the performance of your boosted job listings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filters */}
          <select
            value={selectedBoostType}
            onChange={(e) => setSelectedBoostType(e.target.value as BoostType | 'all')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="all">All Boosts</option>
            <option value="featured">Featured</option>
            <option value="urgent">Urgent</option>
            <option value="premium">Premium</option>
            <option value="sponsored">Sponsored</option>
          </select>
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Spent"
          value={aggregatedMetrics.totalSpent}
          change={12.5}
          changeType="neutral"
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Total Views"
          value={aggregatedMetrics.totalViews}
          change={156.3}
          changeType="positive"
          icon={Eye}
        />
        <StatCard
          title="Applications"
          value={aggregatedMetrics.totalApplications}
          change={89.2}
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Avg ROI"
          value={aggregatedMetrics.averageRoi}
          change={23.1}
          changeType="positive"
          icon={TrendingUp}
          format="percentage"
        />
        <StatCard
          title="Cost per App"
          value={aggregatedMetrics.averageCostPerApp}
          change={-15.4}
          changeType="positive"
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Conversion Rate"
          value={aggregatedMetrics.averageConversion}
          change={8.7}
          changeType="positive"
          icon={Activity}
          format="percentage"
        />
      </div>

      {/* Active Boosts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Active & Recent Boosts
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {boosts.filter(b => b.status === 'active').length} active
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {boosts.slice(0, 5).map((boost, index) => (
              <motion.div
                key={boost.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <BoostedJobBadge type={boost.boostType} size="sm" />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {boost.jobTitle}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {boost.startDate.toLocaleDateString()} - {boost.endDate.toLocaleDateString()}
                      </span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        boost.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      )}>
                        {boost.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {boost.metrics.totalViews.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Views</div>
                    <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{boost.metrics.viewsIncrease}
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {boost.metrics.applications}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Apps</div>
                    <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{boost.metrics.applicationsIncrease}
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${boost.metrics.costPerApplication}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Cost/App</div>
                    <div className="text-xs text-blue-600">
                      {boost.metrics.clickThroughRate}% CTR
                    </div>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {boost.metrics.roi}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">ROI</div>
                    <div className="text-xs text-purple-600">
                      {boost.metrics.conversionRate}% Conv
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {boosts.length > 5 && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                View All {boosts.length} Boosts
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Trends
          </h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Views
            </Button>
            <Button variant="outline" size="sm">
              <PieChart className="w-4 h-4 mr-2" />
              Applications
            </Button>
          </div>
        </div>
        
        {/* Chart placeholder */}
        <div className="h-64 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              Interactive charts will be displayed here
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Integration with charting library required
            </p>
          </div>
        </div>
      </div>

      {/* Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance Insights
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Strong Performance
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Your Premium boosts are generating 4.2x more applications than average
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Optimization Tip
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Consider boosting on Mondays and Tuesdays for 35% higher engagement
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Star className="w-4 h-4 mr-2" />
              Boost Another Job
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Full Report
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Recurring Boost
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BoostAnalyticsDashboard