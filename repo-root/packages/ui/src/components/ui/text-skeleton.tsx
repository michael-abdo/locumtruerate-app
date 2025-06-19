import * as React from 'react'
import { cn } from '../../utils'
import { Skeleton, SkeletonProps } from './skeleton'

interface TextSkeletonProps extends Omit<SkeletonProps, 'height'> {
  lines?: number
  lineHeight?: string | number
  lastLineWidth?: string | number
  spacing?: 'tight' | 'normal' | 'loose'
  textType?: 'body' | 'heading' | 'caption' | 'code'
}

const TextSkeleton = React.forwardRef<HTMLDivElement, TextSkeletonProps>(
  ({
    className,
    lines = 3,
    lineHeight,
    lastLineWidth = '60%',
    spacing = 'normal',
    textType = 'body',
    width = '100%',
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    const spacingMap = {
      tight: 'space-y-1',
      normal: 'space-y-2',
      loose: 'space-y-3',
    }

    const typeMap = {
      body: { height: '1rem', defaultLineHeight: '1.5rem' },
      heading: { height: '1.5rem', defaultLineHeight: '2rem' },
      caption: { height: '0.875rem', defaultLineHeight: '1.25rem' },
      code: { height: '1rem', defaultLineHeight: '1.5rem' },
    }

    const currentType = typeMap[textType]
    const actualLineHeight = lineHeight || currentType.defaultLineHeight

    return (
      <div
        ref={ref}
        className={cn('w-full', spacingMap[spacing], className)}
        role="status"
        aria-label={`Loading ${textType} text with ${lines} lines`}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        {...props}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton
            key={index}
            height={currentType.height}
            width={
              index === lines - 1 
                ? lastLineWidth 
                : `${Math.max(85, 100 - (index * 5))}%`
            }
            variant={variant}
            animation={animation}
            className={cn(
              textType === 'code' && 'font-mono',
            )}
            style={{
              marginBottom: index < lines - 1 ? actualLineHeight : 0
            }}
          />
        ))}
      </div>
    )
  }
)
TextSkeleton.displayName = 'TextSkeleton'

// Specialized text skeleton variants
const ParagraphSkeleton = React.forwardRef<HTMLDivElement, Omit<TextSkeletonProps, 'textType'>>((props, ref) => (
  <TextSkeleton 
    ref={ref} 
    textType="body"
    lines={4}
    spacing="normal"
    {...props} 
  />
))
ParagraphSkeleton.displayName = 'ParagraphSkeleton'

const HeadingSkeleton = React.forwardRef<HTMLDivElement, Omit<TextSkeletonProps, 'textType' | 'lines'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }>((
  { level = 1, width = '70%', ...props }, 
  ref
) => {
  const levelMap = {
    1: { height: '2.25rem', lineHeight: '2.5rem' },
    2: { height: '1.875rem', lineHeight: '2.25rem' },
    3: { height: '1.5rem', lineHeight: '2rem' },
    4: { height: '1.25rem', lineHeight: '1.75rem' },
    5: { height: '1.125rem', lineHeight: '1.5rem' },
    6: { height: '1rem', lineHeight: '1.5rem' },
  }

  return (
    <div
      ref={ref}
      className="w-full"
      role="status"
      aria-label={`Loading heading level ${level}`}
    >
      <Skeleton
        height={levelMap[level].height}
        width={width}
        {...props}
      />
    </div>
  )
})
HeadingSkeleton.displayName = 'HeadingSkeleton'

const CaptionSkeleton = React.forwardRef<HTMLDivElement, Omit<TextSkeletonProps, 'textType'>>((props, ref) => (
  <TextSkeleton 
    ref={ref} 
    textType="caption"
    lines={2}
    spacing="tight"
    width="80%"
    {...props} 
  />
))
CaptionSkeleton.displayName = 'CaptionSkeleton'

const CodeBlockSkeleton = React.forwardRef<HTMLDivElement, Omit<TextSkeletonProps, 'textType'>>((props, ref) => (
  <div
    ref={ref}
    className="rounded-md bg-muted p-4"
    role="status"
    aria-label="Loading code block"
  >
    <TextSkeleton 
      textType="code"
      lines={8}
      spacing="tight"
      lastLineWidth="40%"
      {...props} 
    />
  </div>
))
CodeBlockSkeleton.displayName = 'CodeBlockSkeleton'

const QuoteSkeleton = React.forwardRef<HTMLDivElement, Omit<TextSkeletonProps, 'textType'>>((props, ref) => (
  <div
    ref={ref}
    className="border-l-4 border-muted-foreground/20 pl-4"
    role="status"
    aria-label="Loading quote"
  >
    <TextSkeleton 
      textType="body"
      lines={3}
      spacing="normal"
      lastLineWidth="50%"
      {...props} 
    />
  </div>
))
QuoteSkeleton.displayName = 'QuoteSkeleton'

interface ArticleSkeletonProps extends Omit<SkeletonProps, 'height' | 'width'> {
  showTitle?: boolean
  showMeta?: boolean
  paragraphs?: number
  showAuthor?: boolean
}

const ArticleSkeleton = React.forwardRef<HTMLDivElement, ArticleSkeletonProps>(
  ({
    className,
    showTitle = true,
    showMeta = true,
    paragraphs = 3,
    showAuthor = true,
    variant = 'default',
    animation = 'pulse',
    ...props
  }, ref) => {
    return (
      <article
        ref={ref}
        className={cn('w-full space-y-6', className)}
        role="status"
        aria-label="Loading article content"
        {...props}
      >
        {/* Title */}
        {showTitle && (
          <HeadingSkeleton 
            level={1} 
            width="90%" 
            variant={variant} 
            animation={animation} 
          />
        )}

        {/* Meta information */}
        {showMeta && (
          <div className="flex items-center space-x-4">
            {showAuthor && (
              <div className="flex items-center space-x-2">
                <Skeleton
                  width="32px"
                  height="32px"
                  borderRadius="50%"
                  variant={variant}
                  animation={animation}
                />
                <Skeleton
                  width="100px"
                  height="1rem"
                  variant={variant}
                  animation={animation}
                />
              </div>
            )}
            <Skeleton
              width="80px"
              height="1rem"
              variant={variant}
              animation={animation}
            />
            <Skeleton
              width="60px"
              height="1rem"
              variant={variant}
              animation={animation}
            />
          </div>
        )}

        {/* Content paragraphs */}
        <div className="space-y-4">
          {Array.from({ length: paragraphs }).map((_, index) => (
            <ParagraphSkeleton
              key={index}
              lines={index === 0 ? 5 : 4}
              variant={variant}
              animation={animation}
            />
          ))}
        </div>
      </article>
    )
  }
)
ArticleSkeleton.displayName = 'ArticleSkeleton'

export {
  TextSkeleton,
  ParagraphSkeleton,
  HeadingSkeleton,
  CaptionSkeleton,
  CodeBlockSkeleton,
  QuoteSkeleton,
  ArticleSkeleton,
}