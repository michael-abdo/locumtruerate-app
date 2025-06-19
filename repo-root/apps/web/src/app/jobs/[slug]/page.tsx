'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  MapPin, Clock, DollarSign, Star, Bookmark, Share2, 
  Calendar, Users, Building, Stethoscope, AlertCircle,
  CheckCircle, ArrowLeft, ExternalLink
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { SimilarJobs, ApplicationForm, JobMap } from '@/components/jobs'
import { trpc } from '@/providers/trpc-provider'
import { cn } from '@/lib/utils'
import { useJobAnalytics } from '@/hooks/use-analytics'
import { generateJobSEO, generateJobStructuredData } from '@/lib/seo'
import { JobDetailPageSkeleton } from '@/components/skeletons/job-detail-skeleton'
import { Metadata } from 'next'

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    // In a real implementation, you'd fetch the job data here
    // For now, we'll create a placeholder
    const mockJob = {
      title: 'Emergency Medicine Physician',
      company: { name: 'Metro General Hospital' },
      location: 'Dallas, TX',
      description: 'Seeking an experienced Emergency Medicine physician for a busy Level 1 trauma center. Excellent compensation package and benefits.',
      category: 'Emergency Medicine',
      salaryMin: 300000,
      salaryMax: 450000,
      slug: params.slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }\n    
    return generateJobSEO(mockJob)
  } catch (error) {
    return {\n      title: 'Job Not Found | LocumTrueRate',\n      description: 'The requested job posting could not be found.'\n    }\n  }\n}\n\nexport default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [showApplication, setShowApplication] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showMap, setShowMap] = useState(false)
  
  // Analytics
  const { trackJobInteraction, trackJobApplication, trackJobSave, trackJobShare } = useJobAnalytics()

  // API calls
  const { data: job, isLoading, error } = trpc.jobs.getBySlug.useQuery({ slug })
  const { data: similarJobs } = trpc.jobs.getAll.useQuery({
    category: job?.category,
    excludeId: job?.id,
    limit: 3,
    status: 'ACTIVE'
  }, {
    enabled: !!job?.category && !!job?.id
  })
  
  // Track job view when job data loads
  useEffect(() => {
    if (job) {
      trackJobInteraction('view', job.id, job.title, {
        category: job.category,
        location: job.location,
        salaryRange: job.salaryMin && job.salaryMax ? `${job.salaryMin}-${job.salaryMax}` : null
      })
    }
  }, [job, trackJobInteraction])

  const handleApply = () => {
    if (job) {
      trackJobApplication(job.id, job.title, {
        source: 'job_detail_page'
      })
    }
    setShowApplication(true)
  }

  const handleSave = () => {
    if (job) {
      trackJobSave(job.id, job.title, !isSaved)
    }
    setIsSaved(!isSaved)
    // Implement save/unsave job API call
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: job?.description?.substring(0, 100),
          url: window.location.href,
        })
        if (job) {
          trackJobShare(job.id, job.title, 'native_share')
        }
      } catch (err) {
        // Handle sharing error
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      if (job) {
        trackJobShare(job.id, job.title, 'clipboard')
      }
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <JobDetailPageSkeleton />
        </main>
        <Footer />
      </>
    )
  }

  if (error || !job) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Job Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The job you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/search/jobs')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Back Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to search
            </button>
          </div>
        </div>

        {/* Job Header */}
        <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant={job.remote ? 'success' : 'secondary'}>
                      {job.remote ? 'Remote' : 'On-site'}
                    </Badge>
                    <Badge variant="outline">{job.category}</Badge>
                    {job.urgent && (
                      <Badge variant="destructive">Urgent</Badge>
                    )}
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    {job.title}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      <span className="font-medium">{job.company.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>{job.applicationCount || 0} applications</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="flex items-center gap-2 flex-1 sm:flex-none justify-center"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                      className={cn(
                        "flex items-center gap-2 flex-1 sm:flex-none justify-center",
                        isSaved && "text-blue-600 border-blue-300"
                      )}
                    >
                      <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                      <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
                    </Button>
                  </div>
                  <Button 
                    onClick={handleApply} 
                    size="lg" 
                    className="w-full sm:w-auto min-w-[140px]"
                  >
                    Apply Now
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Job Details */}
            <div className="lg:col-span-2 space-y-6 lg:space-y-8">
              {/* Job Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Description
                </h2>
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </motion.div>

              {/* Requirements */}
              {job.requirements && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Requirements
                  </h2>
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                </motion.div>
              )}

              {/* Benefits */}
              {job.benefits && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Benefits & Perks
                  </h2>
                  <div 
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: job.benefits }}
                  />
                </motion.div>
              )}

              {/* Company Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  About {job.company.name}
                </h2>
                <div className="flex items-start gap-4">
                  {job.company.logo && (
                    <img
                      src={job.company.logo}
                      alt={`${job.company.name} logo`}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {job.company.description || 'A leading healthcare organization committed to providing exceptional patient care and professional development opportunities.'}
                    </p>
                    {job.company.website && (
                      <a
                        href={job.company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Visit website
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6 order-first lg:order-last">
              {/* Job Summary */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Job Summary
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Salary Range</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Job Type</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {job.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Experience</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {job.experienceRequired || 'Not specified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start Date</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {job.startDate ? new Date(job.startDate).toLocaleDateString() : 'ASAP'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {job.duration || 'Ongoing'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <Button onClick={handleApply} className="w-full" size="lg">
                      Apply for this position
                    </Button>
                    
                    <button
                      onClick={() => setShowMap(!showMap)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      {showMap ? 'Hide Map' : 'View on Map'}
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Map */}
              {showMap && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 300 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden rounded-lg"
                >
                  <JobMap 
                    jobs={[job]} 
                    onJobSelect={() => {}}
                    height={300}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Jobs */}
        {similarJobs && similarJobs.jobs.length > 0 && (
          <section className="bg-white dark:bg-gray-800 py-8 sm:py-12 lg:py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <SimilarJobs 
                jobs={similarJobs.jobs} 
                currentJobId={job.id}
                onJobSelect={(selectedJob) => {
                  // Navigate to selected job
                  window.location.href = `/jobs/${selectedJob.slug}`
                }}
                onJobApply={(jobId) => {
                  // Handle apply for similar job
                  console.log('Apply to job:', jobId)
                }}
                onJobSave={(jobId, isSaved) => {
                  // Handle save similar job
                  console.log('Save job:', jobId, isSaved)
                }}
                onJobShare={(jobId) => {
                  // Handle share similar job
                  console.log('Share job:', jobId)
                }}
              />
            </div>
          </section>
        )}

        {/* Application Modal */}
        {showApplication && (
          <ApplicationForm
            job={job}
            onClose={() => setShowApplication(false)}
            onSubmit={async (data) => {
              try {
                // Handle application submission
                console.log('Application data:', data)
                // TODO: Implement actual API call
                // await trpc.applications.create.mutate({
                //   jobId: job.id,
                //   ...data
                // })
                setShowApplication(false)
              } catch (error) {
                console.error('Failed to submit application:', error)
                throw error
              }
            }}
            isOpen={showApplication}
          />
        )}
      </main>
      <Footer />
    </>
  )
}