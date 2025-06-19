/**
 * Cross-Platform UI Components
 * 
 * This file exports all unified cross-platform components that work seamlessly
 * across web (React) and mobile (React Native) platforms.
 * 
 * Components achieve 85%+ code reusability by:
 * - Using platform-agnostic prop interfaces
 * - Implementing platform-specific rendering logic
 * - Providing consistent styling systems
 * - Supporting comprehensive accessibility
 */

// Core cross-platform components
export {
  Button,
  ButtonProps,
  createButtonStyle,
  createTextStyle,
  buttonTheme,
  isWeb,
  isNative
} from './components/ui/button-unified'

export {
  Input,
  InputProps,
  createInputStyle,
  inputTheme
} from './components/ui/input-unified'

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardProps,
  createCardStyle,
  cardTheme
} from './components/ui/card-unified'

export {
  Text,
  TextProps,
  createTextStyle as createUnifiedTextStyle,
  textTheme
} from './components/ui/text-unified'

export {
  Modal,
  ModalProps,
  createModalStyle,
  modalTheme
} from './components/ui/modal-unified'

// Platform detection utilities
export { isWeb as isPlatformWeb, isNative as isPlatformNative } from './components/ui/button-cross-platform'

// Types for cross-platform development
export interface CrossPlatformTheme {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    error: string
    success: string
    warning: string
    text: {
      primary: string
      secondary: string
      disabled: string
    }
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  typography: {
    sizes: {
      xs: number
      sm: number
      md: number
      lg: number
      xl: number
    }
    weights: {
      normal: string
      medium: string
      semibold: string
      bold: string
    }
  }
  borderRadius: {
    sm: number
    md: number
    lg: number
    xl: number
  }
}

// Default cross-platform theme
export const defaultTheme: CrossPlatformTheme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#6b7280',
    background: '#ffffff',
    surface: '#f9fafb',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      disabled: '#9ca3af'
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  borderRadius: {
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12
  }
}

// Component composition patterns for high reusability
export interface CrossPlatformFormFieldProps {
  label?: string
  error?: string
  description?: string
  required?: boolean
}

export interface CrossPlatformLayoutProps {
  children: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
}

// Utility functions for cross-platform development
export const createUnifiedStyle = (webClasses: string, nativeStyle: any) => {
  return isWeb ? webClasses : nativeStyle
}

export const createResponsiveValue = <T>(
  mobile: T,
  tablet?: T,
  desktop?: T
): T => {
  // In React Native, we only use mobile values
  // In web, we can implement responsive logic
  if (!isWeb) return mobile
  
  // Basic responsive logic for web
  // This could be enhanced with media queries or container queries
  return desktop || tablet || mobile
}

// Performance optimization utilities
export const memo = <P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return React.memo(Component, propsAreEqual)
}

// Re-export React for convenience
import React from 'react'
export { React }

/**
 * Cross-Platform Component Development Guidelines
 * 
 * To achieve the 85% reusability target:
 * 
 * 1. **Platform Detection**: Use isWeb/isNative for conditional rendering
 * 2. **Unified Props**: Define props that work across platforms
 * 3. **Style Abstraction**: Use theme objects instead of direct styles
 * 4. **Accessibility**: Include accessibility props for both platforms
 * 5. **Performance**: Use React.memo and avoid unnecessary re-renders
 * 6. **Testing**: Test components on both platforms
 * 
 * Example usage:
 * ```tsx
 * import { Button, Input, Card } from '@locumtruerate/ui/cross-platform'
 * 
 * function MyForm() {
 *   return (
 *     <Card variant="elevated" padding="md">
 *       <Input
 *         label="Email"
 *         placeholder="Enter your email"
 *         keyboardType="email-address"
 *         required
 *       />
 *       <Button
 *         variant="default"
 *         size="lg"
 *         onPress={() => console.log('Submit')}
 *       >
 *         Submit
 *       </Button>
 *     </Card>
 *   )
 * }
 * ```
 */