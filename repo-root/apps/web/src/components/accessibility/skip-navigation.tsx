'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface SkipLink {
  href: string
  label: string
}

interface SkipNavigationProps {
  links?: SkipLink[]
  className?: string
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
  { href: '#footer', label: 'Skip to footer' },
  { href: '#search', label: 'Skip to search' }
]

export function SkipNavigation({ 
  links = defaultSkipLinks, 
  className 
}: SkipNavigationProps) {
  return (
    <div className={cn('skip-navigation', className)}>
      {links.map((link, index) => (
        <a
          key={`${link.href}-${index}`}
          href={link.href}
          className={cn(
            'skip-link',
            'absolute left-6 top-[-40px] z-[1000]',
            'px-4 py-2 bg-blue-600 text-white text-sm font-medium',
            'border border-blue-700 rounded-md shadow-lg',
            'focus:top-6 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'transition-all duration-200 ease-in-out',
            'hover:bg-blue-700'
          )}
          onFocus={(e) => {
            // Announce skip link focus
            const announcer = document.getElementById('accessibility-announcer')
            if (announcer) {
              announcer.textContent = `Skip link: ${link.label}`
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  )
}

// Landmark component for easier navigation
interface LandmarkProps {
  id: string
  role?: 'main' | 'navigation' | 'banner' | 'contentinfo' | 'complementary' | 'region'
  label?: string
  children: React.ReactNode
  className?: string
}

export function Landmark({ 
  id, 
  role = 'region', 
  label, 
  children, 
  className 
}: LandmarkProps) {
  return (
    <div
      id={id}
      role={role}
      aria-label={label}
      className={cn('landmark', className)}
    >
      {children}
    </div>
  )
}

// Focus trap component for modals and dialogs
interface FocusTrapProps {
  isActive: boolean
  children: React.ReactNode
  initialFocus?: React.RefObject<HTMLElement>
  onEscape?: () => void
  className?: string
}

export function FocusTrap({ 
  isActive, 
  children, 
  initialFocus,
  onEscape,
  className 
}: FocusTrapProps) {
  const trapRef = React.useRef<HTMLDivElement>(null)
  const firstFocusableRef = React.useRef<HTMLElement | null>(null)
  const lastFocusableRef = React.useRef<HTMLElement | null>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!isActive || !trapRef.current) return

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Get all focusable elements within the trap
    const focusableSelector = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')

    const focusableElements = Array.from(
      trapRef.current.querySelectorAll(focusableSelector)
    ).filter((el) => {
      const element = el as HTMLElement
      return !element.disabled && 
             element.tabIndex !== -1 && 
             element.offsetParent !== null
    }) as HTMLElement[]

    if (focusableElements.length === 0) return

    firstFocusableRef.current = focusableElements[0]
    lastFocusableRef.current = focusableElements[focusableElements.length - 1]

    // Focus the initial element or first focusable element
    const elementToFocus = initialFocus?.current || firstFocusableRef.current
    if (elementToFocus) {
      elementToFocus.focus()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape()
        return
      }

      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab (going backwards)
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        // Tab (going forwards)
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      
      // Restore focus to the previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [isActive, initialFocus, onEscape])

  if (!isActive) return <>{children}</>

  return (
    <div ref={trapRef} className={className}>
      {children}
    </div>
  )
}

// Heading hierarchy helper
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
  id?: string
}

export function Heading({ level, children, className, id }: HeadingProps) {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  )
}

// Screen reader only text component
interface ScreenReaderOnlyProps {
  children: React.ReactNode
  focusable?: boolean
  className?: string
}

export function ScreenReaderOnly({ 
  children, 
  focusable = false, 
  className 
}: ScreenReaderOnlyProps) {
  return (
    <span
      className={cn(
        'sr-only',
        focusable && 'sr-only-focusable',
        className
      )}
    >
      {children}
    </span>
  )
}

// Live region for dynamic content announcements
interface LiveRegionProps {
  message: string
  priority?: 'polite' | 'assertive'
  id?: string
  className?: string
}

export function LiveRegion({ 
  message, 
  priority = 'polite', 
  id = 'live-region',
  className 
}: LiveRegionProps) {
  return (
    <div
      id={id}
      aria-live={priority}
      aria-atomic="true"
      className={cn('sr-only', className)}
    >
      {message}
    </div>
  )
}

// Progress indicator with accessible announcements
interface AccessibleProgressProps {
  value: number
  max?: number
  label: string
  description?: string
  showPercentage?: boolean
  className?: string
}

export function AccessibleProgress({ 
  value, 
  max = 100, 
  label, 
  description,
  showPercentage = true,
  className 
}: AccessibleProgressProps) {
  const percentage = Math.round((value / max) * 100)
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">{label}</label>
        {showPercentage && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`${percentage} percent`}
        aria-label={label}
        aria-describedby={description ? `${label}-description` : undefined}
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {description && (
        <p 
          id={`${label}-description`}
          className="text-xs text-gray-600 dark:text-gray-400 mt-1"
        >
          {description}
        </p>
      )}
    </div>
  )
}

export default SkipNavigation