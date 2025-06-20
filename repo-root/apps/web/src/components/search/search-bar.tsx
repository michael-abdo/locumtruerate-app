'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { searchQuerySchema, safeTextSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

interface SearchBarProps {
  initialQuery?: string
  initialLocation?: string
  onSearch: (query: string, location: string) => void
  placeholder?: string
  locationPlaceholder?: string
}

const searchFormSchema = z.object({
  query: searchQuerySchema.optional().default(''),
  location: safeTextSchema(0, 100).optional().default('')
})

export function SearchBar({
  initialQuery = '',
  initialLocation = '',
  onSearch,
  placeholder = 'Search jobs...',
  locationPlaceholder = 'Location'
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [errors, setErrors] = useState<{ query?: string; location?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const validated = searchFormSchema.parse({ query, location })
      setErrors({})
      onSearch(validated.query, validated.location)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: { query?: string; location?: string } = {}
        error.errors.forEach((err) => {
          if (err.path[0] === 'query' || err.path[0] === 'location') {
            fieldErrors[err.path[0] as 'query' | 'location'] = err.message
          }
        })
        setErrors(fieldErrors)
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.query ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.query}
              aria-describedby={errors.query ? 'query-error' : undefined}
            />
          </div>
          {errors.query && (
            <p id="query-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.query}
            </p>
          )}
        </div>
        
        <div className="flex-1">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={locationPlaceholder}
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                errors.location ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? 'location-error' : undefined}
            />
          </div>
          {errors.location && (
            <p id="location-error" className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.location}
            </p>
          )}
        </div>
        
        <button
          type="submit"
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Search
        </button>
      </div>
    </form>
  )
}