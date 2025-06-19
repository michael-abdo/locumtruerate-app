'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Navigation, 
  ZoomIn, 
  ZoomOut, 
  Layers,
  ExternalLink,
  Building,
  DollarSign,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Job } from '@locumtruerate/types'

interface JobMapProps {
  jobs: Job[]
  selectedJobId?: string
  onJobSelect?: (job: Job) => void
  height?: number
  className?: string
  showControls?: boolean
  showJobPins?: boolean
  interactive?: boolean
}

interface MapPin {
  id: string
  job: Job
  lat: number
  lng: number
  x: number
  y: number
}

// Mock coordinate generator for demonstration
const generateMockCoordinates = (location: string): { lat: number; lng: number } => {
  // Simple hash function to generate consistent coordinates from location
  let hash = 0
  for (let i = 0; i < location.length; i++) {
    const char = location.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  // Generate coordinates within reasonable bounds (continental US)
  const lat = 39.8 + (Math.abs(hash % 1000) / 1000) * 8 - 4  // ~35.8 to 43.8
  const lng = -98.5 + (Math.abs((hash >> 10) % 1000) / 1000) * 20 - 10  // ~-108.5 to -88.5
  
  return { lat, lng }
}

// Convert lat/lng to pixel coordinates within the map container
const coordinatesToPixels = (lat: number, lng: number, width: number, height: number) => {
  // Simple projection (not geographically accurate, but good for demo)
  const x = ((lng + 125) / 50) * width  // Normalize longitude range
  const y = ((50 - lat) / 15) * height  // Normalize latitude range
  
  return { x: Math.max(20, Math.min(width - 20, x)), y: Math.max(20, Math.min(height - 20, y)) }
}

export function JobMap({ 
  jobs, 
  selectedJobId,
  onJobSelect,
  height = 400,
  className,
  showControls = true,
  showJobPins = true,
  interactive = true
}: JobMapProps) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap')
  const [hoveredJobId, setHoveredJobId] = useState<string | null>(null)

  // Generate map pins from jobs
  const mapPins = useMemo((): MapPin[] => {
    const containerWidth = 800 // Default container width
    const containerHeight = height
    
    return jobs.map(job => {
      const coords = generateMockCoordinates(job.location)
      const pixels = coordinatesToPixels(coords.lat, coords.lng, containerWidth, containerHeight)
      
      return {
        id: job.id,
        job,
        lat: coords.lat,
        lng: coords.lng,
        x: pixels.x,
        y: pixels.y
      }
    })
  }, [jobs, height])

  const handlePinClick = useCallback((pin: MapPin) => {
    if (interactive && onJobSelect) {
      onJobSelect(pin.job)
    }
  }, [interactive, onJobSelect])

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5))
  }, [])

  const selectedPin = mapPins.find(pin => pin.id === selectedJobId)
  const hoveredPin = mapPins.find(pin => pin.id === hoveredJobId)

  const mapBackgroundClass = {
    roadmap: 'bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30',
    satellite: 'bg-gradient-to-br from-green-800 to-blue-900',
    terrain: 'bg-gradient-to-br from-amber-100 to-green-200 dark:from-amber-900/30 dark:to-green-900/30'
  }

  return (
    <div className={cn("relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden", className)}>
      {/* Map Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10 space-y-2">
          {/* Zoom Controls */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border-b border-gray-200 dark:border-gray-700 rounded-t-lg"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-b-lg"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Map Type Selector */}
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg">
            <button
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : mapType === 'satellite' ? 'terrain' : 'roadmap')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
              aria-label="Change map type"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div 
        className={cn(
          "relative w-full transition-transform duration-300 ease-out",
          mapBackgroundClass[mapType]
        )}
        style={{ 
          height: `${height}px`,
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center'
        }}
      >
        {/* Mock Map Grid */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" className="text-gray-600 dark:text-gray-400">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Mock Roads/Routes */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <path 
            d="M 50 50 Q 200 100 400 80 T 750 120" 
            fill="none" 
            stroke="gray" 
            strokeWidth="3"
          />
          <path 
            d="M 100 300 Q 300 250 500 280 T 700 320" 
            fill="none" 
            stroke="gray" 
            strokeWidth="2"
          />
        </svg>

        {/* Job Pins */}
        {showJobPins && mapPins.map((pin) => (
          <motion.button
            key={pin.id}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200",
              "hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full",
              interactive ? "cursor-pointer" : "cursor-default"
            )}
            style={{ 
              left: `${(pin.x / 800) * 100}%`, 
              top: `${(pin.y / height) * 100}%` 
            }}
            onClick={() => handlePinClick(pin)}
            onMouseEnter={() => setHoveredJobId(pin.id)}
            onMouseLeave={() => setHoveredJobId(null)}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: mapPins.indexOf(pin) * 0.1,
              type: 'spring',
              stiffness: 200
            }}
            aria-label={`View job: ${pin.job.title} at ${pin.job.company?.name}`}
          >
            <div className={cn(
              "relative",
              selectedJobId === pin.id && "scale-125"
            )}>
              {/* Pin Shadow */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm" />
              
              {/* Pin Body */}
              <div className={cn(
                "w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold",
                selectedJobId === pin.id 
                  ? "bg-blue-600 border-blue-200" 
                  : hoveredJobId === pin.id
                  ? "bg-blue-500 border-blue-100"
                  : "bg-red-500 border-red-100"
              )}>
                <MapPin className="w-4 h-4" />
              </div>

              {/* Pin Stem */}
              <div className={cn(
                "absolute top-6 left-1/2 transform -translate-x-1/2 w-1 h-2",
                selectedJobId === pin.id 
                  ? "bg-blue-600" 
                  : hoveredJobId === pin.id
                  ? "bg-blue-500"
                  : "bg-red-500"
              )} />
            </div>
          </motion.button>
        ))}

        {/* Job Info Tooltip */}
        {(selectedPin || hoveredPin) && (
          <motion.div
            key={selectedPin?.id || hoveredPin?.id}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute z-20 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-xs"
            style={{
              left: `${((selectedPin?.x || hoveredPin?.x || 0) / 800) * 100}%`,
              top: `${((selectedPin?.y || hoveredPin?.y || 0) / height) * 100 - 20}%`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                  {(selectedPin || hoveredPin)?.job.title}
                </h4>
                {interactive && (
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </div>
              
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Building className="w-3 h-3" />
                  <span>{(selectedPin || hoveredPin)?.job.company?.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{(selectedPin || hoveredPin)?.job.location}</span>
                </div>
                {(selectedPin || hoveredPin)?.job.salary && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    <span>{(selectedPin || hoveredPin)?.job.salary}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Posted {new Date((selectedPin || hoveredPin)?.job.createdAt || '').toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-3 h-3 bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-700 transform rotate-45" />
            </div>
          </motion.div>
        )}

        {/* Center Location Button */}
        <button 
          className="absolute bottom-4 left-4 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={() => {
            // Mock center to user location
            console.log('Center map to user location')
          }}
          aria-label="Center map on your location"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Available Jobs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full" />
            <span className="text-gray-700 dark:text-gray-300">Selected Job</span>
          </div>
        </div>
      </div>

      {/* Loading State for when map service loads */}
      {jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
          </div>
        </div>
      )}

      {/* No Jobs State */}
      {jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Jobs to Display
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              There are no jobs in this area to show on the map.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Export for backward compatibility
export default JobMap