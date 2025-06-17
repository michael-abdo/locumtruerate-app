'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, MapPin, DollarSign, Briefcase, Clock, 
  Filter, X, ChevronDown, Home, Calendar, Star
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { trpc } from '@/providers/trpc-provider'
import { debounce } from '@/lib/utils'

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export interface SearchFilters {
  query?: string
  location?: string
  category?: string
  type?: string
  salaryMin?: number
  salaryMax?: number
  remote?: boolean
  urgent?: boolean
  specialties?: string[]
  startDate?: string
  duration?: string
}

const categories = [
  'Emergency Medicine',
  'Family Medicine',
  'Internal Medicine',
  'Pediatrics',
  'Psychiatry',
  'Anesthesiology',
  'Radiology',
  'Surgery',
  'Critical Care',
  'Hospitalist'
]

const jobTypes = [
  { value: 'LOCUM', label: 'Locum Tenens' },
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'TEMPORARY', label: 'Temporary' }
]

const durations = [
  '1-2 weeks',
  '1 month',
  '3 months',
  '6 months',
  '12+ months',
  'Ongoing'
]

export function AdvancedSearch({ onSearch, initialFilters = {} }: AdvancedSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get search suggestions
  const { mutate: getSuggestions } = trpc.search.suggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data)
      setShowSuggestions(true)
    }
  })

  // Debounced search suggestions
  const debouncedGetSuggestions = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        getSuggestions({ query, type: 'jobs' })
      } else {
        setShowSuggestions(false)
      }
    }, 300),
    []
  )

  const handleSearch = () => {
    // Update URL params
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        if (Array.isArray(value)) {
          params.set(key, value.join(','))
        } else {
          params.set(key, String(value))
        }
      }
    })
    
    router.push(`/search/jobs?${params.toString()}`)
    onSearch(filters)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({})
    onSearch({})
    router.push('/search/jobs')
  }

  const activeFilterCount = Object.values(filters).filter(
    v => v !== undefined && v !== '' && v !== false && (!Array.isArray(v) || v.length > 0)
  ).length

  return (
    <div className="relative w-full">
      {/* Main Search Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Query Input */}
          <div className="flex-1 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search jobs, specialties, or keywords..."
                value={filters.query || ''}
                onChange={(e) => {
                  setFilters({ ...filters, query: e.target.value })
                  debouncedGetSuggestions(e.target.value)
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            {/* Search Suggestions */}
            <AnimatePresence>
              {showSuggestions && suggestions && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-auto"
                >
                  {suggestions.jobs && suggestions.jobs.length > 0 && (
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Jobs</p>
                      {suggestions.jobs.map((job: any) => (
                        <button
                          key={job.id}
                          onClick={() => {
                            router.push(`/jobs/${job.id}`)
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {job.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {job.company}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {suggestions.locations && suggestions.locations.length > 0 && (
                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-2">Locations</p>
                      {suggestions.locations.map((location: string) => (
                        <button
                          key={location}
                          onClick={() => {
                            setFilters({ ...filters, location })
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                        >
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{location}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location Input */}
          <div className="flex-1 lg:max-w-xs relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Location"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Advanced Filters
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <Label htmlFor="category">Specialty</Label>
                <select
                  id="category"
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Specialties</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Job Type */}
              <div>
                <Label htmlFor="type">Job Type</Label>
                <select
                  id="type"
                  value={filters.type || ''}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  {jobTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Duration</Label>
                <select
                  id="duration"
                  value={filters.duration || ''}
                  onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Any Duration</option>
                  {durations.map(dur => (
                    <option key={dur} value={dur}>{dur}</option>
                  ))}
                </select>
              </div>

              {/* Salary Range */}
              <div className="lg:col-span-2">
                <Label>Salary Range</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.salaryMin || ''}
                    onChange={(e) => setFilters({ ...filters, salaryMin: parseInt(e.target.value) || undefined })}
                  />
                  <span className="self-center text-gray-500">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.salaryMax || ''}
                    onChange={(e) => setFilters({ ...filters, salaryMax: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>

              {/* Start Date */}
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Toggle Options */}
            <div className="flex flex-wrap gap-4 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.remote || false}
                  onChange={(e) => setFilters({ ...filters, remote: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Remote positions</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.urgent || false}
                  onChange={(e) => setFilters({ ...filters, urgent: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Urgent openings</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <Button variant="ghost" onClick={clearFilters}>
                Clear All
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSearch}>
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}