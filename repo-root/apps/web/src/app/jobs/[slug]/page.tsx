import { Metadata } from 'next'
import JobDetailClient from './client'

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    // In a real implementation, you'd fetch the job data here
    // For now, we'll create a placeholder
    const mockJob = {
      title: 'Emergency Medicine Physician',
      company: { name: 'Metro General Hospital' },
      location: 'New York, NY',
      description: 'Experienced emergency medicine physician needed for busy metropolitan hospital.',
      salaryMin: 350000,
      salaryMax: 450000,
    }

    return {
      title: `${mockJob.title} at ${mockJob.company.name} | LocumTrueRate`,
      description: mockJob.description,
      openGraph: {
        title: `${mockJob.title} at ${mockJob.company.name}`,
        description: mockJob.description,
        url: `https://locumtruerate.com/jobs/${params.slug}`,
        siteName: 'LocumTrueRate',
        locale: 'en_US',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${mockJob.title} at ${mockJob.company.name}`,
        description: mockJob.description,
      },
    }
  } catch (error) {
    return {
      title: 'Job Details | LocumTrueRate',
      description: 'View detailed information about this locum tenens opportunity.',
    }
  }
}

export default function JobDetailPage({ params }: { params: { slug: string } }) {
  return <JobDetailClient params={params} />
}