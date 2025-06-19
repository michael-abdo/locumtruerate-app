'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { JobCard } from './job-card'
import { JobCardSkeleton } from '@/components/skeletons'
import type { Job } from '@locumtruerate/types'
import { cn } from '@/lib/utils'

interface SimilarJobsProps {
  jobs: Job[]
  currentJobId?: string
  isLoading?: boolean
  className?: string
  onJobSelect?: (job: Job) => void
  onJobApply?: (jobId: string) => void
  onJobSave?: (jobId: string, isSaved: boolean) => void
  onJobShare?: (jobId: string) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut'
    }
  }
}

export function SimilarJobs({
  jobs,
  currentJobId,
  isLoading = false,
  className,
  onJobSelect,
  onJobApply,
  onJobSave,
  onJobShare
}: SimilarJobsProps) {
  // Filter out current job if provided
  const filteredJobs = currentJobId 
    ? jobs.filter(job => job.id !== currentJobId)
    : jobs

  if (isLoading) {
    return (
      <section className={cn("py-8", className)}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Similar Jobs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover more opportunities that match your profile
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <JobCardSkeleton key={index} showExpanded={false} />
          ))}
        </div>
      </section>
    )
  }

  if (!filteredJobs.length) {
    return (
      <section className={cn("py-8", className)}>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-12 h-12 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Similar Jobs Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            We couldn't find any similar positions at the moment. Try browsing our job categories or check back later for new opportunities.
          </p>
        </div>
      </section>
    )
  }

  // Convert Job to JobCardData format
  const jobCardData = filteredJobs.map(job => ({
    id: job.id,
    title: job.title,
    companyName: job.company?.name || 'Unknown Company',
    companyLogo: job.company?.logo,
    location: job.location,
    isRemote: job.type === 'REMOTE',
    salary: job.salary,
    salaryRange: job.salary ? undefined : {
      min: 50000,
      max: 150000,
      currency: 'USD',
      period: 'yearly' as const
    },
    type: job.type,
    category: job.category,
    tags: job.tags,
    specialty: job.category,
    experienceLevel: 'Mid-Level',
    publishedAt: job.publishedAt || job.createdAt,
    expiresAt: job.expiresAt,
    isUrgent: false,
    isFeatured: false,
    applicationCount: job._count?.applications || 0,
    descriptionPreview: job.description.length > 150 
      ? job.description.substring(0, 150) + '...'
      : job.description,
    viewCount: job.viewCount
  }))

  const handleJobClick = (job: Job) => {
    onJobSelect?.(job)
  }

  const handleApply = (jobId: string) => {
    onJobApply?.(jobId)
  }

  const handleSave = (jobId: string, isSaved: boolean) => {
    onJobSave?.(jobId, isSaved)
  }

  const handleShare = (jobId: string) => {
    onJobShare?.(jobId)
  }

  return (
    <section className={cn("py-8", className)}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Similar Jobs
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Discover {filteredJobs.length} more opportunities that match your profile
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobCardData.slice(0, 6).map((job, index) => (
            <motion.div
              key={job.id}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <JobCard
                job={job}
                onApply={handleApply}
                onSave={handleSave}
                onShare={handleShare}
                className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
                onClick={() => {
                  const originalJob = filteredJobs.find(j => j.id === job.id)
                  if (originalJob) {
                    handleJobClick(originalJob)
                  }
                }}
              />
            </motion.div>
          ))}
        </div>

        {filteredJobs.length > 6 && (
          <motion.div
            variants={itemVariants}
            className="text-center mt-8"
          >
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
              View All Similar Jobs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}

// Export for backward compatibility
export default SimilarJobs