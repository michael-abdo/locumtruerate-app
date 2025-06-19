'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, MapPin, Clock, DollarSign, Star, Bookmark } from 'lucide-react'
import { AdvancedSearch } from '@/components/search/advanced-search'
import { JobCard, JobFilters, type JobFiltersState } from '@/components/jobs'
import { 
  JobMap, SortOptions, 
  Pagination, SavedSearches, JobAlerts 
} from '@/components/placeholder'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { trpc } from '@/providers/trpc-provider'
import { Button } from '@locumtruerate/ui'
import { usePageAnalytics } from '@/hooks/use-analytics'
import { generateSearchSEO } from '@/lib/seo'
import { Metadata } from 'next'

// Generate metadata for search results SEO
export async function generateMetadata({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}): Promise<Metadata> {
  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined
  
  return generateSearchSEO({
    query,
    location,
    category,
    resultCount: 0 // Will be updated with real count in component
  })
}

type ViewMode = 'list' | 'map' | 'grid'
type SortBy = 'relevance' | 'date' | 'salary' | 'location'

const quickFilters = [
  { label: 'Remote', value: 'remote', count: 245 },
  { label: 'High Demand', value: 'high-demand', count: 189 },
  { label: 'No Experience Required', value: 'entry-level', count: 156 },
  { label: 'Travel Opportunities', value: 'travel', count: 234 },
  { label: 'Emergency Medicine', value: 'emergency', count: 98 },
  { label: 'Family Medicine', value: 'family', count: 167 }
]

export default function JobSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // State management
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showFilters, setShowFilters] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  
  // Analytics
  const { trackSearchUsage, trackUserEngagement } = usePageAnalytics()
  
  // Search state - matching JobFiltersState interface
  const [searchFilters, setSearchFilters] = useState<JobFiltersState>({
    location: searchParams.get('location') || '',
    remote: searchParams.get('remote') as JobFiltersState['remote'] || '',
    specialty: searchParams.get('specialty') || searchParams.get('category') || '',
    experience: searchParams.get('experience') as JobFiltersState['experience'] || '',
    jobType: searchParams.get('type') as JobFiltersState['jobType'] || '',
    salaryMin: searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined,
    salaryMax: searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined,
    urgent: searchParams.get('urgent') === 'true',
    featured: searchParams.get('featured') === 'true'
  })
  
  // Legacy search filters for API compatibility
  const apiSearchFilters = {
    query: searchParams.get('query') || '',
    location: searchFilters.location,
    category: searchFilters.specialty,
    type: searchFilters.jobType,
    salaryMin: searchFilters.salaryMin,
    salaryMax: searchFilters.salaryMax,
    remote: searchFilters.remote === 'remote',
    urgent: searchFilters.urgent,
    startDate: searchParams.get('startDate') || '',
    duration: searchParams.get('duration') || ''
  }
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))

  // API calls using full-text search
  const { data: jobsData, isLoading, error } = trpc.search.jobs.useQuery({
    ...apiSearchFilters,
    page,
    limit: 20,
    sortBy: sortBy as any,
    sortOrder: 'desc'
  })
  
  // Track search usage when results change
  useEffect(() => {
    if (jobsData && apiSearchFilters.query) {
      trackSearchUsage(
        apiSearchFilters.query, 
        jobsData.pagination.total,
        {
          location: apiSearchFilters.location,
          category: apiSearchFilters.category,
          type: apiSearchFilters.type,
          page,
          sortBy
        }
      )
    }
  }, [jobsData, apiSearchFilters, page, sortBy, trackSearchUsage])

  const { data: featuredJobs } = trpc.jobs.getAll.useQuery({
    status: 'ACTIVE',
    page: 1,
    limit: 3,
    sortBy: 'viewCount',
    sortOrder: 'desc'
  })

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams()
    if (apiSearchFilters.query) params.set('q', apiSearchFilters.query)
    if (searchFilters.location) params.set('location', searchFilters.location)
    if (searchFilters.jobType) params.set('type', searchFilters.jobType)
    if (searchFilters.specialty) params.set('specialty', searchFilters.specialty)
    if (searchFilters.remote) params.set('remote', searchFilters.remote)
    if (searchFilters.experience) params.set('experience', searchFilters.experience)
    if (searchFilters.salaryMin) params.set('salaryMin', searchFilters.salaryMin.toString())
    if (searchFilters.salaryMax) params.set('salaryMax', searchFilters.salaryMax.toString())
    if (searchFilters.urgent) params.set('urgent', 'true')
    if (searchFilters.featured) params.set('featured', 'true')
    if (page > 1) params.set('page', page.toString())
    
    router.push(`/search/jobs?${params.toString()}`, { scroll: false })
  }, [searchFilters, apiSearchFilters, page, router])

  const handleSearch = (query: string, loc: string) => {
    // Update search query in searchParams (will be handled by AdvancedSearch)
    setSearchQuery(query)
    setLocation(loc)
    setSearchFilters(prev => ({ ...prev, location: loc }))
    setPage(1)
  }

  const handleFilterChange = (newFilters: JobFiltersState) => {
    setSearchFilters(prev => ({ ...prev, ...newFilters }))
    setPage(1)
  }

  const toggleSaveJob = (jobId: string) => {
    const newSavedJobs = new Set(savedJobs)
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId)
    } else {
      newSavedJobs.add(jobId)
    }
    setSavedJobs(newSavedJobs)
  }

  const handleQuickFilter = (filterValue: string) => {
    if (filterValue === 'remote') {
      setSearchFilters(prev => ({ 
        ...prev, 
        remote: prev.remote === 'remote' ? '' : 'remote' 
      }))
    } else if (filterValue === 'high-demand') {
      setSearchFilters(prev => ({ ...prev, urgent: true }))
    } else if (filterValue === 'travel') {
      setSearchQuery('travel opportunities')
    } else if (filterValue === 'emergency' || filterValue === 'family') {
      setSearchFilters(prev => ({ 
        ...prev, 
        specialty: filterValue === 'emergency' ? 'Emergency Medicine' : 'Family Medicine' 
      }))
    } else if (filterValue === 'entry-level') {
      setSearchFilters(prev => ({ ...prev, experience: 'entry' }))
    } else {
      setSearchQuery(prev => prev ? `${prev} ${filterValue}` : filterValue)
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Search Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <AdvancedSearch
                initialFilters={apiSearchFilters}
                onSearch={(filters) => {
                  // Convert back to JobFiltersState format
                  const newJobFilters: JobFiltersState = {
                    ...searchFilters,
                    location: filters.location || '',
                    specialty: filters.category || '',
                    jobType: filters.type as JobFiltersState['jobType'] || '',
                    salaryMin: filters.salaryMin,
                    salaryMax: filters.salaryMax,
                    remote: filters.remote ? 'remote' : '',
                    urgent: filters.urgent || false
                  }
                  setSearchFilters(newJobFilters)
                  setSearchQuery(filters.query || '')
                  setPage(1)
                }}
              />
            </motion.div>

            {/* Quick Filters */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-6"
            >
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleQuickFilter(filter.value)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 rounded-full text-sm font-medium transition-colors"
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Search Stats & Controls */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <p className="text-gray-600 dark:text-gray-400">
                  {isLoading ? 'Searching...' : `${jobsData?.total || 0} jobs found`}
                  {apiSearchFilters.query && ` for "${apiSearchFilters.query}"`}
                  {searchFilters.location && ` in ${searchFilters.location}`}
                </p>
                
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    showMap 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </button>
              </div>

              <div className="flex items-center gap-4">
                <SortOptions
                  value={sortBy}
                  onChange={setSortBy}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="lg:col-span-1"
              >
                <JobFilters
                  initialFilters={searchFilters}
                  onFiltersChange={handleFilterChange}
                  onClose={() => setShowFilters(false)}
                />
              </motion.div>
            )}

            {/* Results Content */}
            <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
              {/* Map View */}
              {showMap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 400 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-8 overflow-hidden rounded-lg"
                >
                  <JobMap 
                    jobs={jobsData?.jobs || []} 
                    onJobSelect={(job) => router.push(`/jobs/${job.slug}`)}
                  />
                </motion.div>
              )}

              {/* Results Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Search Error
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Unable to search jobs at this time. Please try again later.
                  </p>
                </div>
              ) : jobsData?.jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Jobs Found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Try adjusting your search criteria or location.
                  </p>
                  <Button onClick={() => {
                    setSearchFilters({})
                    setSearchQuery('')
                    setLocation('')
                    setPage(1)
                  }}>
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                <>
                  {/* Job Results */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
                  >
                    {jobsData?.jobs.map((job, index) => (
                      <motion.div
                        key={job.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <JobCard
                          job={{
                            id: job.id,
                            title: job.title,
                            companyName: job.company?.name || 'Unknown Company',
                            companyLogo: job.company?.logo,
                            location: job.location,
                            isRemote: job.type === 'REMOTE',
                            salary: job.salary,
                            salaryRange: undefined, // Not available in current schema
                            type: job.type,
                            category: job.category,
                            tags: job.tags || [],
                            specialty: job.category,
                            experienceLevel: undefined, // Not available in current schema
                            publishedAt: job.publishedAt || job.createdAt,
                            expiresAt: job.expiresAt,
                            isUrgent: false, // Not available in current schema
                            isFeatured: false, // Not available in current schema
                            applicationCount: job._count?.applications || 0,
                            descriptionPreview: job.description ? job.description.slice(0, 200) + '...' : '',
                            viewCount: job._count?.views || job.viewCount || 0
                          }}
                          onApply={(jobId) => router.push(`/jobs/${job.slug}`)}
                          onSave={(jobId, isSaved) => toggleSaveJob(jobId)}
                          onShare={(jobId) => {
                            // Handle share functionality
                            console.log('Share job:', jobId)
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pagination */}
                  {jobsData && jobsData.totalPages > 1 && (
                    <Pagination
                      currentPage={page}
                      totalPages={jobsData.totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Featured Jobs Section */}
        {featuredJobs && featuredJobs.jobs.length > 0 && (
          <section className="bg-white dark:bg-gray-800 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Featured Opportunities
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  High-demand positions from top healthcare organizations
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredJobs.jobs.map((job) => (
                  <div key={job.id} className="relative">
                    <div className="absolute -top-2 -right-2 z-10">
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold">
                        <Star className="inline h-4 w-4 mr-1" />
                        Featured
                      </div>
                    </div>
                    <JobCard
                      job={{
                        id: job.id,
                        title: job.title,
                        companyName: job.company?.name || 'Unknown Company',
                        companyLogo: job.company?.logo,
                        location: job.location,
                        isRemote: job.type === 'REMOTE',
                        salary: job.salary,
                        salaryRange: undefined, // Not available in current schema
                        type: job.type,
                        category: job.category,
                        tags: job.tags || [],
                        specialty: job.category,
                        experienceLevel: undefined, // Not available in current schema
                        publishedAt: job.publishedAt || job.createdAt,
                        expiresAt: job.expiresAt,
                        isUrgent: false, // Not available in current schema
                        isFeatured: true, // Featured jobs section
                        applicationCount: job._count?.applications || 0,
                        descriptionPreview: job.description ? job.description.slice(0, 200) + '...' : '',
                        viewCount: job._count?.views || job.viewCount || 0
                      }}
                      onApply={(jobId) => router.push(`/jobs/${job.slug}`)}
                      onSave={(jobId, isSaved) => toggleSaveJob(jobId)}
                      onShare={(jobId) => {
                        // Handle share functionality
                        console.log('Share job:', jobId)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}