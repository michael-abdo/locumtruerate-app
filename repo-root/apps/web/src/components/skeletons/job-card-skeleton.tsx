import * as React from 'react'
import { cn } from '@/lib/utils'
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar, 
  SkeletonButton 
} from '@locumtruerate/ui'

interface JobCardSkeletonProps {
  className?: string
  variant?: 'default' | 'shimmer' | 'wave' | 'pulse'
  animation?: 'none' | 'pulse' | 'shimmer' | 'wave'
  showExpanded?: boolean
}

export function JobCardSkeleton({ 
  className,
  variant = 'default',
  animation = 'pulse',
  showExpanded = false
}: JobCardSkeletonProps) {
  return (
    <div 
      className={cn(
        'w-full rounded-lg border bg-card text-card-foreground shadow-sm',
        'touch-manipulation', // Optimizes for touch
        className
      )}
      role="status"
      aria-label="Loading job card"
    >
      {/* Header */}
      <div className="flex flex-col space-y-3 p-6">
        {/* Company and actions row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            {/* Company Logo */}
            <SkeletonAvatar 
              size="md" 
              variant={variant} 
              animation={animation}
              className="rounded-lg" 
            />
            
            <div className="flex-1 min-w-0 space-y-2">
              {/* Job Title */}
              <SkeletonTitle
                width="85%"
                variant={variant}
                animation={animation}
              />
              {/* Company Name */}
              <SkeletonText
                width="60%"
                variant={variant}
                animation={animation}
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Skeleton
              width="40px"
              height="40px"
              borderRadius="50%"
              variant={variant}
              animation={animation}
            />
            <Skeleton
              width="40px"
              height="40px"
              borderRadius="50%"
              variant={variant}
              animation={animation}
            />
          </div>
        </div>
        
        {/* Location and metadata */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            <Skeleton
              width="16px"
              height="16px"
              variant={variant}
              animation={animation}
            />
            <SkeletonText
              width="120px"
              variant={variant}
              animation={animation}
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Skeleton
              width="16px"
              height="16px"
              variant={variant}
              animation={animation}
            />
            <SkeletonText
              width="100px"
              variant={variant}
              animation={animation}
            />
          </div>
          
          <div className="flex items-center gap-1">
            <Skeleton
              width="16px"
              height="16px"
              variant={variant}
              animation={animation}
            />
            <SkeletonText
              width="80px"
              variant={variant}
              animation={animation}
            />
          </div>
        </div>
        
        {/* Job badges */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              height="24px"
              width={`${60 + (index * 20)}px`}
              borderRadius="12px"
              variant={variant}
              animation={animation}
            />
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="space-y-4 px-6">
        {/* Description preview */}
        <div className="space-y-2">
          <SkeletonText
            width="100%"
            variant={variant}
            animation={animation}
          />
          <SkeletonText
            width="85%"
            variant={variant}
            animation={animation}
          />
        </div>
        
        {/* Expand/collapse button */}
        <div className="flex items-center gap-1">
          <Skeleton
            width="16px"
            height="16px"
            variant={variant}
            animation={animation}
          />
          <SkeletonText
            width="80px"
            variant={variant}
            animation={animation}
          />
        </div>
        
        {/* Expanded content */}
        {showExpanded && (
          <div className="space-y-3 pt-2">
            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton
                  key={index}
                  height="20px"
                  width={`${50 + (index * 15)}px`}
                  borderRadius="10px"
                  variant={variant}
                  animation={animation}
                />
              ))}
            </div>
            
            {/* Additional metadata */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1">
                <Skeleton
                  width="16px"
                  height="16px"
                  variant={variant}
                  animation={animation}
                />
                <SkeletonText
                  width="90px"
                  variant={variant}
                  animation={animation}
                />
              </div>
              
              <div className="flex items-center gap-1">
                <Skeleton
                  width="16px"
                  height="16px"
                  variant={variant}
                  animation={animation}
                />
                <SkeletonText
                  width="70px"
                  variant={variant}
                  animation={animation}
                />
              </div>
              
              <div className="flex items-center gap-1">
                <Skeleton
                  width="16px"
                  height="16px"
                  variant={variant}
                  animation={animation}
                />
                <SkeletonText
                  width="100px"
                  variant={variant}
                  animation={animation}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="pt-4 px-6 pb-6">
        <SkeletonButton
          size="lg"
          width="100%"
          variant={variant}
          animation={animation}
        />
      </div>
    </div>
  )
}

// Specialized job card skeleton variants
export function FeaturedJobCardSkeleton(props: Omit<JobCardSkeletonProps, 'showExpanded'>) {
  return (
    <JobCardSkeleton 
      {...props}
      showExpanded={true}
      className={cn('border-primary/20 bg-primary/5', props.className)}
    />
  )
}

export function CompactJobCardSkeleton(props: JobCardSkeletonProps) {
  return (
    <div 
      className={cn(
        'w-full rounded-lg border bg-card text-card-foreground shadow-sm p-4',
        'touch-manipulation',
        props.className
      )}
      role="status"
      aria-label="Loading compact job card"
    >
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <SkeletonAvatar 
            size="sm" 
            variant={props.variant} 
            animation={props.animation}
            className="rounded-lg" 
          />
          
          <div className="flex-1 min-w-0 space-y-1">
            <SkeletonTitle
              width="80%"
              height="1.25rem"
              variant={props.variant}
              animation={props.animation}
            />
            <SkeletonText
              width="60%"
              height="0.875rem"
              variant={props.variant}
              animation={props.animation}
            />
          </div>
        </div>
        
        <SkeletonText
          width="80px"
          variant={props.variant}
          animation={props.animation}
        />
      </div>
      
      {/* Compact metadata */}
      <div className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-4">
          <SkeletonText
            width="100px"
            variant={props.variant}
            animation={props.animation}
          />
          <SkeletonText
            width="80px"
            variant={props.variant}
            animation={props.animation}
          />
        </div>
        
        <Skeleton
          height="20px"
          width="60px"
          borderRadius="10px"
          variant={props.variant}
          animation={props.animation}
        />
      </div>
    </div>
  )
}