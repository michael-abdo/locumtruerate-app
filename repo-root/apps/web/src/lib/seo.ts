import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  url?: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  section?: string
  tags?: string[]
  noIndex?: boolean
  noFollow?: boolean
}

const defaultSEO = {
  title: 'LocumTrueRate - Healthcare Staffing Platform',
  description: 'Find the perfect locum tenens opportunities with transparent compensation analysis. Compare contracts, calculate true rates, and advance your healthcare career.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com',
  image: '/og-image.png',
  type: 'website' as const,
  keywords: [
    'locum tenens',
    'healthcare jobs',
    'medical staffing',
    'physician jobs',
    'nurse practitioner jobs',
    'healthcare careers',
    'contract calculator',
    'medical contracts'
  ]
}

export function generateSEO(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    url,
    image,
    type = 'website',
    publishedTime,
    modifiedTime,
    authors = [],
    section,
    tags = [],
    noIndex = false,
    noFollow = false
  } = config

  const fullTitle = title === defaultSEO.title ? title : `${title} | LocumTrueRate`
  const fullUrl = url ? `${defaultSEO.url}${url}` : defaultSEO.url
  const fullImage = image ? `${defaultSEO.url}${image}` : `${defaultSEO.url}${defaultSEO.image}`
  const allKeywords = [...defaultSEO.keywords, ...keywords]

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: allKeywords,
    authors: authors.map(name => ({ name })),
    creator: 'LocumTrueRate',
    publisher: 'LocumTrueRate',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(defaultSEO.url),
    alternates: {
      canonical: url || '/',
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: fullUrl,
      siteName: 'LocumTrueRate',
      title: fullTitle,
      description,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(authors.length > 0 && { authors }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      site: '@locumtruerate',
      creator: '@locumtruerate',
      title: fullTitle,
      description,
      images: [fullImage],
    },
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }

  return metadata
}

// Job-specific SEO
export function generateJobSEO(job: {
  title: string
  company: { name: string }
  location: string
  description: string
  category: string
  salaryMin?: number
  salaryMax?: number
  slug: string
  createdAt: string
  updatedAt: string
}): Metadata {
  const salaryRange = job.salaryMin && job.salaryMax 
    ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
    : ''
  
  const description = `${job.title} position at ${job.company.name} in ${job.location}. ${salaryRange ? `Salary: ${salaryRange}. ` : ''}${job.description.substring(0, 120)}...`
  
  return generateSEO({
    title: `${job.title} at ${job.company.name} - ${job.location}`,
    description,
    url: `/jobs/${job.slug}`,
    keywords: [
      job.title.toLowerCase(),
      job.category.toLowerCase(),
      job.location.toLowerCase(),
      job.company.name.toLowerCase(),
      'locum tenens job',
      'healthcare position'
    ],
    type: 'article',
    publishedTime: job.createdAt,
    modifiedTime: job.updatedAt,
    section: 'Jobs',
    tags: [job.category, job.location, 'Healthcare Jobs']
  })
}

// Company-specific SEO
export function generateCompanySEO(company: {
  name: string
  description?: string
  location?: string
  website?: string
  slug: string
  jobCount: number
}): Metadata {
  const description = company.description 
    ? `${company.description.substring(0, 140)}...`
    : `${company.name} is hiring healthcare professionals. ${company.jobCount} open positions available. Find locum tenens opportunities and advance your medical career.`
  
  return generateSEO({
    title: `${company.name} - Healthcare Jobs & Locum Tenens Opportunities`,
    description,
    url: `/companies/${company.slug}`,
    keywords: [
      company.name.toLowerCase(),
      'healthcare employer',
      'medical jobs',
      ...(company.location ? [company.location.toLowerCase()] : [])
    ],
    type: 'profile'
  })
}

// Search results SEO
export function generateSearchSEO({
  query,
  location,
  category,
  resultCount
}: {
  query?: string
  location?: string
  category?: string
  resultCount: number
}): Metadata {
  let title = 'Healthcare Jobs'
  let description = 'Find the perfect locum tenens and healthcare job opportunities'
  
  if (query) {
    title = `${query} Jobs`
    description = `${resultCount} ${query} job opportunities`
  }
  
  if (category) {
    title = `${category} Jobs`
    description = `${resultCount} ${category} positions available`
  }
  
  if (location) {
    title += ` in ${location}`
    description += ` in ${location}`
  }
  
  description += '. Compare compensation, calculate true rates, and find your next healthcare career opportunity.'
  
  const searchParams = new URLSearchParams()
  if (query) searchParams.set('query', query)
  if (location) searchParams.set('location', location)
  if (category) searchParams.set('category', category)
  
  return generateSEO({
    title,
    description,
    url: `/search/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
    keywords: [
      ...(query ? [query.toLowerCase()] : []),
      ...(category ? [category.toLowerCase()] : []),
      ...(location ? [location.toLowerCase()] : []),
      'healthcare jobs search',
      'medical positions'
    ]
  })
}

// Structured data generators
export function generateJobStructuredData(job: {
  title: string
  company: { name: string; logo?: string }
  location: string
  description: string
  salaryMin?: number
  salaryMax?: number
  category: string
  type: string
  url: string
  createdAt: string
  validThrough?: string
}) {
  return {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company.name,
      value: job.url
    },
    datePosted: job.createdAt,
    ...(job.validThrough && { validThrough: job.validThrough }),
    employmentType: job.type,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company.name,
      ...(job.company.logo && { logo: job.company.logo })
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location
      }
    },
    baseSalary: job.salaryMin && job.salaryMax ? {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salaryMin,
        maxValue: job.salaryMax,
        unitText: 'YEAR'
      }
    } : undefined,
    industry: 'Healthcare',
    occupationalCategory: job.category
  }
}

export function generateOrganizationStructuredData(org: {
  name: string
  description?: string
  website?: string
  logo?: string
  location?: string
  phone?: string
  email?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    ...(org.description && { description: org.description }),
    ...(org.website && { url: org.website }),
    ...(org.logo && { logo: org.logo }),
    ...(org.location && {
      address: {
        '@type': 'PostalAddress',
        addressLocality: org.location
      }
    }),
    ...(org.phone && { telephone: org.phone }),
    ...(org.email && { email: org.email }),
    industry: 'Healthcare Staffing',
    sameAs: [
      'https://twitter.com/locumtruerate',
      'https://linkedin.com/company/locumtruerate'
    ]
  }
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${defaultSEO.url}${item.url}`
    }))
  }
}