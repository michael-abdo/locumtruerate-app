'use client'

import React, { useState, useEffect } from 'react'
import { JobFilters, type JobFiltersState } from '@/components/jobs/job-filters'
import { JobCard } from '@/components/jobs/job-card'
import { Filter } from 'lucide-react'

// This would typically come from an API
const MOCK_JOBS = [
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
      currency: 'USD' as const,
      period: 'yearly' as const
    },
    type: 'FULL_TIME' as const,
    category: 'ENGINEERING' as const,
    tags: ['Emergency', 'Trauma', 'Critical Care'],
    specialty: 'Emergency Medicine',
    experienceLevel: 'Senior Level',
    publishedAt: new Date('2024-01-15'),
    expiresAt: new Date('2024-02-15'),
    isUrgent: true,
    isFeatured: false,
    applicationCount: 12,
    descriptionPreview: 'Join our dynamic emergency department serving a diverse patient population.',
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
      currency: 'USD' as const,
      period: 'yearly' as const
    },
    type: 'REMOTE' as const,
    category: 'ENGINEERING' as const,
    tags: ['Telemedicine', 'Flexible Schedule', 'Remote'],
    specialty: 'Family Medicine',
    experienceLevel: 'Mid Level',
    publishedAt: new Date('2024-01-12'),
    expiresAt: new Date('2024-02-12'),
    isUrgent: false,
    isFeatured: true,
    applicationCount: 8,
    descriptionPreview: 'Provide high-quality virtual care to patients from the comfort of your home.',
    viewCount: 203
  }
]

export default function JobSearchExamplePage() {
  const [filters, setFilters] = useState<JobFiltersState>({})
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
  
  const handleFiltersChange = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    // In a real app, this would trigger an API call to fetch filtered jobs
    console.log('Filters changed:', newFilters)
  }
  
  const handleApplyFilters = (newFilters: JobFiltersState) => {
    setFilters(newFilters)
    setShowMobileFilters(false)
    // In a real app, this would trigger the search
    console.log('Apply filters:', newFilters)
  }
  
  const activeFilterCount = Object.values(filters).reduce((count, value) => {
    if (value === undefined || value === '' || value === false) return count
    if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0)
    return count + 1
  }, 0)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Your Perfect Job
          </h1>
          <p className="text-gray-600">
            Search and filter through thousands of medical positions
          </p>
        </div>
        
        {/* Mobile Filter Button */}
        {isMobile && (
          <div className="mb-6">
            <button
              onClick={() => setShowMobileFilters(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {MOCK_JOBS.length} Jobs Found
              </h2>
              {activeFilterCount > 0 && (
                <p className="text-gray-600">
                  {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                </p>
              )}
            </div>
            
            {/* Job Results */}
            <div className="space-y-4">
              {MOCK_JOBS.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onApply={(id) => console.log('Apply to:', id)}
                  onSave={(id, saved) => console.log('Save job:', id, saved)}
                  onShare={(id) => console.log('Share job:', id)}
                />
              ))}
            </div>
            
            {/* Load More Button */}
            <div className="mt-8 text-center">
              <button className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Load More Jobs
              </button>
            </div>
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
    </div>
  )
}