'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, TrendingUp, Users, Eye, MousePointer, 
  Clock, ArrowUp, ArrowDown, Calendar, Download,
  Activity, Zap, Target, Globe
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@locumtruerate/ui'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
// import { trpc } from '@/providers/trpc-provider' // Temporarily disabled until analytics router is enabled

type DateRange = '24h' | '7d' | '30d' | '90d'

export default function AdminAnalyticsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'behavior' | 'performance' | 'conversion'>('overview')

  // Calculate date range
  const getDateRange = (range: DateRange) => {
    const end = new Date()
    const start = new Date()
    
    switch (range) {
      case '24h':
        start.setHours(start.getHours() - 24)
        break
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
    }
    
    return { startDate: start, endDate: end }
  }

  const { startDate, endDate } = getDateRange(dateRange)

  // Analytics queries - using mock data until analytics router is enabled
  const statsLoading = false;
  const dashboardStats = {
    pageViews: [],
    sessions: 0,
    users: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [],
    topReferrers: [],
    deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0 }
  };

  const realTimeStats = {
    activeUsers: 0,
    pageViewsLastHour: 0,
    currentPages: []
  };
  
  const performanceMetrics = {
    avgPageLoadTime: 0,
    serverResponseTime: 0,
    clientRenderTime: 0,
    apiLatency: 0
  };
  
  const conversionMetrics = {
    signupRate: 0,
    calculatorUsage: 0,
    jobApplicationRate: 0,
    leadCaptureRate: 0,
    visitorToRegistration: 0,
    registrationToCalculator: 0,
    calculatorToLead: 0
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatPercentage = (num: number) => `${num.toFixed(1)}%`

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-500" />
    return null
  }

  // Mock data for charts (would be replaced with actual chart components)
  const overviewStats = [
    {
      title: 'Total Page Views',
      value: dashboardStats?.pageViews.reduce((sum, pv) => sum + pv.count, 0) || 0,
      change: 12.5,
      icon: Eye,
      color: 'blue'
    },
    {
      title: 'Unique Sessions',
      value: dashboardStats?.sessions || 0,
      change: 8.2,
      icon: Users,
      color: 'green'
    },
    {
      title: 'Active Users',
      value: realTimeStats?.activeUsers || 0,
      change: -2.1,
      icon: Activity,
      color: 'yellow'
    },
    {
      title: 'Avg Load Time',
      value: performanceMetrics?.performanceMetrics?.[0]?.avgLoadTime || 0,
      change: -15.3,
      icon: Zap,
      color: 'purple',
      suffix: 'ms'
    }
  ]

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Analytics Dashboard
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Monitor user behavior, performance, and business metrics
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                  </select>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </div>

            {/* Real-time Stats Bar */}
            {realTimeStats && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Live: {realTimeStats.activeUsers} active users
                      </span>
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      {realTimeStats.pageViewsLastHour} page views in the last hour
                    </div>
                  </div>
                  <Badge variant="blue">Real-time</Badge>
                </div>
              </motion.div>
            )}

            {/* Navigation Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'behavior', label: 'User Behavior', icon: MousePointer },
                    { id: 'performance', label: 'Performance', icon: Zap },
                    { id: 'conversion', label: 'Conversion', icon: Target }
                  ].map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                        }`}
                      >
                        <Icon className={`mr-2 h-5 w-5 ${
                          activeTab === tab.id
                            ? 'text-blue-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`} />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {overviewStats.map((stat, index) => {
                    const Icon = stat.icon
                    return (
                      <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                      >
                        <Card>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {stat.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                  {formatNumber(stat.value)}{stat.suffix}
                                </p>
                                <div className="flex items-center mt-2">
                                  {getChangeIcon(stat.change)}
                                  <span className={`text-sm ml-1 ${
                                    stat.change > 0 
                                      ? 'text-green-600 dark:text-green-400' 
                                      : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {formatPercentage(Math.abs(stat.change))}
                                  </span>
                                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                    vs last period
                                  </span>
                                </div>
                              </div>
                              <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                                <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </motion.div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Page Views Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Page Views Over Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        Page views chart will be rendered here
                        <br />
                        Data points: {dashboardStats?.pageViews.length || 0}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Pages */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Pages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(dashboardStats?.topPages || []).slice(0, 5).map((page: any, index) => (
                          <div key={page?.page || index} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {page?.page || 'Unknown'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatNumber(page?.views || 0)} views
                            </span>
                          </div>
                        )) || (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            No page data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {false ? (
                      <div className="space-y-4">
                        {[].map((metric: any) => (
                          <div key={metric.page} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {metric.page}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {metric.sampleSize} samples
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                {metric.avgLoadTime}ms
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                P95: {metric.p95LoadTime}ms
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Conversion Tab */}
            {activeTab === 'conversion' && (
              <div className="space-y-6">
                {conversionMetrics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Visitor to Registration */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Visitor → Registration</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {formatPercentage(conversionMetrics.visitorToRegistration.rate)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {formatNumber(conversionMetrics.visitorToRegistration.registrations)} / {formatNumber(conversionMetrics.visitorToRegistration.visitors)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* View to Application */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">View → Application</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {formatPercentage(conversionMetrics.viewToApplication.rate)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {formatNumber(conversionMetrics.viewToApplication.applications)} / {formatNumber(conversionMetrics.viewToApplication.views)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Application to Hire */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Application → Hire</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                            {formatPercentage(conversionMetrics.applicationToHire.rate)}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            {formatNumber(conversionMetrics.applicationToHire.hires)} / {formatNumber(conversionMetrics.applicationToHire.applications)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Behavior Tab */}
            {activeTab === 'behavior' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent User Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {realTimeStats?.recentEvents.length ? (
                      <div className="space-y-3">
                        {realTimeStats.recentEvents.slice(0, 10).map((event) => (
                          <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {event.event}
                              </span>
                              {event.user && (
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  by {event.user.firstName} {event.user.lastName}
                                </span>
                              )}
                              {event.page && (
                                <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                                  on {event.page}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(event.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                        No recent activity
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}