// Common types used across the application

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SearchFilters {
  query?: string
  location?: string
  category?: string[]
  type?: string[]
  salary?: {
    min?: number
    max?: number
  }
  experience?: {
    min?: number
    max?: number
  }
  tags?: string[]
}