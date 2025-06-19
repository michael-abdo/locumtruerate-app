import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../utils'

const skeletonVariants = cva(
  'animate-pulse bg-muted rounded-md',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        shimmer: 'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer',
        wave: 'bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-wave',
        pulse: 'animate-pulse bg-muted',
      },
      animation: {
        none: 'animate-none',
        pulse: 'animate-pulse',
        shimmer: 'animate-shimmer',
        wave: 'animate-wave',
      },
    },
    defaultVariants: {
      variant: 'default',
      animation: 'pulse',
    },
  }
)

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {
  width?: string | number
  height?: string | number
  borderRadius?: string
  'aria-label'?: string
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ 
    className, 
    variant, 
    animation, 
    width, 
    height, 
    borderRadius,
    style,
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    const combinedStyle: React.CSSProperties = {
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
      borderRadius,
      ...style,
    }

    return (
      <div
        ref={ref}
        className={cn(skeletonVariants({ variant, animation, className }))}
        style={combinedStyle}
        role="status"
        aria-label={ariaLabel || "Loading content"}
        aria-live="polite"
        {...props}
      >
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
)
Skeleton.displayName = 'Skeleton'

// Preset skeleton components for common use cases
const SkeletonText = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'>>((props, ref) => (
  <Skeleton ref={ref} height="1rem" {...props} />
))
SkeletonText.displayName = 'SkeletonText'

const SkeletonTitle = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'>>((props, ref) => (
  <Skeleton ref={ref} height="1.5rem" {...props} />
))
SkeletonTitle.displayName = 'SkeletonTitle'

const SkeletonAvatar = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'width' | 'height' | 'borderRadius'> & { size?: 'sm' | 'md' | 'lg' }>((
  { size = 'md', ...props }, 
  ref
) => {
  const sizeMap = {
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 48, height: 48 },
  }
  
  return (
    <Skeleton 
      ref={ref} 
      width={sizeMap[size].width} 
      height={sizeMap[size].height} 
      borderRadius="50%" 
      {...props} 
    />
  )
})
SkeletonAvatar.displayName = 'SkeletonAvatar'

const SkeletonButton = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'height'> & { size?: 'sm' | 'md' | 'lg' }>((
  { size = 'md', width, ...props }, 
  ref
) => {
  const heightMap = {
    sm: '2.25rem', // 36px
    md: '2.5rem',  // 40px
    lg: '2.75rem', // 44px
  }
  
  return (
    <Skeleton 
      ref={ref} 
      height={heightMap[size]} 
      width={width || '100px'}
      borderRadius="0.375rem"
      {...props} 
    />
  )
})
SkeletonButton.displayName = 'SkeletonButton'

const SkeletonCard = React.forwardRef<HTMLDivElement, Omit<SkeletonProps, 'borderRadius'>>((props, ref) => (
  <Skeleton ref={ref} borderRadius="0.5rem" {...props} />
))
SkeletonCard.displayName = 'SkeletonCard'

export {
  Skeleton,
  SkeletonText,
  SkeletonTitle,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  skeletonVariants,
}