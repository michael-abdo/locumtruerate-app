import { Metadata } from 'next'
import { generateSearchSEO } from '@/lib/seo'
import JobSearchClient from './job-search-client'

// Generate metadata for search results SEO
export async function generateMetadata({ searchParams }: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}): Promise<Metadata> {
  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined
  const location = typeof searchParams.location === 'string' ? searchParams.location : undefined
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined
  
  return generateSearchSEO({
    query,
    location,
    category,
    resultCount: 0 // This will be dynamic once search is implemented
  })
}

export default function JobSearchPage() {
  return <JobSearchClient />
}