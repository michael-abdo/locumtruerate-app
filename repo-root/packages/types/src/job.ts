// Job-related types based on Prisma schema

export enum JobStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  EXPIRED = 'EXPIRED',
  CLOSED = 'CLOSED'
}

export enum JobType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  REMOTE = 'REMOTE',
  INTERNSHIP = 'INTERNSHIP'
}

export enum JobCategory {
  ENGINEERING = 'ENGINEERING',
  DESIGN = 'DESIGN',
  MARKETING = 'MARKETING',
  SALES = 'SALES',
  PRODUCT = 'PRODUCT',
  FINANCE = 'FINANCE',
  HR = 'HR',
  OPERATIONS = 'OPERATIONS',
  OTHER = 'OTHER'
}

export interface Job {
  id: string
  companyId: string
  userId: string
  
  // Job details
  title: string
  slug: string
  location: string
  description: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  salary?: string
  type?: JobType
  category?: JobCategory
  tags: string[]
  
  // Job lifecycle
  status: JobStatus
  publishedAt?: Date
  expiresAt: Date
  viewCount: number
  applicationCount: number
  
  // Auto-renewal settings
  autoRenew: boolean
  renewalDays: number
  maxRenewals: number
  renewalCount: number
  
  // SEO & Analytics
  metaTitle?: string
  metaDescription?: string
  lastViewedAt?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  
  // Relations
  company?: Company
  user?: User
  applications?: Application[]
}

// Simplified job card data
export interface JobCardData {
  id: string
  title: string
  companyName: string
  companyLogo?: string
  location: string
  isRemote: boolean
  salary?: string
  salaryRange?: {
    min: number
    max: number
    currency: string
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  }
  type?: JobType
  category?: JobCategory
  tags: string[]
  specialty?: string
  experienceLevel?: string
  publishedAt: Date
  expiresAt: Date
  isUrgent: boolean
  isFeatured: boolean
  applicationCount: number
  descriptionPreview: string
  viewCount: number
}

// Import related types
import type { Company } from './company'
import type { User } from './user'
import type { Application } from './application'