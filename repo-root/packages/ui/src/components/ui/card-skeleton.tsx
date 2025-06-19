import * as React from 'react'
import { cn } from '../../utils'
import { Skeleton, SkeletonProps, SkeletonText, SkeletonTitle, SkeletonAvatar, SkeletonButton } from './skeleton'

interface CardSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  showHeader?: boolean
  showFooter?: boolean
  showAvatar?: boolean
  headerLines?: number
  contentLines?: number
  footerLines?: number
  width?: string | number
  height?: string | number
}

const CardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({
    className,
    showHeader = true,
    showFooter = true,
    showAvatar = false,
    headerLines = 2,
    contentLines = 3,
    footerLines = 1,
    width,
    height,
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-4',
          className
        )}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
        role="status"
        aria-label="Loading card content"
        {...props}
      >
        {/* Header Section */}
        {showHeader && (
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              {showAvatar && (
                <SkeletonAvatar size="md" variant={variant} animation={animation} />
              )}
              <div className="flex-1 space-y-2">
                {Array.from({ length: headerLines }).map((_, i) => (
                  <SkeletonTitle
                    key={`header-${i}`}
                    variant={variant}
                    animation={animation}
                    width={i === 0 ? '70%' : '50%'}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Content Section */}
        <div className="space-y-2">
          {Array.from({ length: contentLines }).map((_, i) => (
            <SkeletonText
              key={`content-${i}`}
              variant={variant}
              animation={animation}
              width={
                i === contentLines - 1 
                  ? '60%' 
                  : i % 2 === 0 
                    ? '90%' 
                    : '85%'
              }
            />
          ))}
        </div>

        {/* Footer Section */}
        {showFooter && (
          <div className="flex items-center justify-between pt-2">
            <div className="space-y-1 flex-1">
              {Array.from({ length: footerLines }).map((_, i) => (
                <SkeletonText
                  key={`footer-${i}`}
                  variant={variant}
                  animation={animation}
                  width="40%"
                />
              ))}
            </div>
            <SkeletonButton
              size="md"
              width="80px"
              variant={variant}
              animation={animation}
            />
          </div>
        )}
      </div>
    )
  }
)
CardSkeleton.displayName = 'CardSkeleton'

// Specialized card skeleton variants
const ProfileCardSkeleton = React.forwardRef<HTMLDivElement, Omit<CardSkeletonProps, 'showAvatar'>>((props, ref) => (
  <CardSkeleton 
    ref={ref} 
    showAvatar={true} 
    headerLines={2} 
    contentLines={2} 
    footerLines={1}
    {...props} 
  />
))
ProfileCardSkeleton.displayName = 'ProfileCardSkeleton'

const ArticleCardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>((props, ref) => (
  <CardSkeleton 
    ref={ref} 
    showAvatar={false} 
    headerLines={1} 
    contentLines={4} 
    showFooter={false}
    {...props} 
  />
))
ArticleCardSkeleton.displayName = 'ArticleCardSkeleton'

const StatCardSkeleton = React.forwardRef<HTMLDivElement, CardSkeletonProps>((props, ref) => (
  <CardSkeleton 
    ref={ref} 
    showAvatar={false} 
    headerLines={1} 
    contentLines={1} 
    showFooter={false}
    {...props} 
  />
))
StatCardSkeleton.displayName = 'StatCardSkeleton'

export {
  CardSkeleton,
  ProfileCardSkeleton,
  ArticleCardSkeleton,
  StatCardSkeleton,
}