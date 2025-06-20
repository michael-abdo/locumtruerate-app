'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { JobType, JobCategory } from '@locumtruerate/types'
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Building,
  Users,
  Calendar,
  Star,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Settings
} from 'lucide-react'
import { z } from 'zod'
import { safeTextSchema, searchQuerySchema } from '@/lib/validation/schemas'
import { safeParse } from '@/lib/validation/apply-validation'

// Validation schema for job filters
const jobFiltersSchema = z.object({
  // Basic filters
  location: safeTextSchema(0, 100).optional(),
  remote: z.enum(['remote', 'onsite', 'hybrid', '']).optional(),
  specialty: safeTextSchema(0, 100).optional(),
  experience: z.enum(['entry', 'mid', 'senior', 'executive', '']).optional(),
  jobType: z.union([
    z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE', 'INTERNSHIP']),
    z.literal('')
  ]).optional(),
  
  // Salary range validation
  salaryMin: z.number().min(0).max(10000000).optional(),
  salaryMax: z.number().min(0).max(10000000).optional(),
  salaryCurrency: z.enum(['USD', 'CAD', 'EUR', 'GBP']).optional().default('USD'),
  salaryPeriod: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']).optional().default('yearly'),
  
  // Date filters
  datePosted: z.enum(['24h', '3d', '7d', '30d', '']).optional(),
  
  // Company filters
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise', '']).optional(),
  
  // Benefits - limit array size and validate each item
  benefits: z.array(safeTextSchema(1, 50)).max(20).optional(),
  
  // Boolean flags
  urgent: z.boolean().optional(),
  featured: z.boolean().optional()
}).refine((data) => {
  // Custom validation: salaryMin should be less than salaryMax
  if (data.salaryMin && data.salaryMax && data.salaryMin > data.salaryMax) {
    return false
  }
  return true
}, {
  message: "Minimum salary cannot be greater than maximum salary"
})

// Filter interfaces extending the existing SearchFilters pattern
export interface JobFiltersState {
  // Basic filters
  location?: string
  remote?: 'remote' | 'onsite' | 'hybrid' | ''
  specialty?: string
  experience?: 'entry' | 'mid' | 'senior' | 'executive' | ''
  jobType?: JobType | ''
  
  // Salary range
  salaryMin?: number
  salaryMax?: number
  salaryCurrency?: 'USD' | 'CAD' | 'EUR' | 'GBP'
  salaryPeriod?: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  
  // Date and time filters
  datePosted?: '24h' | '3d' | '7d' | '30d' | ''
  
  // Company filters
  companySize?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | ''
  
  // Benefits and perks
  benefits?: string[]
  
  // Boolean flags
  urgent?: boolean
  featured?: boolean
}

interface JobFiltersProps {
  initialFilters?: JobFiltersState
  onFiltersChange: (filters: JobFiltersState) => void
  onApply?: (filters: JobFiltersState) => void
  className?: string
  // Mobile-specific props
  isMobile?: boolean
  showAsBottomSheet?: boolean
  isOpen?: boolean
  onClose?: () => void
}

// Static data for filter options
const SPECIALTIES = [
  'Emergency Medicine',
  'Family Medicine', 
  'Internal Medicine',
  'Pediatrics',
  'Psychiatry',
  'Anesthesiology',
  'Radiology',
  'Surgery',
  'Critical Care',
  'Hospitalist',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Ophthalmology',
  'Pathology',
  'Pulmonology'
]

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },  
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'REMOTE', label: 'Remote' },
  { value: 'INTERNSHIP', label: 'Internship' }
] as const

const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior Level (6-10 years)' },
  { value: 'executive', label: 'Executive (10+ years)' }
] as const

const REMOTE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' }
] as const

const DATE_POSTED_OPTIONS = [
  { value: '24h', label: 'Last 24 hours' },
  { value: '3d', label: 'Last 3 days' },
  { value: '7d', label: 'Last week' },
  { value: '30d', label: 'Last month' }
] as const

const COMPANY_SIZES = [
  { value: 'startup', label: 'Startup (1-10)' },
  { value: 'small', label: 'Small (11-50)' },
  { value: 'medium', label: 'Medium (51-200)' },
  { value: 'large', label: 'Large (201-1000)' },
  { value: 'enterprise', label: 'Enterprise (1000+)' }
] as const

const BENEFITS_OPTIONS = [
  'Health Insurance',
  'Dental Insurance',
  'Vision Insurance',
  'Retirement Plan',
  'Paid Time Off',
  'Flexible Schedule',
  'Remote Work',
  'Professional Development',
  'Continuing Education',
  'Malpractice Insurance',
  'Relocation Assistance',
  'Signing Bonus',
  'Housing Stipend',
  'Travel Reimbursement'
]

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Custom hook for URL sync
function useUrlSync(filters: JobFiltersState, onFiltersChange: (filters: JobFiltersState) => void) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize filters from URL on mount
  useEffect(() => {
    const urlFilters: JobFiltersState = {}
    
    // Parse URL parameters
    const location = searchParams.get('location')
    const remote = searchParams.get('remote') as JobFiltersState['remote']
    const specialty = searchParams.get('specialty')
    const experience = searchParams.get('experience') as JobFiltersState['experience']
    const jobType = searchParams.get('jobType') as JobType
    const salaryMin = searchParams.get('salaryMin')
    const salaryMax = searchParams.get('salaryMax')
    const datePosted = searchParams.get('datePosted') as JobFiltersState['datePosted']
    const companySize = searchParams.get('companySize') as JobFiltersState['companySize']
    const benefits = searchParams.get('benefits')
    const urgent = searchParams.get('urgent')
    const featured = searchParams.get('featured')
    
    if (location) urlFilters.location = location
    if (remote) urlFilters.remote = remote
    if (specialty) urlFilters.specialty = specialty
    if (experience) urlFilters.experience = experience
    if (jobType) urlFilters.jobType = jobType
    if (salaryMin) urlFilters.salaryMin = parseInt(salaryMin)
    if (salaryMax) urlFilters.salaryMax = parseInt(salaryMax)
    if (datePosted) urlFilters.datePosted = datePosted
    if (companySize) urlFilters.companySize = companySize
    if (benefits) urlFilters.benefits = benefits.split(',')
    if (urgent) urlFilters.urgent = urgent === 'true'
    if (featured) urlFilters.featured = featured === 'true'
    
    onFiltersChange(urlFilters)
  }, [searchParams, onFiltersChange])
  
  // Update URL when filters change
  const updateUrl = useCallback((newFilters: JobFiltersState) => {
    const params = new URLSearchParams()
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        if (Array.isArray(value) && value.length > 0) {
          params.set(key, value.join(','))
        } else if (typeof value === 'boolean' && value) {
          params.set(key, 'true')
        } else if (typeof value === 'string' || typeof value === 'number') {
          params.set(key, String(value))
        }
      }
    })
    
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname
    router.replace(newUrl, { scroll: false })
  }, [router])
  
  return updateUrl
}

export function JobFilters({
  initialFilters = {},
  onFiltersChange,
  onApply,
  className,
  isMobile = false,
  showAsBottomSheet = false,
  isOpen = true,
  onClose
}: JobFiltersProps) {
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    location: true,
    salary: false,
    experience: false,
    company: false,
    benefits: false,
    other: false
  })
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  
  // Debounced filters for performance
  const debouncedFilters = useDebounce(filters, 300)
  
  // URL synchronization
  const updateUrl = useUrlSync(filters, setFilters)
  
  // Update parent component when filters change
  useEffect(() => {
    onFiltersChange(debouncedFilters)
    updateUrl(debouncedFilters)
  }, [debouncedFilters, onFiltersChange, updateUrl])
  
  // Location autocomplete simulation (would integrate with real API)
  const handleLocationSearch = useCallback((query: string) => {
    if (query.length >= 2) {
      // Simulate API call for location suggestions
      const mockSuggestions = [
        'New York, NY',
        'Los Angeles, CA', 
        'Chicago, IL',
        'Houston, TX',
        'Phoenix, AZ',
        'Philadelphia, PA',
        'San Antonio, TX',
        'San Diego, CA',
        'Dallas, TX',
        'San Jose, CA'
      ].filter(location => 
        location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
      
      setLocationSuggestions(mockSuggestions)
      setShowLocationSuggestions(true)
    } else {
      setShowLocationSuggestions(false)
      setLocationSuggestions([])
    }
  }, [])
  
  // Handle filter updates
  const updateFilter = useCallback(<K extends keyof JobFiltersState>(
    key: K, 
    value: JobFiltersState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])
  
  // Toggle expanded sections
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }, [])
  
  // Handle benefit toggle
  const toggleBenefit = useCallback((benefit: string) => {
    setFilters(prev => {
      const benefits = prev.benefits || []
      const newBenefits = benefits.includes(benefit)
        ? benefits.filter(b => b !== benefit)
        : [...benefits, benefit]
      return { ...prev, benefits: newBenefits }
    })
  }, [])
  
  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setFilters({})
    updateUrl({})
  }, [updateUrl])
  
  // Handle apply (mobile)
  const handleApply = useCallback(() => {
    onApply?.(filters)
    onClose?.()
  }, [filters, onApply, onClose])
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((count, value) => {
      if (value === undefined || value === '' || value === false) return count
      if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0)
      return count + 1
    }, 0)
  }, [filters])
  
  // Generate quick filter chips for common combinations
  const quickFilters = useMemo(() => [
    { 
      label: 'Remote', 
      active: filters.remote === 'remote',
      onClick: () => updateFilter('remote', filters.remote === 'remote' ? '' : 'remote')
    },
    { 
      label: 'Urgent', 
      active: filters.urgent === true,
      onClick: () => updateFilter('urgent', !filters.urgent)
    },
    { 
      label: 'Featured', 
      active: filters.featured === true,
      onClick: () => updateFilter('featured', !filters.featured)
    },
    { 
      label: 'Full-time', 
      active: filters.jobType === 'FULL_TIME',
      onClick: () => updateFilter('jobType', filters.jobType === 'FULL_TIME' ? '' : 'FULL_TIME')
    }
  ], [filters, updateFilter])
  
  // Custom slider component for salary range
  const SalaryRangeSlider = ({ min, max, value, onChange }: {
    min: number
    max: number
    value: [number, number]
    onChange: (value: [number, number]) => void
  }) => {
    const [localValue, setLocalValue] = useState(value)
    
    useEffect(() => {
      setLocalValue(value)
    }, [value])
    
    const handleChange = (index: 0 | 1, newValue: number) => {
      const newRange: [number, number] = [...localValue]
      newRange[index] = newValue
      
      // Ensure min <= max
      if (index === 0 && newRange[0] > newRange[1]) {
        newRange[1] = newRange[0]
      } else if (index === 1 && newRange[1] < newRange[0]) {
        newRange[0] = newRange[1]
      }
      
      setLocalValue(newRange)
      onChange(newRange)
    }
    
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Label className="text-xs">Min Salary</Label>
            <Input
              type="number"
              value={localValue[0] || ''}
              onChange={(e) => handleChange(0, parseInt(e.target.value) || min)}
              placeholder="0"
              className="text-sm"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Max Salary</Label>
            <Input
              type="number"
              value={localValue[1] || ''}
              onChange={(e) => handleChange(1, parseInt(e.target.value) || max)}
              placeholder="500000"
              className="text-sm"
            />
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          ${(localValue[0] || 0).toLocaleString()} - ${(localValue[1] || max).toLocaleString()} per year
        </div>
      </div>
    )
  }
  
  // Filter section component
  const FilterSection = ({ 
    title, 
    icon: Icon, 
    sectionKey, 
    children, 
    collapsible = true 
  }: {
    title: string
    icon: React.ComponentType<{ className?: string }>
    sectionKey: string
    children: React.ReactNode
    collapsible?: boolean
  }) => (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => collapsible && toggleSection(sectionKey)}
        className={cn(
          "w-full flex items-center justify-between p-4 text-left",
          "hover:bg-gray-50 transition-colors",
          "touch-target",
          !collapsible && "cursor-default"
        )}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-600" />
          <span className="font-medium">{title}</span>
        </div>
        {collapsible && (
          expandedSections[sectionKey] ? 
            <ChevronUp className="w-5 h-5 text-gray-400" /> :
            <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {(!collapsible || expandedSections[sectionKey]) && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
  
  const filterContent = (
    <div className="space-y-0">
      {/* Quick Filters */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium">Quick Filters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter, index) => (
            <button
              key={index}
              onClick={filter.onClick}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-all",
                "touch-target",
                filter.active 
                  ? "bg-blue-100 text-blue-700 border border-blue-200" 
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Location */}
      <FilterSection
        title="Location & Remote"
        icon={MapPin}
        sectionKey="location" 
        collapsible={!isMobile}
      >
        <div className="space-y-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Enter city, state, or zip code"
              value={filters.location || ''}
              onChange={(e) => {
                updateFilter('location', e.target.value)
                handleLocationSearch(e.target.value)
              }}
              onFocus={() => filters.location && handleLocationSearch(filters.location)}
              className="w-full"
            />
            
            {/* Location suggestions */}
            {showLocationSuggestions && locationSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      updateFilter('location', suggestion)
                      setShowLocationSuggestions(false)
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 touch-target"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Work Arrangement</Label>
            <div className="grid grid-cols-3 gap-2">
              {REMOTE_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => updateFilter('remote', 
                    filters.remote === option.value ? '' : option.value
                  )}
                  className={cn(
                    "p-2 text-sm rounded-lg border transition-all touch-target",
                    filters.remote === option.value
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>
      
      {/* Salary Range */}
      <FilterSection title="Salary Range" icon={DollarSign} sectionKey="salary">
        <SalaryRangeSlider
          min={0}
          max={500000}
          value={[filters.salaryMin || 0, filters.salaryMax || 500000]}
          onChange={([min, max]) => {
            updateFilter('salaryMin', min)
            updateFilter('salaryMax', max)
          }}
        />
      </FilterSection>
      
      {/* Experience & Job Type */}
      <FilterSection title="Experience & Job Type" icon={Briefcase} sectionKey="experience">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Experience Level</Label>
            <div className="grid grid-cols-1 gap-2">
              {EXPERIENCE_LEVELS.map(level => (
                <button
                  key={level.value}
                  onClick={() => updateFilter('experience',
                    filters.experience === level.value ? '' : level.value
                  )}
                  className={cn(
                    "p-3 text-sm text-left rounded-lg border transition-all touch-target",
                    filters.experience === level.value
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium mb-2 block">Job Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {JOB_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => updateFilter('jobType',
                    filters.jobType === type.value ? '' : type.value
                  )}
                  className={cn(
                    "p-2 text-sm rounded-lg border transition-all touch-target",
                    filters.jobType === type.value
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label htmlFor="specialty" className="text-sm font-medium mb-2 block">Medical Specialty</Label>
            <select
              id="specialty"
              value={filters.specialty || ''}
              onChange={(e) => updateFilter('specialty', e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg bg-white text-gray-900 text-sm touch-target"
            >
              <option value="">All Specialties</option>
              {SPECIALTIES.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterSection>
      
      {/* Date Posted */}
      <FilterSection title="Date Posted" icon={Calendar} sectionKey="date">
        <div className="grid grid-cols-2 gap-2">
          {DATE_POSTED_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => updateFilter('datePosted',
                filters.datePosted === option.value ? '' : option.value
              )}
              className={cn(
                "p-2 text-sm rounded-lg border transition-all touch-target",
                filters.datePosted === option.value
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </FilterSection>
      
      {/* Company Size */}
      <FilterSection title="Company Size" icon={Building} sectionKey="company">
        <div className="grid grid-cols-1 gap-2">
          {COMPANY_SIZES.map(size => (
            <button
              key={size.value}
              onClick={() => updateFilter('companySize',
                filters.companySize === size.value ? '' : size.value
              )}
              className={cn(
                "p-2 text-sm text-left rounded-lg border transition-all touch-target",
                filters.companySize === size.value
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              )}
            >
              {size.label}
            </button>
          ))}
        </div>
      </FilterSection>
      
      {/* Benefits */}
      <FilterSection title="Benefits & Perks" icon={Star} sectionKey="benefits">
        <div className="grid grid-cols-2 gap-2">
          {BENEFITS_OPTIONS.map(benefit => {
            const isSelected = filters.benefits?.includes(benefit) || false
            return (
              <button
                key={benefit}
                onClick={() => toggleBenefit(benefit)}
                className={cn(
                  "p-2 text-xs text-left rounded-lg border transition-all touch-target",
                  isSelected
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                )}
              >
                {benefit}
              </button>
            )
          })}
        </div>
      </FilterSection>
    </div>
  )
  
  // Mobile bottom sheet
  if (showAsBottomSheet) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
        
        {/* Bottom Sheet */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-xl transform transition-transform duration-300 lg:hidden",
          isOpen ? "translate-y-0" : "translate-y-full",
          "max-h-[85vh] overflow-hidden flex flex-col"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full touch-target"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {filterContent}
          </div>
          
          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors touch-target"
              >
                Clear All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors touch-target"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }
  
  // Desktop sidebar
  return (
    <Card className={cn("w-full max-w-sm", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {filterContent}
      </CardContent>
    </Card>
  )
}

// Export filter state type for use in parent components
export type { JobFiltersState }