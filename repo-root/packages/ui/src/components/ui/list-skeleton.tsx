import * as React from 'react'
import { cn } from '../../utils'
import { Skeleton, SkeletonProps, SkeletonText, SkeletonTitle, SkeletonAvatar } from './skeleton'

interface ListSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  count?: number
  showAvatar?: boolean
  showBadge?: boolean
  showMetadata?: boolean
  orientation?: 'vertical' | 'horizontal'
  size?: 'sm' | 'md' | 'lg'
  spacing?: 'tight' | 'normal' | 'loose'
}

const ListSkeleton = React.forwardRef<HTMLDivElement, ListSkeletonProps>(
  ({
    className,
    count = 5,
    showAvatar = false,
    showBadge = false,
    showMetadata = false,
    orientation = 'vertical',
    size = 'md',
    spacing = 'normal',
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    const spacingMap = {
      tight: 'space-y-2',
      normal: 'space-y-4',
      loose: 'space-y-6',
    }

    const sizeMap = {
      sm: {
        avatar: 'sm' as const,
        titleHeight: '1rem',
        textHeight: '0.875rem',
        padding: 'p-3',
      },
      md: {
        avatar: 'md' as const,
        titleHeight: '1.25rem',
        textHeight: '1rem',
        padding: 'p-4',
      },
      lg: {
        avatar: 'lg' as const,
        titleHeight: '1.5rem',
        textHeight: '1.125rem',
        padding: 'p-6',
      },
    }

    const currentSize = sizeMap[size]

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          orientation === 'vertical' ? spacingMap[spacing] : 'flex flex-wrap gap-4',
          className
        )}
        role="status"
        aria-label={`Loading list with ${count} items`}
        {...props}
      >
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start space-x-3 rounded-lg border bg-card',
              currentSize.padding,
              orientation === 'horizontal' && 'flex-1 min-w-0'
            )}
          >
            {/* Avatar */}
            {showAvatar && (
              <SkeletonAvatar 
                size={currentSize.avatar} 
                variant={variant} 
                animation={animation}
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title */}
              <Skeleton
                height={currentSize.titleHeight}
                width="70%"
                variant={variant}
                animation={animation}
              />

              {/* Description */}
              <div className="space-y-1">
                <Skeleton
                  height={currentSize.textHeight}
                  width="90%"
                  variant={variant}
                  animation={animation}
                />
                <Skeleton
                  height={currentSize.textHeight}
                  width="60%"
                  variant={variant}
                  animation={animation}
                />
              </div>

              {/* Metadata */}
              {showMetadata && (
                <div className="flex items-center space-x-4 pt-1">
                  <Skeleton
                    height={currentSize.textHeight}
                    width="80px"
                    variant={variant}
                    animation={animation}
                  />
                  <Skeleton
                    height={currentSize.textHeight}
                    width="60px"
                    variant={variant}
                    animation={animation}
                  />
                </div>
              )}
            </div>

            {/* Badge */}
            {showBadge && (
              <Skeleton
                height="24px"
                width="60px"
                borderRadius="12px"
                variant={variant}
                animation={animation}
              />
            )}
          </div>
        ))}
      </div>
    )
  }
)
ListSkeleton.displayName = 'ListSkeleton'

// Specialized list skeleton variants
const SearchResultsSkeleton = React.forwardRef<HTMLDivElement, Omit<ListSkeletonProps, 'showAvatar' | 'showBadge' | 'showMetadata'>>((props, ref) => (
  <ListSkeleton 
    ref={ref} 
    showAvatar={false}
    showBadge={true}
    showMetadata={true}
    {...props} 
  />
))
SearchResultsSkeleton.displayName = 'SearchResultsSkeleton'

const UserListSkeleton = React.forwardRef<HTMLDivElement, Omit<ListSkeletonProps, 'showAvatar'>>((props, ref) => (
  <ListSkeleton 
    ref={ref} 
    showAvatar={true}
    showBadge={false}
    showMetadata={true}
    {...props} 
  />
))
UserListSkeleton.displayName = 'UserListSkeleton'

const NotificationListSkeleton = React.forwardRef<HTMLDivElement, Omit<ListSkeletonProps, 'showAvatar' | 'showBadge'>>((props, ref) => (
  <ListSkeleton 
    ref={ref} 
    showAvatar={true}
    showBadge={true}
    showMetadata={false}
    size="sm"
    {...props} 
  />
))
NotificationListSkeleton.displayName = 'NotificationListSkeleton'

const SimpleListSkeleton = React.forwardRef<HTMLDivElement, Omit<ListSkeletonProps, 'showAvatar' | 'showBadge' | 'showMetadata'>>((props, ref) => (
  <ListSkeleton 
    ref={ref} 
    showAvatar={false}
    showBadge={false}
    showMetadata={false}
    {...props} 
  />
))
SimpleListSkeleton.displayName = 'SimpleListSkeleton'

export {
  ListSkeleton,
  SearchResultsSkeleton,
  UserListSkeleton,
  NotificationListSkeleton,
  SimpleListSkeleton,
}