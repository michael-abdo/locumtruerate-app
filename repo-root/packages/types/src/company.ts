// Company-related types

export interface Company {
  id: string
  organizationId?: string
  ownerId: string
  
  // Company information
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  industry?: string
  size?: string // "1-10", "11-50", "51-200", "201-500", "500+"
  foundedYear?: number
  location?: string
  
  // Enhanced profile
  benefits: string[]
  culture?: string
  techStack: string[]
  socialLinks?: Record<string, string> // { linkedin, twitter, facebook, etc }
  mediaGallery: string[] // Array of image URLs
  
  // Settings
  isPublic: boolean
  isVerified: boolean
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}