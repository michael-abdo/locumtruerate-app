import * as React from 'react'
import { cn } from '@/lib/utils'
import { JobCardSkeleton, CompactJobCardSkeleton, FeaturedJobCardSkeleton } from './job-card-skeleton'

interface JobListSkeletonProps {
  count?: number
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  layout?: 'grid' | 'list' | 'compact'
  showFeatured?: boolean
  featuredCount?: number
  className?: string
}

export function JobListSkeleton({
  count = 8,
  variant = 'default',
  animation = 'pulse',
  layout = 'grid',
  showFeatured = true,
  featuredCount = 2,
  className
}: JobListSkeletonProps) {
  const layoutClasses = {
    grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    list: 'space-y-4',
    compact: 'space-y-3'
  }

  const regularCount = count - (showFeatured ? featuredCount : 0)

  return (
    <div 
      className={cn('w-full', className)}
      role="status"
      aria-label={`Loading ${count} job listings`}
    >
      {/* Featured jobs section */}
      {showFeatured && featuredCount > 0 && (
        <div className="mb-8">
          <div className="mb-4 space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          </div>
          
          <div className={cn(
            layout === 'compact' ? 'space-y-3' : 
            layout === 'list' ? 'space-y-6' :
            'grid grid-cols-1 lg:grid-cols-2 gap-6'
          )}>
            {Array.from({ length: featuredCount }).map((_, index) => (
              <FeaturedJobCardSkeleton
                key={`featured-${index}`}
                variant={variant}
                animation={animation}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular jobs section */}
      {regularCount > 0 && (
        <div>
          {showFeatured && (
            <div className="mb-4 space-y-2">
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-80 bg-muted rounded animate-pulse" />
            </div>
          )}
          
          <div className={layoutClasses[layout]}>
            {Array.from({ length: regularCount }).map((_, index) => {
              if (layout === 'compact') {
                return (
                  <CompactJobCardSkeleton
                    key={`regular-${index}`}
                    variant={variant}
                    animation={animation}
                  />
                )
              }
              
              return (
                <JobCardSkeleton
                  key={`regular-${index}`}
                  variant={variant}
                  animation={animation}
                  showExpanded={layout === 'list' && index < 2}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Load more button */}
      <div className="flex justify-center pt-8">
        <div className="h-12 w-32 bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  )
}

// Specialized job list skeleton variants
export function JobSearchResultsSkeleton(props: Omit<JobListSkeletonProps, 'layout' | 'showFeatured'>) {
  return (
    <div className="space-y-6">
      {/* Search results header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <JobListSkeleton 
        {...props}
        layout="list"
        showFeatured={false}
      />
    </div>
  )
}

export function SavedJobsSkeleton(props: Omit<JobListSkeletonProps, 'showFeatured'>) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
          <div className="h-9 w-9 bg-muted rounded animate-pulse" />
        </div>
      </div>

      <JobListSkeleton 
        {...props}
        showFeatured={false}
      />
    </div>
  )
}

export function JobCategorySkeleton({ 
  categoryName, 
  ...props 
}: Omit<JobListSkeletonProps, 'showFeatured'> & { categoryName?: boolean }) {
  return (
    <div className="space-y-6">
      {/* Category header */}
      <div className="text-center space-y-4">
        {categoryName && (
          <div className="h-10 w-64 bg-muted rounded animate-pulse mx-auto" />
        )}
        <div className="h-4 w-96 bg-muted rounded animate-pulse mx-auto" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="text-center space-y-2 p-4 border rounded-lg">
            <div className="h-8 w-16 bg-muted rounded animate-pulse mx-auto" />
            <div className="h-4 w-20 bg-muted rounded animate-pulse mx-auto" />
          </div>
        ))}
      </div>

      <JobListSkeleton 
        {...props}
        showFeatured={false}
      />
    </div>
  )
}

export function JobDashboardSkeleton(props: Omit<JobListSkeletonProps, 'layout'>) {
  return (
    <div className="space-y-8">
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="p-6 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-8 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 p-3 border rounded">
              <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-full bg-muted rounded animate-pulse" />
                <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Recommended jobs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-9 w-20 bg-muted rounded animate-pulse" />
        </div>
        
        <JobListSkeleton 
          {...props}
          layout="grid"
          count={6}
        />
      </div>
    </div>
  )
}