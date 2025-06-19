/**
 * Unified Cross-Platform Text Component
 * 
 * This component provides a unified Text interface that works across
 * both web (React) and mobile (React Native) platforms.
 */

import React from 'react'
import { isWeb } from './button-cross-platform'

// Cross-platform types
export interface CrossPlatformTextProps {
  children: React.ReactNode
  variant?: 'body' | 'heading' | 'subheading' | 'caption' | 'label'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  weight?: 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'warning'
  align?: 'left' | 'center' | 'right' | 'justify'
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  numberOfLines?: number // React Native clamp
  selectable?: boolean
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  accessibilityRole?: string
  testID?: string
  
  // Platform-specific props
  className?: string // Web only
  style?: any // React Native style object
  
  // Web-specific
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label'
}

// Platform-specific imports
let Text: any

if (!isWeb) {
  try {
    const RN = require('react-native')
    Text = RN.Text
  } catch (e) {
    // Fallback for when React Native is not available
    Text = 'span'
  }
}

// Theme configuration for cross-platform styling
export const textTheme = {
  variants: {
    body: {
      web: 'text-base leading-relaxed',
      native: {
        fontSize: 16,
        lineHeight: 24,
      }
    },
    heading: {
      web: 'text-2xl font-bold leading-tight',
      native: {
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
      }
    },
    subheading: {
      web: 'text-lg font-semibold leading-snug',
      native: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 22,
      }
    },
    caption: {
      web: 'text-sm leading-normal',
      native: {
        fontSize: 14,
        lineHeight: 18,
      }
    },
    label: {
      web: 'text-sm font-medium leading-none',
      native: {
        fontSize: 14,
        fontWeight: '500',
        lineHeight: 16,
      }
    }
  },
  sizes: {
    xs: {
      web: 'text-xs',
      native: { fontSize: 12 }
    },
    sm: {
      web: 'text-sm',
      native: { fontSize: 14 }
    },
    md: {
      web: 'text-base',
      native: { fontSize: 16 }
    },
    lg: {
      web: 'text-lg',
      native: { fontSize: 18 }
    },
    xl: {
      web: 'text-xl',
      native: { fontSize: 20 }
    },
    '2xl': {
      web: 'text-2xl',
      native: { fontSize: 24 }
    },
    '3xl': {
      web: 'text-3xl',
      native: { fontSize: 30 }
    }
  },
  weights: {
    normal: {
      web: 'font-normal',
      native: { fontWeight: '400' }
    },
    medium: {
      web: 'font-medium',
      native: { fontWeight: '500' }
    },
    semibold: {
      web: 'font-semibold',
      native: { fontWeight: '600' }
    },
    bold: {
      web: 'font-bold',
      native: { fontWeight: '700' }
    }
  },
  colors: {
    primary: {
      web: 'text-gray-900',
      native: { color: '#111827' }
    },
    secondary: {
      web: 'text-gray-600',
      native: { color: '#6b7280' }
    },
    muted: {
      web: 'text-gray-500',
      native: { color: '#9ca3af' }
    },
    error: {
      web: 'text-red-600',
      native: { color: '#dc2626' }
    },
    success: {
      web: 'text-green-600',
      native: { color: '#059669' }
    },
    warning: {
      web: 'text-yellow-600',
      native: { color: '#d97706' }
    }
  },
  align: {
    left: {
      web: 'text-left',
      native: { textAlign: 'left' }
    },
    center: {
      web: 'text-center',
      native: { textAlign: 'center' }
    },
    right: {
      web: 'text-right',
      native: { textAlign: 'right' }
    },
    justify: {
      web: 'text-justify',
      native: { textAlign: 'justify' }
    }
  },
  decorations: {
    italic: {
      web: 'italic',
      native: { fontStyle: 'italic' }
    },
    underline: {
      web: 'underline',
      native: { textDecorationLine: 'underline' }
    },
    strikethrough: {
      web: 'line-through',
      native: { textDecorationLine: 'line-through' }
    }
  }
}

// Utility function to create text styles
export const createTextStyle = (
  variant: 'body' | 'heading' | 'subheading' | 'caption' | 'label' = 'body',
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl',
  weight?: 'normal' | 'medium' | 'semibold' | 'bold',
  color: 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'warning' = 'primary',
  align?: 'left' | 'center' | 'right' | 'justify',
  decorations?: {
    italic?: boolean
    underline?: boolean
    strikethrough?: boolean
  }
) => {
  const theme = textTheme
  
  if (isWeb) {
    // Web: Return className string
    const variantClasses = theme.variants[variant].web
    const sizeClasses = size ? theme.sizes[size].web : ''
    const weightClasses = weight ? theme.weights[weight].web : ''
    const colorClasses = theme.colors[color].web
    const alignClasses = align ? theme.align[align].web : ''
    const italicClasses = decorations?.italic ? theme.decorations.italic.web : ''
    const underlineClasses = decorations?.underline ? theme.decorations.underline.web : ''
    const strikethroughClasses = decorations?.strikethrough ? theme.decorations.strikethrough.web : ''
    
    return `${variantClasses} ${sizeClasses} ${weightClasses} ${colorClasses} ${alignClasses} ${italicClasses} ${underlineClasses} ${strikethroughClasses}`.trim()
  } else {
    // React Native: Return style object
    const variantStyle = theme.variants[variant].native
    const sizeStyle = size ? theme.sizes[size].native : {}
    const weightStyle = weight ? theme.weights[weight].native : {}
    const colorStyle = theme.colors[color].native
    const alignStyle = align ? theme.align[align].native : {}
    const italicStyle = decorations?.italic ? theme.decorations.italic.native : {}
    const underlineStyle = decorations?.underline ? theme.decorations.underline.native : {}
    const strikethroughStyle = decorations?.strikethrough ? theme.decorations.strikethrough.native : {}
    
    return {
      ...variantStyle,
      ...sizeStyle,
      ...weightStyle,
      ...colorStyle,
      ...alignStyle,
      ...italicStyle,
      ...underlineStyle,
      ...strikethroughStyle,
    }
  }
}

const UnifiedText = React.forwardRef<any, CrossPlatformTextProps>(
  (
    {
      children,
      variant = 'body',
      size,
      weight,
      color = 'primary',
      align,
      italic = false,
      underline = false,
      strikethrough = false,
      numberOfLines,
      selectable = true,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      testID,
      className,
      style,
      as = 'span',
      ...props
    },
    ref
  ) => {
    // Create styles
    const textStyle = createTextStyle(
      variant,
      size,
      weight,
      color,
      align,
      { italic, underline, strikethrough }
    )
    
    // Accessibility props
    const accessibilityProps = {
      accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
      accessibilityHint,
      accessibilityRole: accessibilityRole || 'text',
      accessible: true,
    }

    if (isWeb) {
      // Web implementation
      const Component = as
      
      return (
        <Component
          ref={ref}
          className={`${textStyle} ${className || ''}`.trim()}
          style={style}
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
      return (
        <Text
          ref={ref}
          style={[textStyle, style]}
          numberOfLines={numberOfLines}
          selectable={selectable}
          testID={testID}
          {...accessibilityProps}
          {...props}
        >
          {children}
        </Text>
      )
    }
  }
)

UnifiedText.displayName = 'CrossPlatformText'

export { UnifiedText as Text }
export type { CrossPlatformTextProps as TextProps }