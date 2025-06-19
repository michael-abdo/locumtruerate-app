// Demo file showcasing JobCard usage
import React from 'react'
import { JobCard } from './job-card'
import type { JobCardData } from '@locumtruerate/types'

// Sample job data for demonstration
const sampleJobs: JobCardData[] = [
  {
    id: '1',
    title: 'Emergency Medicine Physician',
    companyName: 'St. Mary\'s Hospital',
    companyLogo: '/placeholder-hospital-logo.png',
    location: 'Chicago, IL',
    isRemote: false,
    salaryRange: {
      min: 300,
      max: 400,
      currency: 'USD',
      period: 'hourly'
    },
    type: 'CONTRACT',
    category: 'OTHER',
    tags: ['Emergency Medicine', 'Night Shifts', 'Level 1 Trauma'],
    specialty: 'Emergency Medicine',
    experienceLevel: '5+ years',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    isUrgent: true,
    isFeatured: false,
    applicationCount: 12,
    descriptionPreview: 'Seeking experienced Emergency Medicine physician for immediate placement at Level 1 trauma center. Must be board certified with active state license.',
    viewCount: 234
  },
  {
    id: '2',
    title: 'Hospitalist - Nocturnist',
    companyName: 'Regional Medical Center',
    location: 'Denver, CO',
    isRemote: false,
    salary: '$250K - $300K/year',
    type: 'FULL_TIME',
    category: 'OTHER',
    tags: ['Internal Medicine', 'Hospitalist', 'Nocturnist', '7 on/7 off'],
    specialty: 'Internal Medicine',
    experienceLevel: '3+ years',
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    isUrgent: false,
    isFeatured: true,
    applicationCount: 8,
    descriptionPreview: 'Join our hospitalist team in a 7 on/7 off schedule. Competitive compensation with full benefits package including malpractice coverage.',
    viewCount: 156
  },
  {
    id: '3',
    title: 'Telemedicine Psychiatrist',
    companyName: 'TeleHealth Solutions',
    location: 'Nationwide',
    isRemote: true,
    salaryRange: {
      min: 150,
      max: 200,
      currency: 'USD',
      period: 'hourly'
    },
    type: 'PART_TIME',
    category: 'OTHER',
    tags: ['Psychiatry', 'Telemedicine', 'Flexible Schedule', 'Work from Home'],
    specialty: 'Psychiatry',
    experienceLevel: '2+ years',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isUrgent: false,
    isFeatured: false,
    applicationCount: 45,
    descriptionPreview: 'Remote psychiatrist position with flexible scheduling. Provide mental health services via our secure telehealth platform. Set your own hours.',
    viewCount: 512
  }
]

// Demo component showcasing different states and interactions
export function JobCardDemo() {
  const handleApply = (jobId: string) => {
    console.log('Apply clicked for job:', jobId)
    // In real app, would navigate to application form
  }
  
  const handleSave = (jobId: string, isSaved: boolean) => {
    console.log('Job', jobId, isSaved ? 'saved' : 'unsaved')
    // In real app, would update saved jobs in user profile
  }
  
  const handleShare = (jobId: string) => {
    console.log('Share clicked for job:', jobId)
    // Fallback share implementation if native share not available
  }
  
  return (
    <div className="space-y-6 p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">JobCard Component Demo</h2>
      
      {/* Mobile view simulation */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mobile View (max-width: 640px)</h3>
        <div className="max-w-sm mx-auto space-y-4">
          {sampleJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              onSave={handleSave}
              onShare={handleShare}
            />
          ))}
        </div>
      </div>
      
      {/* Loading state */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Loading State</h3>
        <JobCard
          job={sampleJobs[0]}
          isLoading={true}
          onApply={handleApply}
          onSave={handleSave}
          onShare={handleShare}
        />
      </div>
      
      {/* Tablet/Desktop view */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Desktop View</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sampleJobs.slice(0, 2).map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              onSave={handleSave}
              onShare={handleShare}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Usage in a list view
export function JobListDemo() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Available Positions</h2>
      
      {/* Job list with proper spacing for mobile */}
      <div className="space-y-4">
        {sampleJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onApply={(id) => console.log('Apply:', id)}
            onSave={(id, saved) => console.log('Save:', id, saved)}
            onShare={(id) => console.log('Share:', id)}
          />
        ))}
      </div>
    </div>
  )
}