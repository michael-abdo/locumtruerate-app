/**
 * Unified Cross-Platform Modal Component
 * 
 * This component provides a unified Modal interface that works across
 * both web (React) and mobile (React Native) platforms.
 */

import React from 'react'
import { isWeb } from './button-cross-platform'

// Cross-platform types
export interface CrossPlatformModalProps {
  children: React.ReactNode
  visible: boolean
  onClose?: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position?: 'center' | 'top' | 'bottom'
  overlay?: boolean
  closeOnOverlayPress?: boolean
  closeOnEscape?: boolean
  animationType?: 'none' | 'slide' | 'fade'
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  testID?: string
  
  // Platform-specific props
  className?: string // Web only
  style?: any // React Native style object
}

// Platform-specific imports
let Modal: any
let View: any
let TouchableOpacity: any
let Text: any
let Dimensions: any

// Only import React Native in non-web environments
if (!isWeb && typeof window === 'undefined') {
  try {
    const RN = require('react-native')
    Modal = RN.Modal
    View = RN.View
    TouchableOpacity = RN.TouchableOpacity
    Text = RN.Text
    Dimensions = RN.Dimensions
  } catch (e) {
    // Fallback for when React Native is not available
    Modal = 'div'
    View = 'div'
    TouchableOpacity = 'button'
    Text = 'span'
    Dimensions = { get: () => ({ width: 375, height: 812 }) }
  }
} else {
  // Web fallbacks
  Modal = 'div'
  View = 'div'
  TouchableOpacity = 'button'
  Text = 'span'
  Dimensions = { get: () => ({ width: 375, height: 812 }) }
}

// Theme configuration for cross-platform styling
export const modalTheme = {
  overlay: {
    web: 'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
    native: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    }
  },
  sizes: {
    sm: {
      web: 'w-full max-w-sm',
      native: { width: '80%', maxWidth: 320 }
    },
    md: {
      web: 'w-full max-w-md',
      native: { width: '90%', maxWidth: 400 }
    },
    lg: {
      web: 'w-full max-w-lg',
      native: { width: '95%', maxWidth: 500 }
    },
    xl: {
      web: 'w-full max-w-xl',
      native: { width: '95%', maxWidth: 600 }
    },
    full: {
      web: 'w-full h-full',
      native: { width: '100%', height: '100%' }
    }
  },
  positions: {
    center: {
      web: 'flex items-center justify-center p-4',
      native: { justifyContent: 'center', alignItems: 'center', padding: 16 }
    },
    top: {
      web: 'flex items-start justify-center pt-16 pb-4 px-4',
      native: { justifyContent: 'flex-start', alignItems: 'center', paddingTop: 64, paddingHorizontal: 16 }
    },
    bottom: {
      web: 'flex items-end justify-center pb-16 pt-4 px-4',
      native: { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 64, paddingHorizontal: 16 }
    }
  },
  content: {
    web: 'bg-white rounded-lg shadow-xl overflow-hidden',
    native: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 8,
      overflow: 'hidden',
    }
  },
  header: {
    web: 'flex items-center justify-between p-6 border-b border-gray-200',
    native: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    }
  },
  title: {
    web: 'text-lg font-semibold text-gray-900',
    native: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      flex: 1,
    }
  },
  closeButton: {
    web: 'text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1',
    native: {
      padding: 8,
      borderRadius: 4,
    }
  },
  body: {
    web: 'p-6',
    native: { padding: 24 }
  }
}

// Utility function to create modal styles
export const createModalStyle = (
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full' = 'md',
  position: 'center' | 'top' | 'bottom' = 'center'
) => {
  const theme = modalTheme
  
  if (isWeb) {
    // Web: Return className strings
    return {
      overlay: `${theme.overlay.web} ${theme.positions[position].web}`,
      content: `${theme.content.web} ${theme.sizes[size].web}`,
      header: theme.header.web,
      title: theme.title.web,
      closeButton: theme.closeButton.web,
      body: theme.body.web,
    }
  } else {
    // React Native: Return style objects
    return {
      overlay: {
        ...theme.overlay.native,
        ...theme.positions[position].native,
      },
      content: {
        ...theme.content.native,
        ...theme.sizes[size].native,
      },
      header: theme.header.native,
      title: theme.title.native,
      closeButton: theme.closeButton.native,
      body: theme.body.native,
    }
  }
}

const UnifiedModal = React.forwardRef<any, CrossPlatformModalProps>(
  (
    {
      children,
      visible,
      onClose,
      title,
      size = 'md',
      position = 'center',
      overlay = true,
      closeOnOverlayPress = true,
      closeOnEscape = true,
      animationType = 'fade',
      accessibilityLabel,
      accessibilityHint,
      testID,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const styles = createModalStyle(size, position)
    
    // Handle close events
    const handleClose = () => {
      onClose?.()
    }

    const handleOverlayPress = () => {
      if (closeOnOverlayPress && onClose) {
        handleClose()
      }
    }

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape' && onClose) {
        handleClose()
      }
    }, [closeOnEscape, onClose])

    // Web escape key handling
    React.useEffect(() => {
      if (isWeb && visible && closeOnEscape) {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
      }
    }, [visible, handleKeyDown, closeOnEscape])

    // Prevent body scroll on web when modal is open
    React.useEffect(() => {
      if (isWeb && visible) {
        document.body.style.overflow = 'hidden'
        return () => {
          document.body.style.overflow = 'unset'
        }
      }
    }, [visible])

    if (!visible) return null

    if (isWeb) {
      // Web implementation
      return (
        <div
          ref={ref}
          className={`${styles.overlay} ${className || ''}`.trim()}
          style={style}
          onClick={handleOverlayPress}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-describedby={accessibilityHint}
          role="dialog"
          aria-modal="true"
          {...props}
        >
          <div
            className={styles.content}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                {onClose && (
                  <button
                    className={styles.closeButton}
                    onClick={handleClose}
                    aria-label="Close modal"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            )}
            <div className={styles.body}>
              {children}
            </div>
          </div>
        </div>
      )
    } else {
      // React Native implementation
      return (
        <Modal
          ref={ref}
          visible={visible}
          transparent={overlay}
          animationType={animationType}
          onRequestClose={handleClose}
          testID={testID}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint={accessibilityHint}
          {...props}
        >
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={handleOverlayPress}
          >
            <TouchableOpacity
              style={[styles.content, style]}
              activeOpacity={1}
              onPress={() => {}} // Prevent event propagation
            >
              {title && (
                <View style={styles.header}>
                  <Text style={styles.title}>{title}</Text>
                  {onClose && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleClose}
                      accessibilityLabel="Close modal"
                      accessibilityRole="button"
                    >
                      <Text style={{ fontSize: 18, color: '#6b7280' }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <View style={styles.body}>
                {children}
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )
    }
  }
)

UnifiedModal.displayName = 'CrossPlatformModal'

export { UnifiedModal as Modal }
export type { CrossPlatformModalProps as ModalProps }