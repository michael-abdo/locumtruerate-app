/**
 * Search and Filter Validation Schemas for LocumTrueRate.com
 * 
 * Validation schemas for search queries, filters, and data retrieval.
 * Prevents SQL injection and ensures safe query construction.
 */

import { z } from 'zod'
import { searchQuerySchema, paginationSchema, dateRangeSchema, usStateSchema, moneySchema, safeTextSchema } from './common'

/**
 * Job search filters validation
 */
export const jobSearchFiltersSchema = z.object({
  query: searchQuerySchema.optional(),
  specialty: z.array(safeTextSchema(2, 50)).max(10).optional(),
  location: z.object({
    city: safeTextSchema(0, 50).optional(),
    state: usStateSchema.optional(),
    zipCode: z.string().regex(/^\d{5}$/).optional(),
    radius: z.number().int().min(0).max(500).optional()
  }).optional(),
  dateRange: dateRangeSchema.optional(),
  rateRange: z.object({
    min: moneySchema.optional(),
    max: moneySchema.optional()
  }).refine(data => {
    if (data.min && data.max) {
      return data.min <= data.max
    }
    return true
  }, 'Minimum rate must be less than maximum').optional(),
  contractType: z.array(z.enum(['hourly', 'daily', 'weekly', 'monthly', 'per_diem'])).optional(),
  duration: z.object({
    min: z.number().int().min(1).max(365).optional(),
    max: z.number().int().min(1).max(365).optional()
  }).refine(data => {
    if (data.min && data.max) {
      return data.min <= data.max
    }
    return true
  }, 'Minimum duration must be less than maximum').optional(),
  facilities: z.array(safeTextSchema(2, 100)).max(10).optional(),
  urgency: z.enum(['all', 'urgent', 'standard']).optional(),
  boosted: z.boolean().optional()
})

/**
 * Locum professional search filters
 */
export const locumSearchFiltersSchema = z.object({
  query: searchQuerySchema.optional(),
  specialty: z.array(safeTextSchema(2, 50)).max(10).optional(),
  experience: z.object({
    min: z.number().int().min(0).max(50).optional(),
    max: z.number().int().min(0).max(50).optional()
  }).refine(data => {
    if (data.min && data.max) {
      return data.min <= data.max
    }
    return true
  }, 'Minimum experience must be less than maximum').optional(),
  availability: z.enum(['immediate', 'within_week', 'within_month', 'planning']).optional(),
  preferredLocation: z.array(usStateSchema).max(10).optional(),
  credentials: z.array(z.enum(['board_certified', 'fellowship', 'dea_license'])).optional(),
  languages: z.array(safeTextSchema(2, 30)).max(10).optional()
})

/**
 * Facility search filters
 */
export const facilitySearchFiltersSchema = z.object({
  query: searchQuerySchema.optional(),
  type: z.array(z.enum([
    'hospital',
    'clinic',
    'urgent_care',
    'private_practice',
    'nursing_home',
    'rehabilitation',
    'mental_health',
    'other'
  ])).optional(),
  location: z.object({
    city: safeTextSchema(0, 50).optional(),
    state: usStateSchema.optional(),
    zipCode: z.string().regex(/^\d{5}$/).optional()
  }).optional(),
  bedCount: z.object({
    min: z.number().int().min(0).optional(),
    max: z.number().int().min(0).optional()
  }).optional(),
  certifications: z.array(z.enum(['jcaho', 'magnet', 'trauma_center'])).optional()
})

/**
 * Advanced search options
 */
export const advancedSearchSchema = z.object({
  searchIn: z.array(z.enum(['title', 'description', 'requirements', 'benefits'])).min(1),
  matchType: z.enum(['all', 'any', 'exact']),
  excludeTerms: z.array(searchQuerySchema).max(5).optional(),
  includeArchived: z.boolean().optional().default(false)
})

/**
 * Sort options validation
 */
export const sortOptionsSchema = z.object({
  field: z.enum([
    'relevance',
    'date_posted',
    'start_date',
    'rate',
    'duration',
    'location',
    'facility_rating'
  ]),
  order: z.enum(['asc', 'desc'])
})

/**
 * Saved search validation
 */
export const savedSearchSchema = z.object({
  name: safeTextSchema(2, 100),
  filters: jobSearchFiltersSchema,
  notifications: z.object({
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    frequency: z.enum(['immediate', 'daily', 'weekly']).default('daily')
  }).optional()
})

/**
 * Search suggestion validation
 */
export const searchSuggestionSchema = z.object({
  query: z.string().min(2).max(50),
  type: z.enum(['specialty', 'location', 'facility', 'skill']),
  limit: z.number().int().min(1).max(20).default(10)
})

/**
 * Autocomplete validation
 */
export const autocompleteSchema = z.object({
  field: z.enum(['specialty', 'city', 'facility', 'skill', 'certification']),
  query: z.string().min(1).max(50),
  context: z.record(z.string()).optional()
})

/**
 * Search analytics tracking
 */
export const searchAnalyticsSchema = z.object({
  query: searchQuerySchema,
  filters: z.record(z.any()),
  resultCount: z.number().int().min(0),
  clickedResults: z.array(z.string()).optional(),
  searchDuration: z.number().positive(),
  sessionId: z.string().uuid()
})

/**
 * Faceted search validation
 */
export const facetedSearchSchema = z.object({
  facets: z.array(z.enum([
    'specialty',
    'location',
    'rate_range',
    'contract_type',
    'facility_type',
    'urgency'
  ])),
  baseFilters: jobSearchFiltersSchema.optional()
})

/**
 * Combined search request validation
 */
export const searchRequestSchema = z.object({
  filters: jobSearchFiltersSchema,
  sort: sortOptionsSchema.optional(),
  pagination: paginationSchema,
  advanced: advancedSearchSchema.optional(),
  facets: z.array(z.string()).optional()
})

export default {
  jobSearchFilters: jobSearchFiltersSchema,
  locumSearchFilters: locumSearchFiltersSchema,
  facilitySearchFilters: facilitySearchFiltersSchema,
  advancedSearch: advancedSearchSchema,
  sortOptions: sortOptionsSchema,
  savedSearch: savedSearchSchema,
  searchSuggestion: searchSuggestionSchema,
  autocomplete: autocompleteSchema,
  searchAnalytics: searchAnalyticsSchema,
  facetedSearch: facetedSearchSchema,
  searchRequest: searchRequestSchema
}