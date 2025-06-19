/**
 * Unified Cross-Platform Card Component
 * 
 * This component provides a unified Card interface that works across
 * both web (React) and mobile (React Native) platforms.
 */

import React from 'react'
import { isWeb } from './button-cross-platform'

// Cross-platform types
export interface CrossPlatformCardProps {
  children: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  rounded?: boolean
  shadow?: boolean
  
  // Event handlers
  onPress?: () => void
  onLongPress?: () => void
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
  testID?: string
  
  // Platform-specific props
  className?: string // Web only
  style?: any // React Native style object
}

// Platform-specific imports
let TouchableOpacity: any
let View: any

if (!isWeb) {
  try {
    const RN = require('react-native')
    TouchableOpacity = RN.TouchableOpacity
    View = RN.View
  } catch (e) {
    // Fallback for when React Native is not available
    TouchableOpacity = 'div'
    View = 'div'
  }
}

// Theme configuration for cross-platform styling
export const cardTheme = {
  variants: {
    default: {
      web: 'bg-white border border-gray-200',
      native: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      }
    },
    outlined: {
      web: 'bg-white border-2 border-gray-300',
      native: {
        backgroundColor: '#ffffff',
        borderWidth: 2,
        borderColor: '#d1d5db',
      }
    },
    elevated: {
      web: 'bg-white shadow-lg border border-gray-100',
      native: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#f3f4f6',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4, // Android shadow
      }
    },
    flat: {
      web: 'bg-gray-50 border-0',
      native: {
        backgroundColor: '#f9fafb',
        borderWidth: 0,
      }
    }
  },
  padding: {
    none: {
      web: 'p-0',
      native: { padding: 0 }
    },
    sm: {
      web: 'p-3',
      native: { padding: 12 }
    },
    md: {
      web: 'p-4',
      native: { padding: 16 }
    },
    lg: {
      web: 'p-6',
      native: { padding: 24 }
    }
  },
  base: {
    web: 'rounded-lg overflow-hidden',
    native: {
      borderRadius: 8,
      overflow: 'hidden',
    }
  },
  interactive: {
    web: 'cursor-pointer hover:shadow-md transition-shadow duration-200',
    native: {
      // activeOpacity will be handled by TouchableOpacity
    }
  }
}

// Utility function to create card styles
export const createCardStyle = (
  variant: 'default' | 'outlined' | 'elevated' | 'flat' = 'default',
  padding: 'none' | 'sm' | 'md' | 'lg' = 'md',
  rounded: boolean = true,
  shadow: boolean = false,
  interactive: boolean = false
) => {
  const theme = cardTheme
  
  if (isWeb) {
    // Web: Return className string
    const baseClasses = rounded ? theme.base.web : 'overflow-hidden'
    const variantClasses = theme.variants[variant].web
    const paddingClasses = theme.padding[padding].web
    const shadowClasses = shadow && variant !== 'elevated' ? 'shadow-md' : ''
    const interactiveClasses = interactive ? theme.interactive.web : ''
    
    return `${baseClasses} ${variantClasses} ${paddingClasses} ${shadowClasses} ${interactiveClasses}`.trim()
  } else {
    // React Native: Return style object
    const baseStyle = rounded ? theme.base.native : { overflow: 'hidden' }
    const variantStyle = theme.variants[variant].native
    const paddingStyle = theme.padding[padding].native
    
    // Add shadow for non-elevated variants if requested
    const shadowStyle = shadow && variant !== 'elevated' ? {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    } : {}
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...paddingStyle,
      ...shadowStyle,
    }
  }
}

const Card = React.forwardRef<any, CrossPlatformCardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      rounded = true,
      shadow = false,
      onPress,
      onLongPress,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      testID,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const isInteractive = !!(onPress || onLongPress)
    const cardStyle = createCardStyle(variant, padding, rounded, shadow, isInteractive)
    
    // Handle press events
    const handlePress = () => {
      onPress?.()
    }

    const handleLongPress = () => {
      onLongPress?.()
    }

    // Accessibility props
    const accessibilityProps = {
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole: accessibilityRole || (isInteractive ? 'button' : 'group'),
      accessible: true,
    }

    if (isWeb) {
      // Web implementation
      const Component = isInteractive ? 'button' : 'div'
      
      return (
        <Component
          ref={ref}
          className={`${cardStyle} ${className || ''}`.trim()}
          style={style}
          onClick={isInteractive ? handlePress : undefined}
          onContextMenu={isInteractive ? handleLongPress : undefined}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-describedby={accessibilityHint}
          role={accessibilityRole}
          {...props}
        >
          {children}
        </Component>
      )
    } else {
      // React Native implementation
      if (isInteractive) {
        return (
          <TouchableOpacity
            ref={ref}
            style={[cardStyle, style]}
            onPress={handlePress}
            onLongPress={handleLongPress}
            testID={testID}
            activeOpacity={0.8}
            {...accessibilityProps}
            {...props}
          >
            {children}
          </TouchableOpacity>
        )
      } else {
        return (
          <View
            ref={ref}
            style={[cardStyle, style]}
            testID={testID}
            {...accessibilityProps}
            {...props}
          >
            {children}
          </View>
        )
      }
    }
  }
)

Card.displayName = 'CrossPlatformCard'

// Header component
const CardHeader = React.forwardRef<any, CrossPlatformCardProps>(
  ({ children, className, style, ...props }, ref) => {
    const headerStyle = isWeb 
      ? 'flex flex-col space-y-1.5 p-6 pb-0'
      : { flexDirection: 'column', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }

    if (isWeb) {
      return (
        <div
          ref={ref}
          className={`${headerStyle} ${className || ''}`.trim()}
          style={style}
          {...props}
        >
          {children}
        </div>
      )
    } else {
      return (
        <View
          ref={ref}
          style={[headerStyle, style]}
          {...props}
        >
          {children}
        </View>
      )
    }
  }
)
CardHeader.displayName = 'CardHeader'

// Content component
const CardContent = React.forwardRef<any, CrossPlatformCardProps>(
  ({ children, className, style, ...props }, ref) => {
    const contentStyle = isWeb 
      ? 'p-6 pt-0'
      : { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }

    if (isWeb) {
      return (
        <div
          ref={ref}
          className={`${contentStyle} ${className || ''}`.trim()}
          style={style}
          {...props}
        >
          {children}
        </div>
      )
    } else {
      return (
        <View
          ref={ref}
          style={[contentStyle, style]}
          {...props}
        >
          {children}
        </View>
      )
    }
  }
)
CardContent.displayName = 'CardContent'

// Footer component
const CardFooter = React.forwardRef<any, CrossPlatformCardProps>(
  ({ children, className, style, ...props }, ref) => {
    const footerStyle = isWeb 
      ? 'flex items-center p-6 pt-0'
      : { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 }

    if (isWeb) {
      return (
        <div
          ref={ref}
          className={`${footerStyle} ${className || ''}`.trim()}
          style={style}
          {...props}
        >
          {children}
        </div>
      )
    } else {
      return (
        <View
          ref={ref}
          style={[footerStyle, style]}
          {...props}
        >
          {children}
        </View>
      )
    }
  }
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardContent, CardFooter }
export type { CrossPlatformCardProps as CardProps }