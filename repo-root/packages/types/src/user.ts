// User-related types

export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYER = 'EMPLOYER',
  CANDIDATE = 'CANDIDATE',
  SYSTEM = 'SYSTEM'
}

export interface User {
  id: string
  email: string
  role: UserRole
  
  // Profile information
  companyName?: string
  contactName: string
  phoneNumber?: string
  avatarUrl?: string
  bio?: string
  
  // Authentication & Security
  emailVerified?: Date
  lastLoginAt?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}