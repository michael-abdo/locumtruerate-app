/**
 * Cross-Platform Button Component
 * 
 * This component provides a unified Button interface that works across
 * both web (React) and mobile (React Native) platforms.
 * 
 * Key features:
 * - Platform-agnostic props interface
 * - Consistent styling variants
 * - Accessibility support
 * - Loading states
 * - Touch feedback
 */

import React from 'react'

// Platform detection helper - determine if we're running in web or React Native
export const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined'
export const isNative = !isWeb

// Cross-platform types
export interface ButtonVariant {
  default: string
  destructive: string
  outline: string
  secondary: string
  ghost: string
  link: string
}

export interface ButtonSize {
  default: string
  sm: string
  lg: string
  icon: string
}

export interface CrossPlatformButtonProps {
  children: React.ReactNode
  variant?: keyof ButtonVariant
  size?: keyof ButtonSize
  disabled?: boolean
  loading?: boolean
  onPress?: () => void
  onLongPress?: () => void
  testID?: string
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
  
  // Platform-specific props
  className?: string // Web only
  style?: any // React Native style object
}

// Platform-specific theme configuration

// Theme configuration for cross-platform styling
export const buttonTheme = {
  variants: {
    default: {
      web: 'bg-blue-600 text-white hover:bg-blue-700 border-0',
      native: {
        backgroundColor: '#2563eb',
        borderWidth: 0,
      },
      textStyle: {
        web: 'text-white font-medium',
        native: {
          color: '#ffffff',
          fontWeight: '500',
        }
      }
    },
    destructive: {
      web: 'bg-red-600 text-white hover:bg-red-700 border-0',
      native: {
        backgroundColor: '#dc2626',
        borderWidth: 0,
      },
      textStyle: {
        web: 'text-white font-medium',
        native: {
          color: '#ffffff',
          fontWeight: '500',
        }
      }
    },
    outline: {
      web: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50',
      native: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#d1d5db',
      },
      textStyle: {
        web: 'text-gray-700 font-medium',
        native: {
          color: '#374151',
          fontWeight: '500',
        }
      }
    },
    secondary: {
      web: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border-0',
      native: {
        backgroundColor: '#f3f4f6',
        borderWidth: 0,
      },
      textStyle: {
        web: 'text-gray-900 font-medium',
        native: {
          color: '#111827',
          fontWeight: '500',
        }
      }
    },
    ghost: {
      web: 'bg-transparent text-gray-700 hover:bg-gray-100 border-0',
      native: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      textStyle: {
        web: 'text-gray-700 font-medium',
        native: {
          color: '#374151',
          fontWeight: '500',
        }
      }
    },
    link: {
      web: 'bg-transparent text-blue-600 hover:text-blue-800 border-0 underline',
      native: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      textStyle: {
        web: 'text-blue-600 font-medium underline',
        native: {
          color: '#2563eb',
          fontWeight: '500',
          textDecorationLine: 'underline',
        }
      }
    }
  },
  sizes: {
    default: {
      web: 'h-10 px-4 py-2 text-sm',
      native: {
        height: 40,
        paddingHorizontal: 16,
        paddingVertical: 8,
      },
      textStyle: {
        web: 'text-sm',
        native: {
          fontSize: 14,
        }
      }
    },
    sm: {
      web: 'h-9 px-3 py-2 text-sm',
      native: {
        height: 36,
        paddingHorizontal: 12,
        paddingVertical: 8,
      },
      textStyle: {
        web: 'text-sm',
        native: {
          fontSize: 14,
        }
      }
    },
    lg: {
      web: 'h-11 px-8 py-3 text-base',
      native: {
        height: 44,
        paddingHorizontal: 32,
        paddingVertical: 12,
      },
      textStyle: {
        web: 'text-base',
        native: {
          fontSize: 16,
        }
      }
    },
    icon: {
      web: 'h-10 w-10 p-0',
      native: {
        height: 40,
        width: 40,
        padding: 0,
      },
      textStyle: {
        web: 'text-sm',
        native: {
          fontSize: 14,
        }
      }
    }
  },
  base: {
    web: 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
    native: {
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    }
  }
}

// Utility function to combine styles
export const createButtonStyle = (
  variant: keyof ButtonVariant = 'default',
  size: keyof ButtonSize = 'default',
  disabled?: boolean,
  loading?: boolean
) => {
  const theme = buttonTheme
  
  if (isWeb) {
    // Web: Return className string
    const baseClasses = theme.base.web
    const variantClasses = theme.variants[variant].web
    const sizeClasses = theme.sizes[size].web
    const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
    
    return `${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses}`.trim()
  } else {
    // React Native: Return style object
    const baseStyle = theme.base.native
    const variantStyle = theme.variants[variant].native
    const sizeStyle = theme.sizes[size].native
    const disabledStyle = disabled || loading ? { opacity: 0.5 } : {}
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyle,
      ...disabledStyle,
    }
  }
}

// Utility function for text styles
export const createTextStyle = (
  variant: keyof ButtonVariant = 'default',
  size: keyof ButtonSize = 'default'
) => {
  const theme = buttonTheme
  
  if (isWeb) {
    // Web: Return className string
    const variantClasses = theme.variants[variant].textStyle.web
    const sizeClasses = theme.sizes[size].textStyle.web
    
    return `${variantClasses} ${sizeClasses}`.trim()
  } else {
    // React Native: Return style object
    const variantStyle = theme.variants[variant].textStyle.native
    const sizeStyle = theme.sizes[size].textStyle.native
    
    return {
      ...variantStyle,
      ...sizeStyle,
    }
  }
}

// Loading spinner component
export const LoadingSpinner = () => {
  if (isWeb) {
    return (
      <span 
        className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
        aria-hidden="true"
      />
    )
  } else {
    // Only require React Native in non-web environments
    if (typeof window === 'undefined') {
      try {
        const { ActivityIndicator } = require('react-native')
        return React.createElement(ActivityIndicator, { size: "small", color: "currentColor" })
      } catch (e) {
        // Fallback if React Native is not available
        return React.createElement('div', { 
          style: { 
            width: 16, 
            height: 16, 
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }
        })
      }
    } else {
      // Web fallback when isWeb is somehow false but window exists
      return React.createElement('div', { 
        style: { 
          width: 16, 
          height: 16, 
          border: '2px solid currentColor',
          borderTop: '2px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }
      })
    }
  }
}

// Platform detection variables are already exported above