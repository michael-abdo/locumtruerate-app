'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface ScreenReaderOnlyProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
  as: Component = 'span',
}) => {
  return (
    <Component className={cn('sr-only', className)}>
      {children}
    </Component>
  )
}

interface LiveRegionProps {
  children: React.ReactNode
  politeness?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all'
  className?: string
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  className,
}) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn('sr-only', className)}
    >
      {children}
    </div>
  )
}

// Hook for announcing messages to screen readers
export const useAnnounce = () => {
  const [announcement, setAnnouncement] = React.useState('')

  const announce = React.useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    // Clear the announcement first to ensure it's re-read if the same message is announced
    setAnnouncement('')
    
    // Use setTimeout to ensure the clearing happens before setting the new message
    setTimeout(() => {
      setAnnouncement(message)
      
      // Clear the announcement after a short delay to reset the live region
      setTimeout(() => {
        setAnnouncement('')
      }, 1000)
    }, 10)
  }, [])

  const AnnouncementRegion = React.useMemo(() => (
    <LiveRegion politeness="polite">
      {announcement}
    </LiveRegion>
  ), [announcement])

  return {
    announce,
    AnnouncementRegion
  }
}

interface DescriptiveTextProps {
  children: React.ReactNode
  id?: string
  className?: string
}

export const DescriptiveText: React.FC<DescriptiveTextProps> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('text-sm text-muted-foreground', className)}
      role="note"
    >
      {children}
    </div>
  )
}

interface LoadingAnnouncementProps {
  isLoading: boolean
  loadingMessage?: string
  completedMessage?: string
}

export const LoadingAnnouncement: React.FC<LoadingAnnouncementProps> = ({
  isLoading,
  loadingMessage = 'Loading...',
  completedMessage = 'Content loaded',
}) => {
  const previousLoadingState = React.useRef(isLoading)
  
  React.useEffect(() => {
    // Only announce when loading state changes
    if (previousLoadingState.current !== isLoading) {
      previousLoadingState.current = isLoading
      
      // Don't announce on initial render if already loading
      if (previousLoadingState.current !== undefined) {
        // Announce loading or completion
        // This would typically work with the useAnnounce hook
      }
    }
  }, [isLoading, loadingMessage, completedMessage])

  return (
    <LiveRegion politeness="polite">
      {isLoading ? loadingMessage : ''}
    </LiveRegion>
  )
}

interface ErrorAnnouncementProps {
  error: string | null
  errorMessage?: string
}

export const ErrorAnnouncement: React.FC<ErrorAnnouncementProps> = ({
  error,
  errorMessage,
}) => {
  return (
    <LiveRegion politeness="assertive">
      {error ? (errorMessage || error) : ''}
    </LiveRegion>
  )
}

// Component for form field descriptions
interface FieldDescriptionProps {
  children: React.ReactNode
  id: string
  className?: string
}

export const FieldDescription: React.FC<FieldDescriptionProps> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('text-sm text-muted-foreground mt-1', className)}
    >
      {children}
    </div>
  )
}

// Component for form field errors
interface FieldErrorProps {
  children: React.ReactNode
  id: string
  className?: string
}

export const FieldError: React.FC<FieldErrorProps> = ({
  children,
  id,
  className,
}) => {
  return (
    <div
      id={id}
      className={cn('text-sm text-destructive mt-1', className)}
      role="alert"
      aria-live="polite"
    >
      {children}
    </div>
  )
}

// Hook for managing form field accessibility
export const useFieldAccessibility = (fieldId: string, error?: string, description?: string) => {
  const errorId = error ? `${fieldId}-error` : undefined
  const descriptionId = description ? `${fieldId}-description` : undefined
  
  const ariaDescribedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined
  
  return {
    fieldProps: {
      id: fieldId,
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': error ? true : undefined,
    },
    errorProps: errorId ? {
      id: errorId,
      role: 'alert' as const,
      'aria-live': 'polite' as const,
    } : undefined,
    descriptionProps: descriptionId ? {
      id: descriptionId,
    } : undefined,
  }
}

// Hook for managing form validation announcements
export const useFormAnnouncements = () => {
  const { announce, AnnouncementRegion } = useAnnounce()
  
  const announceValidationError = React.useCallback((errors: string[]) => {
    if (errors.length === 1) {
      announce(`Error: ${errors[0]}`, 'assertive')
    } else if (errors.length > 1) {
      announce(`${errors.length} errors found in form`, 'assertive')
    }
  }, [announce])
  
  const announceSuccess = React.useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])
  
  return {
    announceValidationError,
    announceSuccess,
    AnnouncementRegion,
  }
}