'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Eye, 
  Type, 
  Mouse, 
  Keyboard, 
  Volume2, 
  VolumeX,
  Contrast,
  Zap,
  RotateCcw,
  X,
  Accessibility,
  Monitor,
  Smartphone,
  Info
} from 'lucide-react'
import { Button } from '@locumtruerate/ui'
import { cn } from '@/lib/utils'
import { useAccessibility } from './accessibility-provider'
import { z } from 'zod'

interface AccessibilitySettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const settingsConfig = [
  {
    key: 'reducedMotion' as const,
    title: 'Reduced Motion',
    description: 'Minimize animations and transitions for a calmer experience',
    icon: Zap,
    category: 'Motion'
  },
  {
    key: 'highContrast' as const,
    title: 'High Contrast',
    description: 'Increase contrast between text and background for better readability',
    icon: Contrast,
    category: 'Visual'
  },
  {
    key: 'largeText' as const,
    title: 'Large Text',
    description: 'Increase font size throughout the application',
    icon: Type,
    category: 'Visual'
  },
  {
    key: 'focusVisible' as const,
    title: 'Enhanced Focus',
    description: 'Show clear focus indicators when navigating with keyboard',
    icon: Eye,
    category: 'Navigation'
  },
  {
    key: 'keyboardNavigation' as const,
    title: 'Keyboard Navigation',
    description: 'Optimize for keyboard-only navigation',
    icon: Keyboard,
    category: 'Navigation'
  },
  {
    key: 'announcements' as const,
    title: 'Screen Reader Announcements',
    description: 'Enable screen reader announcements for status changes',
    icon: Volume2,
    category: 'Audio'
  }
]

function SettingToggle({ 
  setting, 
  isEnabled, 
  onToggle, 
  disabled = false 
}: {
  setting: typeof settingsConfig[0]
  isEnabled: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  const Icon = setting.icon

  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-lg border transition-colors',
      isEnabled 
        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <div className={cn(
        'p-2 rounded-lg',
        isEnabled 
          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {setting.title}
          </h3>
          <button
            onClick={onToggle}
            disabled={disabled}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              isEnabled 
                ? 'bg-blue-600' 
                : 'bg-gray-300 dark:bg-gray-600',
              disabled && 'cursor-not-allowed'
            )}
            role="switch"
            aria-checked={isEnabled}
            aria-labelledby={`${setting.key}-label`}
            aria-describedby={`${setting.key}-description`}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
        
        <p 
          id={`${setting.key}-description`}
          className="text-sm text-gray-600 dark:text-gray-400"
        >
          {setting.description}
        </p>
      </div>
    </div>
  )
}

// Validation schema for category selection
const categorySchema = z.enum(['All', 'Visual', 'Motion', 'Navigation', 'Audio'])

export function AccessibilitySettingsPanel({ 
  isOpen, 
  onClose, 
  className 
}: AccessibilitySettingsPanelProps) {
  const { settings, updateSetting, resetSettings, announce } = useAccessibility()
  const [activeCategory, setActiveCategory] = useState<z.infer<typeof categorySchema>>('All')

  const categories = ['All', 'Visual', 'Motion', 'Navigation', 'Audio']
  
  const filteredSettings = activeCategory === 'All' 
    ? settingsConfig 
    : settingsConfig.filter(setting => setting.category === activeCategory)

  const handleToggle = (key: keyof typeof settings) => {
    // Validate the setting key
    const validSettings = [
      'reducedMotion',
      'highContrast', 
      'largeText',
      'focusVisible',
      'keyboardNavigation',
      'announcements'
    ]
    
    if (!validSettings.includes(key)) {
      console.error('Invalid accessibility setting:', key)
      return
    }
    
    updateSetting(key, !settings[key])
  }

  const handleReset = () => {
    try {
      resetSettings()
      announce('All accessibility settings have been reset to defaults', 'assertive')
    } catch (error) {
      console.error('Error resetting accessibility settings:', error)
      announce('Error resetting settings. Please try again.', 'assertive')
    }
  }

  const detectSystemPreferences = () => {
    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
      
      if (prefersReducedMotion) {
        updateSetting('reducedMotion', true)
      }
      if (prefersHighContrast) {
        updateSetting('highContrast', true)
      }
      
      announce('System preferences detected and applied', 'polite')
    } catch (error) {
      console.error('Error detecting system preferences:', error)
      announce('Unable to detect system preferences', 'polite')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            'w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-hidden',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Accessibility className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Accessibility Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Customize your experience for better accessibility
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close accessibility settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={detectSystemPreferences}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
                Detect System Preferences
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </Button>
            </div>
          </div>

          {/* Category Filters */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    activeCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Settings List */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {filteredSettings.map((setting) => (
                <SettingToggle
                  key={setting.key}
                  setting={setting}
                  isEnabled={settings[setting.key]}
                  onToggle={() => handleToggle(setting.key)}
                />
              ))}
            </div>
          </div>

          {/* Information */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">
                  These settings are saved locally and will persist across sessions. 
                  Some changes may require a page refresh to take full effect.
                </p>
                <p>
                  For additional accessibility features, please check your browser and 
                  operating system settings.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span>Need help? </span>
                <a 
                  href="/support/accessibility" 
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Contact accessibility support
                </a>
              </div>
              
              <Button onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Floating accessibility button component
interface AccessibilityButtonProps {
  onClick: () => void
  className?: string
}

export function AccessibilityButton({ onClick, className }: AccessibilityButtonProps) {
  const { settings } = useAccessibility()
  const hasCustomSettings = Object.values(settings).some((value, index) => 
    value !== Object.values({
      reducedMotion: false,
      highContrast: false,
      largeText: false,
      screenReader: false,
      keyboardNavigation: true,
      focusVisible: true,
      announcements: true
    })[index]
  )

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'fixed bottom-4 right-4 z-50 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        hasCustomSettings && 'ring-2 ring-blue-300',
        className
      )}
      aria-label="Open accessibility settings"
      title="Accessibility Settings"
    >
      <Accessibility className="w-6 h-6" />
      {hasCustomSettings && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
      )}
    </motion.button>
  )
}

export default AccessibilitySettingsPanel