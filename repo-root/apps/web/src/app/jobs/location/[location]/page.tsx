'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Filter, Briefcase, TrendingUp, Building, Users } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { Breadcrumbs } from '@/components/seo/breadcrumbs'
import { JobCard, JobFilters, Pagination } from '@/components/placeholder'
import { trpc } from '@/providers/trpc-provider'

const locationInfo = {
  'new-york-ny': {
    name: 'New York, NY',
    state: 'New York',
    description: 'Find healthcare jobs in the heart of New York. Top medical centers and hospitals offer excellent opportunities for medical professionals.',
    population: '8.3M',
    hospitals: 62,
    averageSalary: '$385,000',
    jobCount: 2847,
    topSpecialties: ['Emergency Medicine', 'Internal Medicine', 'Surgery']
  },
  'los-angeles-ca': {
    name: 'Los Angeles, CA',
    state: 'California',
    description: 'Healthcare opportunities in sunny California. World-class medical facilities and diverse patient populations.',
    population: '3.9M',
    hospitals: 45,
    averageSalary: '$425,000',
    jobCount: 2156,
    topSpecialties: ['Family Medicine', 'Pediatrics', 'Cardiology']
  },
  'chicago-il': {
    name: 'Chicago, IL',
    state: 'Illinois',
    description: 'Medical positions in the Windy City. Leading academic medical centers and community hospitals.',
    population: '2.7M',
    hospitals: 38,
    averageSalary: '$345,000',
    jobCount: 1923,
    topSpecialties: ['Internal Medicine', 'Emergency Medicine', 'Hospitalist']
  },
  'houston-tx': {
    name: 'Houston, TX',
    state: 'Texas',
    description: 'Healthcare careers in the largest city in Texas. Major medical center with cutting-edge technology.',
    population: '2.3M',
    hospitals: 52,
    averageSalary: '$375,000',
    jobCount: 1834,
    topSpecialties: ['Surgery', 'Critical Care', 'Anesthesiology']
  },
  'phoenix-az': {
    name: 'Phoenix, AZ',
    state: 'Arizona',
    description: 'Growing healthcare opportunities in the desert Southwest. Rapidly expanding medical infrastructure.',
    population: '1.6M',
    hospitals: 28,
    averageSalary: '$365,000',
    jobCount: 1456,
    topSpecialties: ['Family Medicine', 'Internal Medicine', 'Emergency Medicine']
  },
  'philadelphia-pa': {
    name: 'Philadelphia, PA',
    state: 'Pennsylvania',
    description: 'Historic city with modern medical facilities. Home to prestigious medical schools and research centers.',
    population: '1.5M',
    hospitals: 34,
    averageSalary: '$355,000',
    jobCount: 1678,
    topSpecialties: ['Internal Medicine', 'Pediatrics', 'Neurology']
  },
  'dallas-tx': {
    name: 'Dallas, TX',
    state: 'Texas',
    description: 'Major healthcare hub in North Texas. Excellent medical facilities and growing physician demand.',
    population: '1.3M',
    hospitals: 41,
    averageSalary: '$370,000',
    jobCount: 1545,
    topSpecialties: ['Emergency Medicine', 'Family Medicine', 'Surgery']
  },
  'seattle-wa': {
    name: 'Seattle, WA',
    state: 'Washington',
    description: 'Pacific Northwest medical opportunities. Innovation-focused healthcare systems and research institutions.',
    population: '750K',
    hospitals: 23,
    averageSalary: '$395,000',
    jobCount: 987,
    topSpecialties: ['Internal Medicine', 'Psychiatry', 'Family Medicine']
  },
  'denver-co': {
    name: 'Denver, CO',
    state: 'Colorado',
    description: 'Mile-high medical careers with mountain views. Growing healthcare market in beautiful Colorado.',
    population: '715K',
    hospitals: 19,
    averageSalary: '$375,000',
    jobCount: 876,
    topSpecialties: ['Family Medicine', 'Emergency Medicine', 'Internal Medicine']
  },
  'miami-fl': {
    name: 'Miami, FL',
    state: 'Florida',
    description: 'Tropical healthcare opportunities in South Florida. Diverse patient population and growing medical sector.',
    population: '470K',
    hospitals: 25,
    averageSalary: '$365,000',
    jobCount: 1234,
    topSpecialties: ['Internal Medicine', 'Cardiology', 'Emergency Medicine']
  }
}

export default function LocationJobsPage() {
  const params = useParams()
  const router = useRouter()
  const location = params.location as string
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({})
  
  const info = locationInfo[location as keyof typeof locationInfo]
  
  const { data: jobsData, isLoading } = trpc.jobs.getAll.useQuery({
    location: info?.name,
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
              Location Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              The location you're looking for doesn't exist.
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
                { name: 'Locations', url: '/jobs/locations' },
                { name: info.name, url: `/jobs/location/${location}`, current: true }
              ]}
            />
          </div>
        </div>
        
        {/* Location Header */}
        <section className="bg-white dark:bg-gray-800 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex items-center justify-center mb-4">
                <MapPin className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Healthcare Jobs in {info.name}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                {info.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 dark:bg-blue-900/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {info.jobCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Jobs Available</div>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-lg font-bold text-green-900 dark:text-green-100">
                    {info.averageSalary}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Avg Salary</div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Building className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    {info.hospitals}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Hospitals</div>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/30 px-4 py-3 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                    {info.population}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Population</div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Top Specialties in {info.name}
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {info.topSpecialties.map((specialty) => (
                    <Badge key={specialty} variant="outline" className="px-3 py-1">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <Button size="lg" onClick={() => router.push('/search/jobs?location=' + encodeURIComponent(info.name))}>
                Search Jobs in {info.name}
              </Button>
            </motion.div>
          </div>
        </section>
        
        {/* Jobs Listing */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest Positions in {info.name}
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
                <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Jobs Available in {info.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Check back soon for new opportunities in this location.
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
                    onClick={() => router.push(`/search/jobs?location=${encodeURIComponent(info.name)}`)}
                  >
                    View All {info.jobCount.toLocaleString()} Jobs in {info.name}
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