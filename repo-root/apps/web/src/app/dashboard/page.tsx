'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Briefcase, Calendar, TrendingUp, Bell, 
  Settings, FileText, Bookmark, MessageSquare,
  BarChart3, DollarSign, MapPin, Clock, Star
} from 'lucide-react'
// Header and Footer already included in root layout
import { Button } from '@locumtruerate/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/providers/trpc-provider'

type DashboardTab = 'overview' | 'applications' | 'saved' | 'profile' | 'analytics'

const stats = [
  {
    title: 'Active Applications',
    value: '12',
    change: '+3 this week',
    icon: FileText,
    color: 'blue'
  },
  {
    title: 'Saved Jobs',
    value: '28',
    change: '+5 this week',
    icon: Bookmark,
    color: 'green'
  },
  {
    title: 'Profile Views',
    value: '156',
    change: '+12% this month',
    icon: TrendingUp,
    color: 'purple'
  },
  {
    title: 'Contract Value',
    value: '$285K',
    change: 'Average offer',
    icon: DollarSign,
    color: 'yellow'
  }
]

const recentApplications = [
  {
    id: '1',
    jobTitle: 'Emergency Medicine Physician',
    company: 'Metro General Hospital',
    location: 'Austin, TX',
    appliedDate: '2024-01-15',
    status: 'Under Review',
    salary: '$320,000'
  },
  {
    id: '2',
    jobTitle: 'Family Medicine Locum',
    company: 'Community Health Partners',
    location: 'Denver, CO',
    appliedDate: '2024-01-12',
    status: 'Interview Scheduled',
    salary: '$280,000'
  },
  {
    id: '3',
    jobTitle: 'Internal Medicine Physician',
    company: 'Regional Medical Center',
    location: 'Phoenix, AZ',
    appliedDate: '2024-01-10',
    status: 'Offer Received',
    salary: '$295,000'
  }
]

const upcomingEvents = [
  {
    id: '1',
    title: 'Interview with Metro General',
    type: 'interview',
    date: '2024-01-20',
    time: '10:00 AM',
    location: 'Video Call'
  },
  {
    id: '2',
    title: 'Contract Review Deadline',
    type: 'deadline',
    date: '2024-01-22',
    time: '5:00 PM',
    location: 'Regional Medical Center'
  },
  {
    id: '3',
    title: 'Networking Event',
    type: 'event',
    date: '2024-01-25',
    time: '6:30 PM',
    location: 'Downtown Convention Center'
  }
]

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview')
  
  // API calls
  const { data: user } = trpc.users.getProfile.useQuery()
  const { data: applications } = trpc.applications.getByUser.useQuery()
  const { data: savedJobs } = trpc.jobs.getSaved.useQuery()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Under Review':
        return 'yellow'
      case 'Interview Scheduled':
        return 'blue'
      case 'Offer Received':
        return 'green'
      case 'Rejected':
        return 'red'
      default:
        return 'gray'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'interview':
        return MessageSquare
      case 'deadline':
        return Clock
      case 'event':
        return Calendar
      default:
        return Calendar
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900">
        {/* Dashboard Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Welcome back, Dr. {user?.firstName || 'Smith'}
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Here's what's happening with your job search
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  <Button variant="outline" size="sm">
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                        <Icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Applications */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Recent Applications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentApplications.map((application) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {application.jobTitle}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {application.company}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="h-4 w-4" />
                              {application.location}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <DollarSign className="h-4 w-4" />
                              {application.salary}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={getStatusColor(application.status) as any}>
                            {application.status}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            Applied {new Date(application.appliedDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button variant="outline">View All Applications</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => {
                      const Icon = getEventIcon(event.type)
                      return (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </p>
                            <p className="text-xs text-gray-500">
                              {event.location}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Browse New Jobs
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="mr-2 h-4 w-4" />
                      Update Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Messages
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Completion */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Completion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Overall Progress
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        85%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Basic info completed</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Star className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-600 dark:text-gray-400">Experience added</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <div className="h-4 w-4 border-2 border-gray-300 rounded mr-2"></div>
                        <span className="text-gray-600 dark:text-gray-400">Add certifications</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Complete Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        New job match found
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Emergency Medicine position in Dallas, TX - 95% match
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Interview scheduled
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Metro General Hospital - January 20th at 10:00 AM
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">1 day ago</span>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Profile viewed
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Your profile was viewed by Regional Medical Center
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">2 days ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
    </div>
  )
}