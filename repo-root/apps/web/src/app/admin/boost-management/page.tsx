'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { 
  BoostAnalyticsDashboard,
  BoostJobModal,
  BoostedJobBadge 
} from '@/components/jobs'
import { Button } from '@locumtruerate/ui'
import { 
  Plus, 
  Filter, 
  Search,
  MoreVertical,
  Edit,
  Pause,
  Play,
  Trash2,
  TrendingUp,
  Eye,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
// import { trpc } from '@/lib/trpc/client' // Temporarily disabled
import { toast } from 'sonner'

// Mock data for demonstration
const mockJobs = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    company: 'TechCorp Inc.',
    status: 'active' as const,
    createdAt: '2024-01-15',
    applications: 45,
    views: 1250,
    boosts: ['featured', 'premium'] as const
  },
  {
    id: 'job-2', 
    title: 'Emergency Medicine Physician',
    company: 'Metro General Hospital',
    status: 'draft' as const,
    createdAt: '2024-01-10',
    applications: 12,
    views: 340,
    boosts: [] as const
  },
  {
    id: 'job-3',
    title: 'Product Manager',
    company: 'StartupXYZ',
    status: 'active' as const,
    createdAt: '2024-01-08',
    applications: 78,
    views: 2100,
    boosts: ['urgent', 'sponsored'] as const
  }
]

interface JobRowProps {
  job: typeof mockJobs[0]
  onBoost: (jobId: string) => void
  onEdit: (jobId: string) => void
  onToggleStatus: (jobId: string) => void
  onDelete: (jobId: string) => void
}

function JobRow({ job, onBoost, onEdit, onToggleStatus, onDelete }: JobRowProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {job.title}
              </h3>
              {job.boosts.length > 0 && (
                <div className="flex gap-1">
                  {job.boosts.slice(0, 2).map((boost) => (
                    <BoostedJobBadge 
                      key={boost} 
                      type={boost} 
                      size="sm" 
                      animated={false}
                    />
                  ))}
                  {job.boosts.length > 2 && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      +{job.boosts.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{job.company}</p>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          job.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            : job.status === 'draft'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        )}>
          {job.status}
        </span>
      </td>
      
      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
        {new Date(job.createdAt).toLocaleDateString()}
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{job.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="font-medium">{job.applications}</span>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {job.boosts.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBoost(job.id)}
              className="flex items-center gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              Boost
            </Button>
          )}
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    onEdit(job.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit Job
                </button>
                <button
                  onClick={() => {
                    onToggleStatus(job.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  {job.status === 'active' ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause Job
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Activate Job
                    </>
                  )}
                </button>
                {job.boosts.length === 0 && (
                  <button
                    onClick={() => {
                      onBoost(job.id)
                      setShowMenu(false)
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Boost Job
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete(job.id)
                    setShowMenu(false)
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Job
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function BoostManagementPage() {
  const searchParams = useSearchParams()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'jobs' | 'analytics'>(
    (searchParams.get('tab') as 'overview' | 'jobs' | 'analytics') || 'overview'
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [showBoostModal, setShowBoostModal] = useState(false)

  // Mock mutation until router is enabled
  const activateBoost = {
    mutate: ({ jobId, packageId, packageDuration }: any) => {
      toast.success('Boost activated successfully!', {
        description: `Your job listing is now boosted for ${packageId} package`
      })
      
      // Clear URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('jobId')
      url.searchParams.delete('packageId')
      window.history.replaceState({}, '', url.toString())
    },
    isLoading: false
  }

  // Handle payment success callback
  useEffect(() => {
    const success = searchParams.get('success')
    const jobId = searchParams.get('jobId')
    const packageId = searchParams.get('packageId')
    
    if (success === 'true' && jobId && packageId) {
      // Find package details to get duration
      const packages = [
        { id: 'featured', duration: 7 },
        { id: 'urgent', duration: 3 },
        { id: 'premium', duration: 14 },
        { id: 'sponsored', duration: 10 }
      ]
      
      const packageDetails = packages.find(p => p.id === packageId)
      
      if (packageDetails) {
        activateBoost.mutate({
          jobId,
          packageId,
          packageDuration: packageDetails.duration
        })
      }
    }
    
    // Handle cancellation
    const canceled = searchParams.get('canceled')
    if (canceled === 'true') {
      toast.info('Boost payment was canceled')
      
      // Clear URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('canceled')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams, activateBoost])

  const filteredJobs = mockJobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.company.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBoostJob = (jobId: string) => {
    setSelectedJob(jobId)
    setShowBoostModal(true)
  }

  // Mock mutation until router is enabled
  const createBoostCheckout = {
    mutateAsync: async (data: any) => {
      // Mock the checkout creation
      toast.info('Payment processing is currently disabled in demo mode')
      return { url: null }
    },
    isLoading: false
  }

  const handleBoostSubmit = async (data: any) => {
    const currentJobData = selectedJob ? mockJobs.find(j => j.id === selectedJob) : null
    if (!currentJobData) {
      toast.error('Job not found')
      return
    }
    
    try {
      const { packageDetails } = data
      
      // Create Stripe checkout session
      await createBoostCheckout.mutateAsync({
        jobId: currentJobData.id,
        packageId: packageDetails.id,
        packageName: packageDetails.name,
        packagePrice: packageDetails.price,
        packageDuration: packageDetails.duration,
        successUrl: `${window.location.origin}/admin/boost-management?success=true&jobId=${currentJobData.id}&packageId=${packageDetails.id}`,
        cancelUrl: `${window.location.origin}/admin/boost-management?canceled=true`
      })
    } catch (error) {
      console.error('Failed to process boost payment:', error)
      toast.error('Failed to process boost payment')
    }
  }

  const selectedJobData = selectedJob ? mockJobs.find(j => j.id === selectedJob) : null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Boost Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and analyze your boosted job listings for maximum visibility
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'jobs', label: 'Job Listings' },
                { id: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={cn(
                    'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {selectedTab === 'overview' && (
              <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Active Boosts
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mockJobs.filter(j => j.boosts.length > 0).length}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Views
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mockJobs.reduce((sum, job) => sum + job.views, 0).toLocaleString()}
                        </p>
                      </div>
                      <Eye className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Applications
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {mockJobs.reduce((sum, job) => sum + job.applications, 0)}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Avg ROI
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          245%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Recent Jobs */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Recent Job Listings
                      </h2>
                      <Button
                        onClick={() => setSelectedTab('jobs')}
                        variant="outline"
                        size="sm"
                      >
                        View All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {mockJobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {job.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {job.company}
                              </p>
                            </div>
                            {job.boosts.length > 0 && (
                              <div className="flex gap-1">
                                {job.boosts.slice(0, 2).map((boost) => (
                                  <BoostedJobBadge 
                                    key={boost} 
                                    type={boost} 
                                    size="sm" 
                                    animated={false}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {job.views.toLocaleString()}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">Views</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {job.applications}
                              </div>
                              <div className="text-gray-600 dark:text-gray-400">Apps</div>
                            </div>
                            {job.boosts.length === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleBoostJob(job.id)}
                              >
                                Boost
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'jobs' && (
              <div className="space-y-6">
                {/* Job Management Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm w-64"
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                  
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Post New Job
                  </Button>
                </div>

                {/* Jobs Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Job
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredJobs.map((job) => (
                        <JobRow
                          key={job.id}
                          job={job}
                          onBoost={handleBoostJob}
                          onEdit={(jobId) => console.log('Edit:', jobId)}
                          onToggleStatus={(jobId) => console.log('Toggle status:', jobId)}
                          onDelete={(jobId) => console.log('Delete:', jobId)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === 'analytics' && (
              <BoostAnalyticsDashboard
                onRefresh={() => console.log('Refresh analytics')}
                onExport={() => console.log('Export analytics')}
              />
            )}
          </motion.div>
        </div>
      </main>

      {/* Boost Modal */}
      {showBoostModal && selectedJobData && (
        <BoostJobModal
          job={{
            id: selectedJobData.id,
            title: selectedJobData.title,
            company: { name: selectedJobData.company },
            location: 'Remote',
            description: 'Job description here...',
            createdAt: new Date(selectedJobData.createdAt),
            updatedAt: new Date(),
            slug: `${selectedJobData.title.toLowerCase().replace(/\s+/g, '-')}-${selectedJobData.id}`
          }}
          onClose={() => setShowBoostModal(false)}
          onSubmit={handleBoostSubmit}
        />
      )}
      
      <Footer />
    </>
  )
}