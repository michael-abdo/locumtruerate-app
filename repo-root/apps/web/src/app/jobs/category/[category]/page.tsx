'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Filter, Briefcase, TrendingUp } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JobCard, JobFilters, Pagination } from '@/components/placeholder'
import { trpc } from '@/providers/trpc-provider'
import { generateSEO } from '@/lib/seo'
import { Metadata } from 'next'

const categoryInfo = {
  'emergency-medicine': {
    name: 'Emergency Medicine',
    description: 'Find emergency medicine physician jobs and locum tenens opportunities. High-demand positions in emergency departments across the country.',
    icon: '🚨',
    averageSalary: '$350,000',
    jobCount: 1247
  },
  'family-medicine': {
    name: 'Family Medicine',
    description: 'Family medicine physician positions offering comprehensive primary care opportunities. Join practices focused on preventive care and patient relationships.',
    icon: '👨‍⚕️',
    averageSalary: '$280,000',
    jobCount: 2156
  },
  'internal-medicine': {
    name: 'Internal Medicine',
    description: 'Internal medicine opportunities in hospitals and clinics. Specialize in adult medicine with diverse patient populations.',
    icon: '🩺',
    averageSalary: '$290,000',
    jobCount: 1834
  },
  'pediatrics': {
    name: 'Pediatrics',
    description: 'Pediatric medicine positions caring for infants, children, and adolescents. Make a difference in young lives.',
    icon: '👶',
    averageSalary: '$275,000',
    jobCount: 987
  },
  'psychiatry': {
    name: 'Psychiatry',
    description: 'Mental health physician opportunities. Help patients with psychiatric conditions and behavioral health needs.',
    icon: '🧠',
    averageSalary: '$320,000',
    jobCount: 756
  },
  'anesthesiology': {
    name: 'Anesthesiology',
    description: 'Anesthesiologist positions in surgical departments. Critical care and pain management opportunities.',
    icon: '💊',
    averageSalary: '$420,000',
    jobCount: 543
  },
  'radiology': {
    name: 'Radiology',
    description: 'Diagnostic radiology positions with advanced imaging technology. Remote and on-site opportunities available.',
    icon: '🔬',
    averageSalary: '$450,000',
    jobCount: 432
  },
  'surgery': {
    name: 'Surgery',
    description: 'Surgical positions across multiple specialties. Join leading surgical teams and advance your practice.',
    icon: '⚕️',
    averageSalary: '$480,000',
    jobCount: 623
  },
  'critical-care': {
    name: 'Critical Care',
    description: 'Intensive care unit positions for critically ill patients. High-acuity medicine in ICU environments.',
    icon: '🏥',
    averageSalary: '$380,000',
    jobCount: 398
  },
  'hospitalist': {
    name: 'Hospitalist',
    description: 'Hospital medicine positions focusing on inpatient care. Collaborative environment with multidisciplinary teams.',
    icon: '🏨',
    averageSalary: '$310,000',
    jobCount: 1456
  }
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const category = params.category
  const info = categoryInfo[category as keyof typeof categoryInfo]
  
  if (!info) {
    return {
      title: 'Category Not Found | LocumTrueRate',
      description: 'The requested job category could not be found.'
    }
  }
  
  return generateSEO({
    title: `${info.name} Jobs - Locum Tenens Opportunities`,
    description: `${info.description} ${info.jobCount} ${info.name.toLowerCase()} positions available. Average salary: ${info.averageSalary}.`,
    url: `/jobs/category/${category}`,
    keywords: [
      info.name.toLowerCase(),
      `${info.name.toLowerCase()} jobs`,
      `${info.name.toLowerCase()} physician`,
      `${info.name.toLowerCase()} locum tenens`,
      'healthcare jobs',
      'medical positions'
    ]
  })
}

export default function CategoryJobsPage() {
  const params = useParams()
  const router = useRouter()
  const category = params.category as string
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  
  const info = categoryInfo[category as keyof typeof categoryInfo]
  
  const { data: jobsData, isLoading } = trpc.jobs.getAll.useQuery({
    category: info?.name,
    page,
    limit: 20,
    status: 'ACTIVE',
    ...filters
  }, {
    enabled: !!info
  })
  
  if (!info) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Category Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The job category you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/search/jobs')}>
              Browse All Jobs
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
        {/* Breadcrumbs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumbs
              items={[
                { name: 'Jobs', url: '/search/jobs' },
                { name: info.name, url: `/jobs/category/${category}`, current: true }
              ]}
            />
          </div>
        </div>
        
        {/* Category Header */}
        <section className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">{info.icon}</div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {info.name} Jobs
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                {info.description}
              </p>
              
              <div className="flex flex-wrap justify-center gap-6 mb-8">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                  <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-semibold text-blue-900 dark:text-blue-100">
                    {info.jobCount.toLocaleString()} Jobs
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-4 py-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    Avg: {info.averageSalary}
                  </span>
                </div>
              </div>
              
              <Button size="lg" onClick={() => router.push('/search/jobs?category=' + encodeURIComponent(info.name))}>
                Search {info.name} Jobs
              </Button>
            </motion.div>
          </div>
        </section>
        
        {/* Jobs Listing */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest {info.name} Positions
              </h2>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : jobsData?.jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No {info.name} Jobs Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Check back soon for new opportunities in {info.name.toLowerCase()}.
                </p>
                <Button onClick={() => router.push('/search/jobs')}>
                  Browse All Jobs
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {jobsData?.jobs.slice(0, 6).map((job, index) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <JobCard
                        job={job}
                        onViewDetails={() => router.push(`/jobs/${job.slug}`)}
                      />
                    </motion.div>
                  ))}
                </div>
                
                <div className="text-center">
                  <Button
                    size="lg"
                    onClick={() => router.push(`/search/jobs?category=${encodeURIComponent(info.name)}`)}
                  >
                    View All {info.jobCount.toLocaleString()} {info.name} Jobs
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}