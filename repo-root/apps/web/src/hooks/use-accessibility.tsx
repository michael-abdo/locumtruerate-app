'use client'

import * as React from 'react'

// Hook for managing accessibility preferences
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = React.useState({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    screenReader: false,
    keyboardNavigation: false,
  })

  React.useEffect(() => {
    // Check for system preferences
    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(min-resolution: 144dpi)'), // Approximate for large text
    }

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        largeText: mediaQueries.largeText.matches,
      }))
    }

    // Initial check
    updatePreferences()

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences)
    })

    // Check for keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setPreferences(prev => ({ ...prev, keyboardNavigation: true }))
      }
    }

    const handleMouseDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: false }))
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences)
      })
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  const updatePreference = React.useCallback((key: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }, [])

  return {
    preferences,
    updatePreference,
  }
}

// Hook for focus management in lists/grids
export const useFocusableList = (itemCount: number, orientation: 'horizontal' | 'vertical' = 'vertical') => {
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const itemRefs = React.useRef<(HTMLElement | null)[]>([])

  const moveFocus = React.useCallback((direction: 'next' | 'previous' | 'first' | 'last') => {
    let newIndex = focusedIndex

    switch (direction) {
      case 'next':
        newIndex = (focusedIndex + 1) % itemCount
        break
      case 'previous':
        newIndex = focusedIndex === 0 ? itemCount - 1 : focusedIndex - 1
        break
      case 'first':
        newIndex = 0
        break
      case 'last':
        newIndex = itemCount - 1
        break
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex)
      itemRefs.current[newIndex]?.focus()
    }
  }, [focusedIndex, itemCount])

  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    const { key } = event

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical') {
          event.preventDefault()
          moveFocus('next')
        }
        break
      case 'ArrowUp':
        if (orientation === 'vertical') {
          event.preventDefault()
          moveFocus('previous')
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal') {
          event.preventDefault()
          moveFocus('next')
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal') {
          event.preventDefault()
          moveFocus('previous')
        }
        break
      case 'Home':
        event.preventDefault()
        moveFocus('first')
        break
      case 'End':
        event.preventDefault()
        moveFocus('last')
        break
    }
  }, [moveFocus, orientation])

  const getItemProps = React.useCallback((index: number) => ({
    ref: (element: HTMLElement | null) => {
      itemRefs.current[index] = element
    },
    tabIndex: index === focusedIndex ? 0 : -1,
    onKeyDown: handleKeyDown,
    onFocus: () => setFocusedIndex(index),
  }), [focusedIndex, handleKeyDown])

  return {
    focusedIndex,
    setFocusedIndex,
    moveFocus,
    getItemProps,
    handleKeyDown,
  }
}

// Hook for announcing status changes to screen readers
export const useStatusAnnouncement = () => {
  const [announcement, setAnnouncement] = React.useState('')
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Clear current announcement to ensure re-reading
    setAnnouncement('')

    // Set new announcement after a brief delay
    timeoutRef.current = setTimeout(() => {
      setAnnouncement(message)
      
      // Clear announcement after it's been read
      timeoutRef.current = setTimeout(() => {
        setAnnouncement('')
      }, 1000)
    }, 100)
  }, [])

  const clearAnnouncement = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setAnnouncement('')
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    announcement,
    announce,
    clearAnnouncement,
  }
}

// Hook for managing form accessibility
export const useFormAccessibility = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const { announce } = useStatusAnnouncement()

  const addError = React.useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }))
    announce(`Error in ${fieldName}: ${error}`, 'assertive')
  }, [announce])

  const removeError = React.useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldName]
      return newErrors
    })
  }, [])

  const clearAllErrors = React.useCallback(() => {
    setErrors({})
  }, [])

  const announceFormSubmission = React.useCallback((success: boolean, message: string) => {
    announce(message, success ? 'polite' : 'assertive')
  }, [announce])

  const getFieldProps = React.useCallback((fieldName: string, label?: string) => {
    const error = errors[fieldName]
    const fieldId = `field-${fieldName}`
    const errorId = error ? `${fieldId}-error` : undefined
    const labelId = label ? `${fieldId}-label` : undefined

    return {
      id: fieldId,
      'aria-invalid': !!error,
      'aria-describedby': errorId,
      'aria-labelledby': labelId,
    }
  }, [errors])

  return {
    errors,
    addError,
    removeError,
    clearAllErrors,
    announceFormSubmission,
    getFieldProps,
  }
}

// Hook for managing page announcements
export const usePageAnnouncements = () => {
  const { announce } = useStatusAnnouncement()

  const announcePageChange = React.useCallback((pageName: string) => {
    announce(`Navigated to ${pageName}`, 'polite')
  }, [announce])

  const announceLoading = React.useCallback((action: string) => {
    announce(`Loading ${action}...`, 'polite')
  }, [announce])

  const announceLoadingComplete = React.useCallback((action: string) => {
    announce(`${action} loaded`, 'polite')
  }, [announce])

  const announceError = React.useCallback((error: string) => {
    announce(`Error: ${error}`, 'assertive')
  }, [announce])

  const announceSuccess = React.useCallback((message: string) => {
    announce(message, 'polite')
  }, [announce])

  return {
    announcePageChange,
    announceLoading,
    announceLoadingComplete,
    announceError,
    announceSuccess,
  }
}

// Hook for accessible modal/dialog management
export const useAccessibleModal = () => {
  const [isOpen, setIsOpen] = React.useState(false)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)
  const modalRef = React.useRef<HTMLElement>(null)

  const openModal = React.useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }, [])

  const closeModal = React.useCallback(() => {
    setIsOpen(false)
    // Restore focus after modal closes
    setTimeout(() => {
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }
    }, 0)
  }, [])

  React.useEffect(() => {
    if (!isOpen) return

    // Focus the modal when it opens
    if (modalRef.current) {
      modalRef.current.focus()
    }

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
      }
    }

    // Handle tab trapping
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )

      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

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

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('keydown', handleTab)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleTab)
    }
  }, [isOpen, closeModal])

  return {
    isOpen,
    openModal,
    closeModal,
    modalRef,
  }
}

// Context for accessibility settings
interface AccessibilityContextType {
  preferences: ReturnType<typeof useAccessibilityPreferences>['preferences']
  updatePreference: ReturnType<typeof useAccessibilityPreferences>['updatePreference']
  announcement: string
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AccessibilityContext = React.createContext<AccessibilityContextType | null>(null)

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreference } = useAccessibilityPreferences()
  const { announcement, announce } = useStatusAnnouncement()

  return (
    <AccessibilityContext.Provider value={{
      preferences,
      updatePreference,
      announcement,
      announce,
    }}>
      {children}
      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  )
}

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext)
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider')
  }
  return context
}