'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { JobCardData, JobType, JobCategory } from '@locumtruerate/types'
import { BoostedJobBadges, type BoostType } from './boosted-job-badge'
import { 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Briefcase, 
  Clock,
  Share2,
  Heart,
  ChevronDown,
  ChevronUp,
  Eye,
  Zap
} from 'lucide-react'

interface JobCardProps {
  job: JobCardData & {
    boosts?: BoostType[]
    isPremium?: boolean
  }
  onApply?: (jobId: string) => void
  onSave?: (jobId: string, isSaved: boolean) => void
  onShare?: (jobId: string) => void
  onBoost?: (jobId: string) => void
  className?: string
  isLoading?: boolean
  showBoostBadges?: boolean
}

// Utility function to format dates
const formatDate = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - new Date(date).getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  return `${Math.floor(diffInDays / 30)} months ago`
}

// Utility function to format salary
const formatSalary = (salary?: string, salaryRange?: JobCardData['salaryRange']): string => {
  if (salaryRange) {
    const { min, max, currency, period } = salaryRange
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    })
    return `${formatter.format(min)} - ${formatter.format(max)}/${period}`
  }
  return salary || 'Competitive'
}

// Get badge variant based on job type
const getJobTypeBadgeVariant = (type?: JobType): "default" | "secondary" | "blue" | "purple" | "green" => {
  switch (type) {
    case 'FULL_TIME': return 'default'
    case 'PART_TIME': return 'secondary'
    case 'CONTRACT': return 'blue'
    case 'REMOTE': return 'purple'
    case 'INTERNSHIP': return 'green'
    default: return 'default'
  }
}

// Get badge variant based on job category
const getCategoryBadgeVariant = (category?: JobCategory): "gray" | "blue" | "purple" | "green" | "yellow" => {
  switch (category) {
    case 'ENGINEERING': return 'blue'
    case 'DESIGN': return 'purple'
    case 'MARKETING': return 'yellow'
    case 'SALES': return 'green'
    default: return 'gray'
  }
}

export function JobCard({ 
  job, 
  onApply, 
  onSave, 
  onShare,
  onBoost,
  className,
  isLoading = false,
  showBoostBadges = true
}: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Handle save action
  const handleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const newSavedState = !isSaved
    setIsSaved(newSavedState)
    onSave?.(job.id, newSavedState)
  }, [isSaved, job.id, onSave])
  
  // Handle share action
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Use native share API if available
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this ${job.title} position at ${job.companyName}`,
          url: window.location.origin + '/jobs/' + job.id
        })
      } catch (err) {
        // User cancelled share or API not supported
        console.log('Share cancelled or not supported')
      }
    } else {
      // Fallback to custom share implementation
      onShare?.(job.id)
    }
  }, [job, onShare])
  
  // Handle apply action
  const handleApply = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onApply?.(job.id)
  }, [job.id, onApply])
  
  // Toggle expanded state
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])
  
  // Memoize formatted values
  const formattedSalary = useMemo(() => 
    formatSalary(job.salary, job.salaryRange), 
    [job.salary, job.salaryRange]
  )
  
  const formattedDate = useMemo(() => 
    formatDate(job.publishedAt), 
    [job.publishedAt]
  )
  
  const daysUntilExpiry = useMemo(() => {
    const now = new Date()
    const expiry = new Date(job.expiresAt)
    const diffInMs = expiry.getTime() - now.getTime()
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24))
  }, [job.expiresAt])

  return (
    <Card 
      className={cn(
        "w-full transition-all duration-200 relative",
        "hover:shadow-lg",
        "touch-manipulation", // Optimizes for touch
        job.isPremium && "ring-2 ring-yellow-200 dark:ring-yellow-800",
        job.boosts?.includes('premium') && "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10",
        job.boosts?.includes('featured') && "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10",
        job.boosts?.includes('urgent') && "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/10 dark:to-pink-900/10",
        isLoading && "opacity-50 pointer-events-none",
        className
      )}
      role="article"
      aria-label={`Job listing: ${job.title} at ${job.companyName}`}
    >
      <CardHeader 
        className="space-y-3 cursor-pointer"
        onClick={toggleExpanded}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleExpanded()
          }
        }}
      >
        {/* Boost badges */}
        {showBoostBadges && job.boosts && job.boosts.length > 0 && (
          <div className="absolute top-4 right-4 z-10">
            <BoostedJobBadges 
              boosts={job.boosts} 
              size="sm" 
              maxVisible={2}
              animated={true}
            />
          </div>
        )}

        {/* Company and badges row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            {job.companyLogo && (
              <img 
                src={job.companyLogo} 
                alt={`${job.companyName} logo`}
                className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                loading="lazy"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.companyName}</p>
            </div>
          </div>
          
          {/* Mobile action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors touch-target"
              aria-label="Share job"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleSave}
              className={cn(
                "p-2 rounded-full hover:bg-gray-100 transition-colors touch-target",
                isSaved && "text-red-500"
              )}
              aria-label={isSaved ? "Unsave job" : "Save job"}
              aria-pressed={isSaved}
            >
              <Heart className={cn("w-5 h-5", isSaved && "fill-current")} />
            </button>
          </div>
        </div>
        
        {/* Location and metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{job.location}</span>
            {job.isRemote && (
              <Badge variant="purple" className="ml-1">Remote</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span>{formattedSalary}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>
        </div>
        
        {/* Job badges */}
        <div className="flex flex-wrap gap-2">
          {job.isUrgent && (
            <Badge variant="destructive">Urgent</Badge>
          )}
          {job.isFeatured && (
            <Badge variant="warning">Featured</Badge>
          )}
          {job.type && (
            <Badge variant={getJobTypeBadgeVariant(job.type)}>
              {job.type.replace(/_/g, ' ')}
            </Badge>
          )}
          {job.category && (
            <Badge variant={getCategoryBadgeVariant(job.category)}>
              {job.category}
            </Badge>
          )}
          {job.specialty && (
            <Badge variant="secondary">{job.specialty}</Badge>
          )}
          {job.experienceLevel && (
            <Badge variant="outline">{job.experienceLevel}</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description preview */}
        <p 
          className={cn(
            "text-sm text-muted-foreground",
            !isExpanded && "line-clamp-2"
          )}
        >
          {job.descriptionPreview}
        </p>
        
        {/* Expand/collapse button */}
        <button
          onClick={toggleExpanded}
          className="flex items-center gap-1 text-sm text-primary hover:underline touch-target"
          aria-label={isExpanded ? "Show less" : "Show more"}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show more
            </>
          )}
        </button>
        
        {/* Expanded content */}
        {isExpanded && (
          <div className="space-y-3 pt-2">
            {/* Tags */}
            {job.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Additional metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{job.applicationCount} applicants</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{job.viewCount.toLocaleString()} views</span>
              </div>
              
              {daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {daysUntilExpiry} days</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-4">
        <div className="flex gap-2 w-full">
          <button
            onClick={handleApply}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-[0.98]",
              "transition-all duration-150",
              "touch-target", // Ensures min 44px height
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            )}
            aria-label={`Apply for ${job.title} at ${job.companyName}`}
          >
            <span className="flex items-center justify-center gap-2">
              <Briefcase className="w-5 h-5" />
              Quick Apply
            </span>
          </button>
          
          {onBoost && !job.boosts?.length && (
            <button
              onClick={() => onBoost(job.id)}
              className={cn(
                "px-4 py-3 rounded-lg font-medium border-2 border-dashed border-yellow-300 dark:border-yellow-700",
                "text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20",
                "hover:bg-yellow-100 dark:hover:bg-yellow-900/30 active:scale-[0.98]",
                "transition-all duration-150",
                "touch-target",
                "focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              )}
              aria-label={`Boost ${job.title} listing`}
              title="Boost this job for more visibility"
            >
              <Zap className="w-5 h-5" />
            </button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

// CSS for touch targets (to be added to global styles)
const touchTargetStyles = `
.touch-target {
  min-width: 44px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
`