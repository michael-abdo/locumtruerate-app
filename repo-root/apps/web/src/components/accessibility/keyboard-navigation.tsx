'use client'

import * as React from 'react'

// Hook for managing keyboard navigation
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = React.useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Common navigation keys
      if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Space'].includes(event.key)) {
        setIsKeyboardUser(true)
      }
    }

    const handleMouseDown = () => {
      setIsKeyboardUser(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return { isKeyboardUser }
}

// Hook for arrow key navigation
interface UseArrowNavigationOptions {
  items: number
  currentIndex: number
  onIndexChange: (index: number) => void
  loop?: boolean
  horizontal?: boolean
}

export const useArrowNavigation = ({
  items,
  currentIndex,
  onIndexChange,
  loop = true,
  horizontal = false,
}: UseArrowNavigationOptions) => {
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    const { key } = event
    
    let nextIndex = currentIndex

    if (horizontal) {
      // Horizontal navigation (left/right)
      if (key === 'ArrowLeft') {
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = loop ? items - 1 : 0
        }
      } else if (key === 'ArrowRight') {
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= items) {
          nextIndex = loop ? 0 : items - 1
        }
      }
    } else {
      // Vertical navigation (up/down)
      if (key === 'ArrowUp') {
        event.preventDefault()
        nextIndex = currentIndex - 1
        if (nextIndex < 0) {
          nextIndex = loop ? items - 1 : 0
        }
      } else if (key === 'ArrowDown') {
        event.preventDefault()
        nextIndex = currentIndex + 1
        if (nextIndex >= items) {
          nextIndex = loop ? 0 : items - 1
        }
      }
    }

    // Handle Home and End keys
    if (key === 'Home') {
      event.preventDefault()
      nextIndex = 0
    } else if (key === 'End') {
      event.preventDefault()
      nextIndex = items - 1
    }

    if (nextIndex !== currentIndex) {
      onIndexChange(nextIndex)
    }
  }, [currentIndex, items, onIndexChange, loop, horizontal])

  return { handleKeyDown }
}

// Hook for roving tabindex pattern
export const useRovingTabIndex = (itemCount: number) => {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const itemRefs = React.useRef<(HTMLElement | null)[]>([])

  const getTabIndex = React.useCallback((index: number) => {
    return index === activeIndex ? 0 : -1
  }, [activeIndex])

  const setActiveItem = React.useCallback((index: number) => {
    if (index >= 0 && index < itemCount) {
      setActiveIndex(index)
      itemRefs.current[index]?.focus()
    }
  }, [itemCount])

  const { handleKeyDown } = useArrowNavigation({
    items: itemCount,
    currentIndex: activeIndex,
    onIndexChange: setActiveItem,
  })

  const registerItem = React.useCallback((index: number) => {
    return (element: HTMLElement | null) => {
      itemRefs.current[index] = element
    }
  }, [])

  return {
    activeIndex,
    getTabIndex,
    setActiveItem,
    handleKeyDown,
    registerItem,
  }
}

// Component for keyboard navigation hints
interface KeyboardHintProps {
  keys: string[]
  description: string
  className?: string
}

export const KeyboardHint: React.FC<KeyboardHintProps> = ({
  keys,
  description,
  className,
}) => {
  return (
    <div className={`text-xs text-muted-foreground ${className}`}>
      <span className="sr-only">Keyboard shortcut: </span>
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && ' + '}
          <kbd className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
            {key}
          </kbd>
        </React.Fragment>
      ))}
      <span className="ml-2">{description}</span>
    </div>
  )
}

// Hook for global keyboard shortcuts
interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  altKey?: boolean
  shiftKey?: boolean
  metaKey?: boolean
  handler: (event: KeyboardEvent) => void
  description?: string
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      shortcuts.forEach(shortcut => {
        const {
          key,
          ctrlKey = false,
          altKey = false,
          shiftKey = false,
          metaKey = false,
          handler
        } = shortcut

        if (
          event.key.toLowerCase() === key.toLowerCase() &&
          event.ctrlKey === ctrlKey &&
          event.altKey === altKey &&
          event.shiftKey === shiftKey &&
          event.metaKey === metaKey
        ) {
          event.preventDefault()
          handler(event)
        }
      })
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])

  return shortcuts
}

// Component for keyboard shortcuts help
interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onClose: () => void
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  shortcuts,
  isOpen,
  onClose,
}) => {
  React.useEffect(() => {
    if (isOpen) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = []
    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.altKey) keys.push('Alt')
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.metaKey) keys.push('Cmd')
    keys.push(shortcut.key.toUpperCase())
    return keys
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <h2 id="shortcuts-title" className="text-lg font-semibold mb-4">
          Keyboard Shortcuts
        </h2>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {shortcuts
            .filter(shortcut => shortcut.description)
            .map((shortcut, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{shortcut.description}</span>
                <KeyboardHint 
                  keys={formatShortcut(shortcut)}
                  description=""
                />
              </div>
            ))
          }
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for managing focus restoration
export const useFocusRestore = () => {
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  const storeFocus = React.useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = React.useCallback(() => {
    if (previousActiveElement.current && document.contains(previousActiveElement.current)) {
      previousActiveElement.current.focus()
    }
  }, [])

  return { storeFocus, restoreFocus }
}

// Hook for managing focus within a container
export const useFocusManagement = (containerRef: React.RefObject<HTMLElement>) => {
  const focusFirst = React.useCallback(() => {
    if (!containerRef.current) return

    const focusableElement = containerRef.current.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElement) {
      focusableElement.focus()
    }
  }, [containerRef])

  const focusLast = React.useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }, [containerRef])

  const containsFocus = React.useCallback(() => {
    return containerRef.current?.contains(document.activeElement) ?? false
  }, [containerRef])

  return {
    focusFirst,
    focusLast,
    containsFocus,
  }
}