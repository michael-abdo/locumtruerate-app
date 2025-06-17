interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2)
      }}
    />
  )
}

// Convenience components for common structured data types
export function JobStructuredData({ job }: { job: any }) {
  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    identifier: {
      '@type': 'PropertyValue',
      name: job.company?.name,
      value: job.id
    },
    datePosted: job.createdAt,
    validThrough: job.expiresAt,
    employmentType: job.type,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company?.name,
      logo: job.company?.logo
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

  return <StructuredData data={structuredData} />
}

export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`
    }))
  }

  return <StructuredData data={structuredData} />
}

export function OrganizationStructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LocumTrueRate',
    description: 'Healthcare staffing platform connecting medical professionals with locum tenens opportunities',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://locumtruerate.com'}/logo.png`,
    industry: 'Healthcare Staffing',
    foundingDate: '2024',
    sameAs: [
      'https://twitter.com/locumtruerate',
      'https://linkedin.com/company/locumtruerate'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@locumtruerate.com'
    }
  }

  return <StructuredData data={structuredData} />
}