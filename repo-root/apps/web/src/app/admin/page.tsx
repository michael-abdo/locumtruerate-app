'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Users, Briefcase, Building, FileText, Shield, 
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  DollarSign, Activity, BarChart3, Settings
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@locumtruerate/ui'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
// import { trpc } from '@/providers/trpc-provider' // Temporarily disabled

const stats = [
  {
    title: 'Total Users',
    value: '12,483',
    change: '+12.5%',
    icon: Users,
    color: 'blue',
    href: '/admin/users'
  },
  {
    title: 'Active Jobs',
    value: '3,247',
    change: '+8.2%',
    icon: Briefcase,
    color: 'green',
    href: '/admin/jobs'
  },
  {
    title: 'Pending Reviews',
    value: '89',
    change: '-15.3%',
    icon: AlertTriangle,
    color: 'yellow',
    href: '/admin/moderation'
  },
  {
    title: 'Revenue MTD',
    value: '$847.5K',
    change: '+23.1%',
    icon: DollarSign,
    color: 'purple',
    href: '/admin/analytics'
  }
]

const recentActivity = [
  {
    id: '1',
    type: 'job_posted',
    title: 'New job posted',
    description: 'Emergency Medicine position in Dallas, TX',
    user: 'Metro General Hospital',
    time: '5 minutes ago',
    status: 'pending'
  },
  {
    id: '2',
    type: 'user_registered',
    title: 'New user registered',
    description: 'Dr. Sarah Johnson joined as Physician',
    user: 'sarah.johnson@example.com',
    time: '12 minutes ago',
    status: 'active'
  },
  {
    id: '3',
    type: 'application_flagged',
    title: 'Application flagged',
    description: 'Suspicious activity detected on application #4821',
    user: 'System',
    time: '1 hour ago',
    status: 'warning'
  },
  {
    id: '4',
    type: 'payment_received',
    title: 'Payment received',
    description: 'Premium listing payment from Regional Medical',
    user: 'Regional Medical Center',
    time: '2 hours ago',
    status: 'success'
  }
]

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Mock data until routers are enabled
  const analyticsData = {
    totalUsers: 0,
    totalJobs: 0,
    totalApplications: 0,
    revenue: 0
  }
  const pendingJobs = []
  const flaggedUsers = []

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'job_posted':
        return Briefcase
      case 'user_registered':
        return Users
      case 'application_flagged':
        return AlertTriangle
      case 'payment_received':
        return DollarSign
      default:
        return Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow'
      case 'active':
      case 'success':
        return 'green'
      case 'warning':
        return 'red'
      default:
        return 'gray'
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Monitor platform activity and manage content
              </p>
            </div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link href={stat.href}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {stat.title}
                              </p>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stat.value}
                              </p>
                              <p className={`text-sm mt-2 ${
                                stat.change.startsWith('+') 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {stat.change} from last month
                              </p>
                            </div>
                            <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                              <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Activity</CardTitle>
                      <Link href="/admin/activity">
                        <Button variant="ghost" size="sm">View All</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => {
                        const Icon = getActivityIcon(activity.type)
                        return (
                          <div key={activity.id} className="flex items-start space-x-4">
                            <div className={`p-2 rounded-full bg-${getStatusColor(activity.status)}-100 dark:bg-${getStatusColor(activity.status)}-900/30`}>
                              <Icon className={`h-4 w-4 text-${getStatusColor(activity.status)}-600 dark:text-${getStatusColor(activity.status)}-400`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {activity.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activity.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {activity.user} • {activity.time}
                              </p>
                            </div>
                            <Badge variant={getStatusColor(activity.status) as any}>
                              {activity.status}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Link href="/admin/jobs/new">
                        <Button variant="outline" className="justify-start">
                          <Briefcase className="mr-2 h-4 w-4" />
                          Post New Job
                        </Button>
                      </Link>
                      <Link href="/admin/users/new">
                        <Button variant="outline" className="justify-start">
                          <Users className="mr-2 h-4 w-4" />
                          Add User
                        </Button>
                      </Link>
                      <Link href="/admin/moderation">
                        <Button variant="outline" className="justify-start">
                          <Shield className="mr-2 h-4 w-4" />
                          Review Queue
                        </Button>
                      </Link>
                      <Link href="/admin/analytics">
                        <Button variant="outline" className="justify-start">
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analytics
                        </Button>
                      </Link>
                    </div>

                    {/* Pending Items */}
                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Requires Attention
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Pending job reviews
                            </span>
                          </div>
                          <Badge variant="yellow">23</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Flagged applications
                            </span>
                          </div>
                          <Badge variant="red">7</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Verification requests
                            </span>
                          </div>
                          <Badge variant="blue">15</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Platform Analytics</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">Last 7 days</Button>
                      <Button variant="outline" size="sm">Export</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    Analytics chart will be rendered here
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}