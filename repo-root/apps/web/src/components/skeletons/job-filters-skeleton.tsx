import * as React from 'react'
import { cn } from '@/lib/utils'
import { Skeleton, SkeletonText, SkeletonTitle, SkeletonButton } from '@locumtruerate/ui'

interface JobFiltersSkeletonProps {
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  layout?: 'sidebar' | 'modal' | 'horizontal'
  showAppliedFilters?: boolean
  className?: string
}

export function JobFiltersSkeleton({
  variant = 'default',
  animation = 'pulse',
  layout = 'sidebar',
  showAppliedFilters = true,
  className
}: JobFiltersSkeletonProps) {
  const containerClasses = {
    sidebar: 'w-80 h-full border-r bg-background',
    modal: 'w-full max-w-2xl bg-background rounded-lg shadow-lg',
    horizontal: 'w-full bg-background border rounded-lg'
  }

  const contentClasses = {
    sidebar: 'p-6 space-y-6 h-full overflow-y-auto',
    modal: 'p-6 space-y-6 max-h-[80vh] overflow-y-auto',
    horizontal: 'p-4 space-y-4'
  }

  return (
    <div 
      className={cn(containerClasses[layout], className)}
      role="status"
      aria-label="Loading job filters"
    >
      <div className={contentClasses[layout]}>
        {/* Header */}
        <div className="space-y-2">
          <SkeletonTitle
            width="70%"
            variant={variant}
            animation={animation}
          />
          {layout !== 'horizontal' && (
            <SkeletonText
              width="90%"
              variant={variant}
              animation={animation}
            />
          )}
        </div>

        {/* Applied filters */}
        {showAppliedFilters && (
          <div className="space-y-3">
            <SkeletonText
              width="50%"
              variant={variant}
              animation={animation}
            />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  height="32px"
                  width={`${80 + (index * 20)}px`}
                  borderRadius="16px"
                  variant={variant}
                  animation={animation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Search input */}
        <div className="space-y-2">
          <SkeletonText
            width="40%"
            variant={variant}
            animation={animation}
          />
          <Skeleton
            height="44px"
            width="100%"
            borderRadius="0.375rem"
            variant={variant}
            animation={animation}
          />
        </div>

        {/* Location filter */}
        <FilterSectionSkeleton
          title="Location"
          type="input"
          variant={variant}
          animation={animation}
        />

        {/* Job type filter */}
        <FilterSectionSkeleton
          title="Job Type"
          type="checkbox"
          items={4}
          variant={variant}
          animation={animation}
        />

        {/* Experience level */}
        <FilterSectionSkeleton
          title="Experience Level"
          type="radio"
          items={3}
          variant={variant}
          animation={animation}
        />

        {/* Salary range */}
        <FilterSectionSkeleton
          title="Salary Range"
          type="range"
          variant={variant}
          animation={animation}
        />

        {/* Company size */}
        <FilterSectionSkeleton
          title="Company Size"
          type="select"
          variant={variant}
          animation={animation}
        />

        {/* Remote options */}
        <FilterSectionSkeleton
          title="Work Arrangement"
          type="checkbox"
          items={3}
          variant={variant}
          animation={animation}
        />

        {/* Posted date */}
        <FilterSectionSkeleton
          title="Posted Date"
          type="radio"
          items={4}
          variant={variant}
          animation={animation}
        />

        {/* Category/Specialty */}
        <FilterSectionSkeleton
          title="Specialty"
          type="multiselect"
          items={6}
          showSearch={true}
          variant={variant}
          animation={animation}
        />

        {/* Action buttons */}
        <div className={cn(
          'flex gap-3 pt-4',
          layout === 'horizontal' ? 'flex-row' : 'flex-col'
        )}>
          <SkeletonButton
            size="lg"
            width={layout === 'horizontal' ? '120px' : '100%'}
            variant={variant}
            animation={animation}
          />
          <SkeletonButton
            size="lg"
            width={layout === 'horizontal' ? '100px' : '100%'}
            variant={variant}
            animation={animation}
          />
        </div>
      </div>

      {/* Modal close button */}
      {layout === 'modal' && (
        <div className="absolute top-4 right-4">
          <Skeleton
            width="32px"
            height="32px"
            borderRadius="50%"
            variant={variant}
            animation={animation}
          />
        </div>
      )}
    </div>
  )
}

// Filter section component
interface FilterSectionSkeletonProps {
  title: string
  type: 'input' | 'checkbox' | 'radio' | 'select' | 'range' | 'multiselect'
  items?: number
  showSearch?: boolean
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}

function FilterSectionSkeleton({
  title,
  type,
  items = 3,
  showSearch = false,
  variant = 'default',
  animation = 'pulse'
}: FilterSectionSkeletonProps) {
  return (
    <div className="space-y-3">
      {/* Section title */}
      <SkeletonText
        width="60%"
        height="1.125rem"
        variant={variant}
        animation={animation}
      />

      {/* Section content */}
      {type === 'input' && (
        <Skeleton
          height="44px"
          width="100%"
          borderRadius="0.375rem"
          variant={variant}
          animation={animation}
        />
      )}

      {type === 'select' && (
        <Skeleton
          height="44px"
          width="100%"
          borderRadius="0.375rem"
          variant={variant}
          animation={animation}
        />
      )}

      {type === 'range' && (
        <div className="space-y-3">
          <div className="flex justify-between">
            <SkeletonText width="40px" variant={variant} animation={animation} />
            <SkeletonText width="60px" variant={variant} animation={animation} />
          </div>
          <Skeleton
            height="6px"
            width="100%"
            borderRadius="3px"
            variant={variant}
            animation={animation}
          />
          <div className="flex justify-between">
            <SkeletonText width="50px" variant={variant} animation={animation} />
            <SkeletonText width="50px" variant={variant} animation={animation} />
          </div>
        </div>
      )}

      {(type === 'checkbox' || type === 'radio') && (
        <div className="space-y-2">
          {Array.from({ length: items }).map((_, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Skeleton
                width="16px"
                height="16px"
                borderRadius={type === 'radio' ? '50%' : '0.25rem'}
                variant={variant}
                animation={animation}
              />
              <SkeletonText
                width={`${80 + (index * 20)}px`}
                variant={variant}
                animation={animation}
              />
            </div>
          ))}
        </div>
      )}

      {type === 'multiselect' && (
        <div className="space-y-3">
          {showSearch && (
            <Skeleton
              height="36px"
              width="100%"
              borderRadius="0.375rem"
              variant={variant}
              animation={animation}
            />
          )}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Array.from({ length: items }).map((_, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Skeleton
                  width="16px"
                  height="16px"
                  borderRadius="0.25rem"
                  variant={variant}
                  animation={animation}
                />
                <SkeletonText
                  width={`${90 + (index * 15)}px`}
                  variant={variant}
                  animation={animation}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Specialized filter skeleton variants
export function MobileFiltersModalSkeleton(props: Omit<JobFiltersSkeletonProps, 'layout'>) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <SkeletonTitle width="40%" variant={props.variant} animation={props.animation} />
        <Skeleton
          width="32px"
          height="32px"
          borderRadius="50%"
          variant={props.variant}
          animation={props.animation}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <JobFiltersSkeleton 
          {...props}
          layout="modal"
        />
      </div>

      {/* Bottom actions */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-3">
          <SkeletonButton
            size="lg"
            width="50%"
            variant={props.variant}
            animation={props.animation}
          />
          <SkeletonButton
            size="lg"
            width="50%"
            variant={props.variant}
            animation={props.animation}
          />
        </div>
      </div>
    </div>
  )
}

export function QuickFiltersSkeleton(props: Omit<JobFiltersSkeletonProps, 'layout' | 'showAppliedFilters'>) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg">
      <SkeletonText width="80px" variant={props.variant} animation={props.animation} />
      
      {/* Quick filter chips */}
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          height="32px"
          width={`${70 + (index * 15)}px`}
          borderRadius="16px"
          variant={props.variant}
          animation={props.animation}
        />
      ))}

      <SkeletonButton
        size="sm"
        width="100px"
        variant={props.variant}
        animation={props.animation}
      />
    </div>
  )
}

export function FilterChipsSkeleton({ 
  count = 4, 
  variant = 'default', 
  animation = 'pulse' 
}: {
  count?: number
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full"
        >
          <SkeletonText
            width={`${60 + (index * 20)}px`}
            height="0.875rem"
            variant={variant}
            animation={animation}
          />
          <Skeleton
            width="16px"
            height="16px"
            borderRadius="50%"
            variant={variant}
            animation={animation}
          />
        </div>
      ))}
    </div>
  )
}