'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Search, Filter, MoreHorizontal, Eye, Edit, 
  Trash2, CheckCircle, XCircle, Clock, AlertTriangle,
  Briefcase, MapPin, DollarSign, Calendar, Building
} from 'lucide-react'
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input
} from '@locumtruerate/ui'
import { AdminHeader } from '@/components/admin/admin-header'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { trpc } from '@/providers/trpc-provider'

type JobStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'EXPIRED' | 'DRAFT'
type FilterStatus = JobStatus | 'ALL'

const statusConfig = {
  ACTIVE: { label: 'Active', color: 'green', icon: CheckCircle },
  PENDING: { label: 'Pending Review', color: 'yellow', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'red', icon: XCircle },
  EXPIRED: { label: 'Expired', color: 'gray', icon: AlertTriangle },
  DRAFT: { label: 'Draft', color: 'blue', icon: Edit }
}

export default function AdminJobsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [page, setPage] = useState(1)
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())

  // Get jobs with filters
  const { data: jobsData, isLoading, refetch } = trpc.jobs.getAll.useQuery({
    page,
    limit: 25,
    search: searchQuery || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })

  // Get pending jobs count
  const { data: pendingJobs } = trpc.admin.getPendingJobs.useQuery({
    limit: 1,
    page: 1
  })

  // Moderation mutations
  const moderateJobMutation = trpc.admin.moderateJob.useMutation({
    onSuccess: () => {
      refetch()
    }
  })

  const handleModerateJob = async (jobId: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      await moderateJobMutation.mutateAsync({
        jobId,
        action,
        reason
      })
    } catch (error) {
      console.error('Failed to moderate job:', error)
    }
  }

  const handleSelectJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs)
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId)
    } else {
      newSelected.add(jobId)
    }
    setSelectedJobs(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedJobs.size === jobsData?.jobs.length) {
      setSelectedJobs(new Set())
    } else {
      setSelectedJobs(new Set(jobsData?.jobs.map(job => job.id) || []))
    }
  }

  const getStatusBadge = (status: JobStatus) => {
    const config = statusConfig[status]
    const Icon = config.icon
    return (
      <Badge variant={config.color as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Job Management
                  </h1>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Review and manage job postings across the platform
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {pendingJobs && pendingJobs.pagination.total > 0 && (
                    <Badge variant="yellow" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {pendingJobs.pagination.total} pending review
                    </Badge>
                  )}
                  <Button onClick={() => router.push('/admin/jobs/new')}>
                    Post New Job
                  </Button>
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search jobs by title, company, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Status</option>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                  
                  <Button variant="outline">
                    <Filter className="mr-2 h-4 w-4" />
                    More Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Jobs List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Jobs ({jobsData?.pagination.total || 0})</CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedJobs.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedJobs.size} selected
                        </span>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : jobsData?.jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
                      No jobs found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Try adjusting your search criteria
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="hidden md:flex items-center py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                      <div className="w-8">
                        <input
                          type="checkbox"
                          checked={selectedJobs.size === jobsData?.jobs.length && jobsData.jobs.length > 0}
                          onChange={handleSelectAll}
                          className="rounded"
                        />
                      </div>
                      <div className="flex-1">Job Details</div>
                      <div className="w-24 text-center">Status</div>
                      <div className="w-32 text-center">Posted</div>
                      <div className="w-20 text-center">Actions</div>
                    </div>

                    {/* Job Rows */}
                    {jobsData?.jobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex flex-col md:flex-row items-start md:items-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        {/* Checkbox */}
                        <div className="hidden md:block w-8">
                          <input
                            type="checkbox"
                            checked={selectedJobs.has(job.id)}
                            onChange={() => handleSelectJob(job.id)}
                            className="rounded"
                          />
                        </div>

                        {/* Job Details */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3">
                            {job.company?.logo && (
                              <img
                                src={job.company.logo}
                                alt={job.company.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Building className="h-4 w-4" />
                                  {job.company?.name}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {job.location}
                                </span>
                                {job.salaryMin && job.salaryMax && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="w-full md:w-24 mt-3 md:mt-0 text-center">
                          {getStatusBadge(job.status as JobStatus)}
                        </div>

                        {/* Posted Date */}
                        <div className="w-full md:w-32 mt-2 md:mt-0 text-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="w-full md:w-20 mt-3 md:mt-0 flex justify-center">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/jobs/${job.slug}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {job.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleModerateJob(job.id, 'approve')}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={moderateJobMutation.isLoading}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleModerateJob(job.id, 'reject', 'Does not meet platform guidelines')}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={moderateJobMutation.isLoading}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {jobsData && jobsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, jobsData.pagination.total)} of {jobsData.pagination.total} jobs
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page} of {jobsData.pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === jobsData.pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}