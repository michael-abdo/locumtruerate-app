import { MetadataRoute } from 'next'
import { db } from '@locumtruerate/database'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/search/jobs`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/calculator`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  try {
    // Get active jobs
    const jobs = await db.job.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10000 // Limit to prevent huge sitemaps
    })

    const jobPages = jobs.map(job => ({
      url: `${baseUrl}/jobs/${job.slug}`,
      lastModified: job.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Get companies with jobs
    const companies = await db.company.findMany({
      where: {
        jobs: {
          some: {
            status: 'ACTIVE',
            deletedAt: null
          }
        }
      },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 1000
    })

    const companyPages = companies.map(company => ({
      url: `${baseUrl}/companies/${company.slug}`,
      lastModified: company.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // Category pages
    const categories = [
      'emergency-medicine',
      'family-medicine', 
      'internal-medicine',
      'pediatrics',
      'psychiatry',
      'anesthesiology',
      'radiology',
      'surgery',
      'critical-care',
      'hospitalist'
    ]

    const categoryPages = categories.map(category => ({
      url: `${baseUrl}/jobs/category/${category}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Location pages (major cities)
    const locations = [
      'new-york-ny',
      'los-angeles-ca',
      'chicago-il',
      'houston-tx',
      'phoenix-az',
      'philadelphia-pa',
      'san-antonio-tx',
      'san-diego-ca',
      'dallas-tx',
      'san-jose-ca',
      'austin-tx',
      'jacksonville-fl',
      'fort-worth-tx',
      'columbus-oh',
      'charlotte-nc',
      'san-francisco-ca',
      'indianapolis-in',
      'seattle-wa',
      'denver-co',
      'washington-dc'
    ]

    const locationPages = locations.map(location => ({
      url: `${baseUrl}/jobs/location/${location}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    return [
      ...staticPages,
      ...jobPages,
      ...companyPages,
      ...categoryPages,
      ...locationPages
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Return static pages only if database query fails
    return staticPages
  }
}