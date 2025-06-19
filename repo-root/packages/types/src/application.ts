// Application-related types

export enum ApplicationStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  SHORTLISTED = 'SHORTLISTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN'
}

export interface Application {
  id: string
  jobId: string
  userId?: string // Null for guest applications
  
  // Applicant information
  name: string
  email: string
  phone: string
  experience: number // Years of experience
  currentCompany?: string
  currentRole?: string
  expectedSalary?: string
  noticePeriod?: string
  
  // Application content
  resumeUrl?: string
  coverLetter: string
  portfolioUrl?: string
  linkedinUrl?: string
  additionalInfo?: string
  
  // AI Scoring
  score?: number // 0-100
  scoreBreakdown?: Record<string, any> // Detailed scoring criteria
  matchPercentage?: number // Job match percentage
  
  // Status tracking
  status: ApplicationStatus
  reviewedAt?: Date
  reviewedBy?: string
  
  // Metadata
  appliedAt: Date
  updatedAt: Date
  ipAddress?: string
}