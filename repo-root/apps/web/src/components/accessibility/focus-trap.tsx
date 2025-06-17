'use client'

import * as React from 'react'

interface FocusTrapProps {
  children: React.ReactNode
  enabled?: boolean
  restoreFocus?: boolean
  initialFocus?: React.RefObject<HTMLElement>
  className?: string
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  enabled = true,
  restoreFocus = true,
  initialFocus,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!enabled) return

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    // Focus the initial element or the first focusable element
    const focusElement = initialFocus?.current || getFirstFocusableElement()
    if (focusElement) {
      focusElement.focus()
    }

    // Return focus when component unmounts
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }
  }, [enabled, initialFocus, restoreFocus])

  React.useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return

      const focusableElements = getFocusableElements()
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        // Shift + Tab (backward)
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab (forward)
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled])

  const getFocusableElements = (): HTMLElement[] => {
    if (!containerRef.current) return []

    const selectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(containerRef.current.querySelectorAll(selectors))
  }

  const getFirstFocusableElement = (): HTMLElement | null => {
    const elements = getFocusableElements()
    return elements[0] || null
  }

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

// Hook for managing focus trap
export const useFocusTrap = (enabled: boolean = true) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  const activate = React.useCallback(() => {
    if (!enabled || !containerRef.current) return

    previousActiveElement.current = document.activeElement as HTMLElement

    const firstFocusable = containerRef.current.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (firstFocusable) {
      firstFocusable.focus()
    }
  }, [enabled])

  const deactivate = React.useCallback(() => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
  }, [])

  React.useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !containerRef.current) return

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )

      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled])

  return {
    containerRef,
    activate,
    deactivate
  }
}