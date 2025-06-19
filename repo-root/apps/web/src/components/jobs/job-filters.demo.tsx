'use client'

import React, { useState, useEffect } from 'react'
import { JobFilters, type JobFiltersState } from './job-filters'
import { JobCard, type JobCardData } from './job-card'
import { cn } from '@/lib/utils'
import { Filter, Grid, List, Search } from 'lucide-react'

// Sample job data for demo
const SAMPLE_JOBS: JobCardData[] = [
  {
    id: '1',
    title: 'Emergency Medicine Physician',
    companyName: 'Metro General Hospital',
    companyLogo: undefined,
    location: 'New York, NY',
    isRemote: false,
    salary: '$250,000 - $350,000',
    salaryRange: {
      min: 250000,
      max: 350000,
      currency: 'USD',
      period: 'yearly'
    },
    type: 'FULL_TIME',
    category: 'ENGINEERING',
    tags: ['Emergency', 'Trauma', 'Critical Care', 'Night Shifts'],
    specialty: 'Emergency Medicine',
    experienceLevel: 'Senior Level',
    publishedAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-02-15'),
    isUrgent: true,
    isFeatured: false,
    applicationCount: 12,
    descriptionPreview: 'Join our dynamic emergency department serving a diverse patient population. We offer competitive compensation, excellent benefits, and opportunities for professional growth.',
    viewCount: 156
  },
  {
    id: '2', 
    title: 'Family Medicine Physician - Remote Telemedicine',
    companyName: 'HealthTech Virtual Care',
    companyLogo: undefined,
    location: 'Remote',
    isRemote: true,
    salary: '$180,000 - $220,000',
    salaryRange: {
      min: 180000,
      max: 220000,
      currency: 'USD',
      period: 'yearly'
    },
    type: 'REMOTE',
    category: 'ENGINEERING',
    tags: ['Telemedicine', 'Flexible Schedule', 'Remote', 'Primary Care'],
    specialty: 'Family Medicine',
    experienceLevel: 'Mid Level',
    publishedAt: new Date('2024-01-12'),
    expiresAt: new Date('2024-02-12'),
    isUrgent: false,
    isFeatured: true,
    applicationCount: 8,
    descriptionPreview: 'Provide high-quality virtual care to patients from the comfort of your home. Flexible scheduling and state-of-the-art telehealth platform.',
    viewCount: 203
  },
  {
    id: '3',
    title: 'Locum Tenens Hospitalist',
    companyName: 'National Locum Solutions',
    companyLogo: undefined,
    location: 'Boston, MA',
    isRemote: false,
    salary: '$300/hour',
    salaryRange: {
      min: 300,
      max: 350,
      currency: 'USD',
      period: 'hourly'
    },
    type: 'CONTRACT',
    category: 'ENGINEERING',
    tags: ['Locum Tenens', 'Hospitalist', 'Short-term', 'Travel'],
    specialty: 'Internal Medicine',
    experienceLevel: 'Senior Level',
    publishedAt: new Date('2024-01-10'),
    expiresAt: new Date('2024-01-25'),
    isUrgent: true,
    isFeatured: false,
    applicationCount: 5,
    descriptionPreview: '3-month locum assignment at a prestigious teaching hospital. Housing and travel allowances provided. Immediate start available.',
    viewCount: 89
  },
  {
    id: '4',
    title: 'Pediatric Emergency Medicine Specialist',
    companyName: "Children's Medical Center",
    companyLogo: undefined,
    location: 'Los Angeles, CA',
    isRemote: false,
    salary: '$280,000 - $380,000',
    salaryRange: {
      min: 280000,
      max: 380000,
      currency: 'USD',
      period: 'yearly'
    },
    type: 'FULL_TIME',
    category: 'ENGINEERING',
    tags: ['Pediatrics', 'Emergency', 'Teaching Hospital', 'Research'],
    specialty: 'Pediatrics',
    experienceLevel: 'Senior Level',
    publishedAt: new Date('2024-01-08'),
    expiresAt: new Date('2024-02-08'),
    isUrgent: false,
    isFeatured: true,
    applicationCount: 15,
    descriptionPreview: 'Join our award-winning pediatric emergency department. Opportunities for teaching medical students and residents, plus active research program.',
    viewCount: 234
  },
  {
    id: '5',
    title: 'Psychiatrist - Outpatient Clinic',
    companyName: 'Behavioral Health Partners',
    companyLogo: undefined,
    location: 'Chicago, IL',
    isRemote: false,
    salary: '$220,000 - $280,000',
    salaryRange: {
      min: 220000,
      max: 280000,
      currency: 'USD',
      period: 'yearly'
    },
    type: 'FULL_TIME',
    category: 'ENGINEERING',
    tags: ['Psychiatry', 'Outpatient', 'Mental Health', 'Work-Life Balance'],
    specialty: 'Psychiatry',
    experienceLevel: 'Mid Level',
    publishedAt: new Date('2024-01-05'),
    expiresAt: new Date('2024-02-05'),
    isUrgent: false,
    isFeatured: false,
    applicationCount: 9,
    descriptionPreview: 'Provide comprehensive psychiatric care in a supportive outpatient setting. Excellent work-life balance with flexible scheduling options.',
    viewCount: 167
  }
]

interface JobFiltersDemo {
  className?: string
}

export function JobFiltersDemo({ className }: JobFiltersDemo) {
  const [filters, setFilters] = useState<JobFiltersState>({})
  const [filteredJobs, setFilteredJobs] = useState<JobCardData[]>(SAMPLE_JOBS)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Filter jobs based on current filters
  useEffect(() => {
    let filtered = [...SAMPLE_JOBS]
    
    // Location filter
    if (filters.location) {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location!.toLowerCase())
      )
    }
    
    // Remote filter
    if (filters.remote) {
      if (filters.remote === 'remote') {
        filtered = filtered.filter(job => job.isRemote)
      } else if (filters.remote === 'onsite') {
        filtered = filtered.filter(job => !job.isRemote)
      }
      // hybrid would require additional job data field
    }
    
    // Specialty filter
    if (filters.specialty) {
      filtered = filtered.filter(job => 
        job.specialty?.toLowerCase().includes(filters.specialty!.toLowerCase())
      )
    }
    
    // Experience level filter
    if (filters.experience) {
      const experienceMap = {
        'entry': ['Entry Level', 'Junior'],
        'mid': ['Mid Level', 'Intermediate'],
        'senior': ['Senior Level', 'Senior'],
        'executive': ['Executive', 'Lead', 'Director']
      }
      
      const experienceTerms = experienceMap[filters.experience] || []
      filtered = filtered.filter(job => 
        experienceTerms.some(term => 
          job.experienceLevel?.includes(term)
        )
      )
    }
    
    // Job type filter
    if (filters.jobType) {
      filtered = filtered.filter(job => job.type === filters.jobType)
    }
    
    // Salary range filter
    if (filters.salaryMin || filters.salaryMax) {
      filtered = filtered.filter(job => {
        if (!job.salaryRange) return true
        
        const jobMinSalary = job.salaryRange.min
        const jobMaxSalary = job.salaryRange.max
        
        if (filters.salaryMin && jobMaxSalary < filters.salaryMin) return false
        if (filters.salaryMax && jobMinSalary > filters.salaryMax) return false
        
        return true
      })
    }
    
    // Date posted filter (mock implementation)
    if (filters.datePosted) {
      const now = new Date()
      const cutoffDays = {
        '24h': 1,
        '3d': 3,
        '7d': 7,
        '30d': 30
      }[filters.datePosted] || 30
      
      const cutoffDate = new Date(now.getTime() - cutoffDays * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(job => job.publishedAt >= cutoffDate)
    }
    
    // Urgent filter
    if (filters.urgent) {
      filtered = filtered.filter(job => job.isUrgent)
    }
    
    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter(job => job.isFeatured)
    }
    
    // Benefits filter (would require additional job data)
    if (filters.benefits && filters.benefits.length > 0) {
      // Mock implementation - in real app would check job.benefits array
      filtered = filtered.filter(job => 
        job.tags.some(tag => 
          filters.benefits!.some(benefit => 
            tag.toLowerCase().includes(benefit.toLowerCase())
          )
        )
      )
    }
    
    setFilteredJobs(filtered)
  }, [filters])
  
  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
  }
  
  const handleApplyFilters = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    setShowMobileFilters(false)
  }
  
  const handleJobApply = (jobId: string) => {
    console.log('Apply to job:', jobId)
    alert(`Applied to job ${jobId}`)
  }
  
  const handleJobSave = (jobId: string, isSaved: boolean) => {
    console.log(`${isSaved ? 'Saved' : 'Unsaved'} job:`, jobId)
  }
  
  const handleJobShare = (jobId: string) => {
    console.log('Share job:', jobId)
    alert(`Shared job ${jobId}`)
  }
  
  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (value === undefined || value === '' || value === false) return count
    if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0)
    return count + 1
  }, 0)
  
  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Job Search Demo</h1>
        <p className="text-gray-600">
          Interactive demonstration of the JobFilters component with real-time filtering
        </p>
      </div>
      
      {/* Mobile filter toggle */}
      {isMobile && (
        <div className="mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg",
              "hover:bg-blue-700 transition-colors",
              activeFilterCount > 0 && "bg-blue-700"
            )}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-800 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}
      
      <div className="flex gap-6">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <div className="w-80 flex-shrink-0">
            <JobFilters
              initialFilters={filters}
              onFiltersChange={handleFiltersChange}
              onApply={handleApplyFilters}
              isMobile={false}
              showAsBottomSheet={false}
            />
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">
                {filteredJobs.length} Jobs Found
              </h2>
              {activeFilterCount > 0 && (
                <p className="text-sm text-gray-600">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 rounded",
                  viewMode === 'list' 
                    ? "bg-blue-100 text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 rounded",
                  viewMode === 'grid' 
                    ? "bg-blue-100 text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, value]) => {
                  if (value === undefined || value === '' || value === false) return null
                  
                  let displayValue = value
                  if (Array.isArray(value)) {
                    if (value.length === 0) return null
                    displayValue = value.join(', ')
                  } else if (typeof value === 'boolean') {
                    displayValue = key
                  }
                  
                  return (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>{String(displayValue)}</span>
                    </span>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Job Results */}
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">
                Try adjusting your filters to see more results
              </p>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "space-y-4"
            )}>
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={handleJobApply}
                  onSave={handleJobSave}
                  onShare={handleJobShare}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Bottom Sheet */}
      <JobFilters
        initialFilters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onClose={() => setShowMobileFilters(false)}
        isMobile={true}
        showAsBottomSheet={true}
        isOpen={showMobileFilters}
      />
    </div>
  )
}