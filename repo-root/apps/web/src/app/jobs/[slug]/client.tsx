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

// Mock data for demonstration
const mockJob = {
  id: '1',
  slug: 'emergency-medicine-physician-metro-general',
  title: 'Emergency Medicine Physician',
  company: {
    id: '1',
    name: 'Metro General Hospital',
    logo: 'https://placehold.co/100x100',
    rating: 4.5,
    reviewCount: 127,
    verified: true,
  },
  location: 'New York, NY',
  coordinates: { lat: 40.7128, lng: -74.0060 },
  type: 'Full-time',
  specialty: 'Emergency Medicine',
  experience: '3-5 years',
  description: `
    We are seeking an experienced Emergency Medicine Physician to join our dynamic team at Metro General Hospital. 
    This is an excellent opportunity for a dedicated professional looking to make a significant impact in a fast-paced, 
    high-volume emergency department.
    
    As part of our team, you will work alongside skilled healthcare professionals in a state-of-the-art facility, 
    providing critical care to diverse patient populations. Our emergency department handles over 80,000 visits annually 
    and is equipped with the latest medical technology.
  `,
  requirements: [
    'Board certified/eligible in Emergency Medicine',
    'Active medical license in New York State',
    'Current DEA registration',
    'ACLS, PALS, and ATLS certifications',
    'Strong communication and interpersonal skills',
    'Ability to work effectively in a fast-paced environment',
  ],
  benefits: [
    'Competitive hourly rate with performance bonuses',
    'Comprehensive malpractice insurance',
    'Travel and housing stipend',
    'Continuing education allowance',
    'Health, dental, and vision insurance',
    '401(k) with employer matching',
  ],
  salaryMin: 350000,
  salaryMax: 450000,
  postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  duration: '3 months with possibility of extension',
  applicants: 24,
  views: 856,
  tags: ['Emergency Medicine', 'Critical Care', 'Trauma', 'High Volume'],
}

export default function JobDetailClient({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [showApplication, setShowApplication] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showMap, setShowMap] = useState(false)

  // Track job view
  const { trackJobView } = useJobAnalytics()

  // In a real app, fetch job data using slug
  // const { data: job, isLoading } = trpc.jobs.getBySlug.useQuery({ slug: params.slug })

  const job = mockJob // Using mock data for now
  const isLoading = false

  useEffect(() => {
    if (job) {
      trackJobView(job.id)
    }
  }, [job, trackJobView])

  if (isLoading) {
    return <JobDetailPageSkeleton />
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Job not found</h1>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/search/jobs')}>
            Browse Jobs
          </Button>
        </div>
      </div>
    )
  }

  const handleApply = () => {
    setShowApplication(true)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    // In a real app, save to user's saved jobs
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job: ${job.title} at ${job.company.name}`,
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback to copying link
      navigator.clipboard.writeText(window.location.href)
      // Show toast notification
    }
  }

  const formatSalary = (min: number, max: number) => {
    const format = (num: number) => `$${(num / 1000).toFixed(0)}k`
    return `${format(min)} - ${format(max)}`
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return `${Math.floor(diffInDays / 30)} months ago`
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <a href="/search/jobs" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Jobs
            </a>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="text-gray-900 dark:text-white font-medium">{job.specialty}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {job.title}
                    </h1>
                    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                      <a href="#" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                        {job.company.name}
                      </a>
                      {job.company.verified && (
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                      <span>•</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{job.company.rating}</span>
                        <span className="text-gray-500 dark:text-gray-600 ml-1">
                          ({job.company.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    className={cn(
                      "text-gray-600 dark:text-gray-400",
                      isSaved && "text-blue-600 dark:text-blue-400"
                    )}
                  >
                    <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <DollarSign className="h-4 w-4" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>{job.duration}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                    Start Date: {job.startDate.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Posted {getRelativeTime(job.postedAt)} • {job.applicants} applicants • {job.views} views
                  </p>
                </div>
                <Button onClick={handleApply} size="lg">
                  Apply Now
                </Button>
              </div>
            </motion.div>

            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Job Description
              </h2>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-line">{job.description}</p>
              </div>
            </motion.div>

            {/* Requirements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Requirements
              </h2>
              <ul className="space-y-2">
                {job.requirements.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{req}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Benefits
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Location Map */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Location
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMap(!showMap)}
                >
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
              </div>
              {showMap && (
                <JobMap
                  location={job.location}
                  coordinates={job.coordinates}
                  companyName={job.company.name}
                />
              )}
              <div className="mt-4">
                <p className="text-gray-700 dark:text-gray-300">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  {job.location}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-24"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                About {job.company.name}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <img
                    src={job.company.logo}
                    alt={job.company.name}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-5 w-5 text-yellow-500 mr-1" />
                    <span className="font-semibold">{job.company.rating}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      ({job.company.reviewCount} reviews)
                    </span>
                  </div>
                  {job.company.verified && (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span className="text-sm">Verified Employer</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button onClick={handleApply} className="w-full" size="lg">
                    Apply Now
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    {job.applicants} people have applied
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Similar Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12"
        >
          <SimilarJobs
            specialty={job.specialty}
            location={job.location}
            currentJobId={job.id}
          />
        </motion.div>
      </div>

      {/* Application Modal */}
      {showApplication && (
        <ApplicationForm
          job={job}
          onClose={() => setShowApplication(false)}
        />
      )}
    </div>
  )
}