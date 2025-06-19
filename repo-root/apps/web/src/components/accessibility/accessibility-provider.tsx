'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface AccessibilitySettings {
  reducedMotion: boolean
  highContrast: boolean
  largeText: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusVisible: boolean
  announcements: boolean
}

interface AccessibilityContextType {
  settings: AccessibilitySettings
  updateSetting: (key: keyof AccessibilitySettings, value: boolean) => void
  announce: (message: string, priority?: 'polite' | 'assertive') => void
  resetSettings: () => void
  isLoading: boolean
}

const defaultSettings: AccessibilitySettings = {
  reducedMotion: false,
  highContrast: false,
  largeText: false,
  screenReader: false,
  keyboardNavigation: true,
  focusVisible: true,
  announcements: true
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('accessibility-settings')
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        setSettings({ ...defaultSettings, ...parsedSettings })
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Create screen reader announcer element
  useEffect(() => {
    const announcerElement = document.createElement('div')
    announcerElement.id = 'accessibility-announcer'
    announcerElement.setAttribute('aria-live', 'polite')
    announcerElement.setAttribute('aria-atomic', 'true')
    announcerElement.style.position = 'absolute'
    announcerElement.style.left = '-10000px'
    announcerElement.style.width = '1px'
    announcerElement.style.height = '1px'
    announcerElement.style.overflow = 'hidden'
    
    document.body.appendChild(announcerElement)
    setAnnouncer(announcerElement)

    return () => {
      if (document.body.contains(announcerElement)) {
        document.body.removeChild(announcerElement)
      }
    }
  }, [])

  // Detect user preferences
  useEffect(() => {
    const detectPreferences = () => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      if (prefersReducedMotion || prefersHighContrast) {
        setSettings(prev => ({
          ...prev,
          reducedMotion: prefersReducedMotion,
          highContrast: prefersHighContrast
        }))
      }
    }

    detectPreferences()

    // Listen for changes in user preferences
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)')

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      updateSetting('reducedMotion', e.matches)
    }

    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      updateSetting('highContrast', e.matches)
    }

    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)
    highContrastQuery.addEventListener('change', handleHighContrastChange)

    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange)
      highContrastQuery.removeEventListener('change', handleHighContrastChange)
    }
  }, [])

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement

    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms')
      root.style.setProperty('--transition-duration', '0.01ms')
      root.classList.add('reduce-motion')
    } else {
      root.style.removeProperty('--animation-duration')
      root.style.removeProperty('--transition-duration')
      root.classList.remove('reduce-motion')
    }

    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation')
    } else {
      root.classList.remove('keyboard-navigation')
    }
  }, [settings])

  // Save settings to localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('accessibility-settings', JSON.stringify(settings))
      } catch (error) {
        console.warn('Failed to save accessibility settings:', error)
      }
    }
  }, [settings, isLoading])

  const updateSetting = useCallback((key: keyof AccessibilitySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    
    // Announce setting changes
    if (announcer && settings.announcements) {
      const settingNames = {
        reducedMotion: 'Reduced motion',
        highContrast: 'High contrast',
        largeText: 'Large text',
        screenReader: 'Screen reader support',
        keyboardNavigation: 'Keyboard navigation',
        focusVisible: 'Focus indicators',
        announcements: 'Announcements'
      }
      
      const message = `${settingNames[key]} ${value ? 'enabled' : 'disabled'}`
      announce(message)
    }
  }, [announcer, settings.announcements])

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer || !settings.announcements) return

    announcer.setAttribute('aria-live', priority)
    announcer.textContent = message

    // Clear the message after a short delay to allow for re-announcements
    setTimeout(() => {
      if (announcer.textContent === message) {
        announcer.textContent = ''
      }
    }, 1000)
  }, [announcer, settings.announcements])

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings)
    announce('Accessibility settings reset to defaults')
  }, [announce])

  const value: AccessibilityContextType = {
    settings,
    updateSetting,
    announce,
    resetSettings,
    isLoading
  }

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return context
}

// CSS classes for accessibility features
export const accessibilityStyles = `
/* Reduced Motion */
.reduce-motion *,
.reduce-motion *::before,
.reduce-motion *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
  scroll-behavior: auto !important;
}

/* High Contrast */
.high-contrast {
  --background: hsl(0, 0%, 0%);
  --foreground: hsl(0, 0%, 100%);
  --primary: hsl(210, 100%, 70%);
  --primary-foreground: hsl(0, 0%, 0%);
  --muted: hsl(0, 0%, 20%);
  --muted-foreground: hsl(0, 0%, 90%);
  --border: hsl(0, 0%, 50%);
  --input: hsl(0, 0%, 30%);
  --ring: hsl(210, 100%, 70%);
  filter: contrast(150%);
}

.high-contrast img:not([alt=""]) {
  filter: contrast(120%) brightness(110%);
}

/* Large Text */
.large-text {
  font-size: 18px;
}

.large-text h1 { font-size: 2.5rem; }
.large-text h2 { font-size: 2rem; }
.large-text h3 { font-size: 1.75rem; }
.large-text h4 { font-size: 1.5rem; }
.large-text h5 { font-size: 1.25rem; }
.large-text h6 { font-size: 1.125rem; }

.large-text .text-xs { font-size: 0.875rem; }
.large-text .text-sm { font-size: 1rem; }
.large-text .text-base { font-size: 1.125rem; }
.large-text .text-lg { font-size: 1.25rem; }
.large-text .text-xl { font-size: 1.5rem; }

/* Focus Visible */
.focus-visible *:focus-visible {
  outline: 3px solid hsl(210, 100%, 70%);
  outline-offset: 2px;
}

.focus-visible button:focus-visible,
.focus-visible a:focus-visible,
.focus-visible input:focus-visible,
.focus-visible textarea:focus-visible,
.focus-visible select:focus-visible {
  outline: 3px solid hsl(210, 100%, 70%);
  outline-offset: 2px;
  box-shadow: 0 0 0 2px hsl(210, 100%, 70%, 0.3);
}

/* Keyboard Navigation */
.keyboard-navigation {
  --focus-ring-width: 3px;
  --focus-ring-color: hsl(210, 100%, 70%);
  --focus-ring-offset: 2px;
}

.keyboard-navigation [tabindex]:focus,
.keyboard-navigation button:focus,
.keyboard-navigation a:focus,
.keyboard-navigation input:focus,
.keyboard-navigation textarea:focus,
.keyboard-navigation select:focus {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

/* Skip Links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: hsl(210, 100%, 70%);
  color: white;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Screen Reader Focusable */
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`