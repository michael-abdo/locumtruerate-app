'use client'

import React from 'react'

// Cross-platform interface - no web-specific attributes
interface CrossPlatformButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onPress?: () => void  // React Native pattern
  disabled?: boolean
  style?: React.CSSProperties  // Web fallback that would be ViewStyle in RN
  testID?: string
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  onPress,
  disabled = false,
  style,
  testID,
}: CrossPlatformButtonProps) {
  
  // StyleSheet-like object approach (works in both web and RN)
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    fontWeight: '500',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
  }
  
  // Variant-specific styles as objects
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#2563eb', // blue-600
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#4b5563', // gray-600
      color: '#ffffff',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#374151', // gray-700
      border: '1px solid #d1d5db', // gray-300
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#374151', // gray-700
    },
  }
  
  // Size-specific styles as objects
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '6px 12px',
      fontSize: '14px',
    },
    md: {
      padding: '8px 16px', 
      fontSize: '14px',
    },
    lg: {
      padding: '12px 24px',
      fontSize: '16px',
    },
  }

  // Combine styles using object spread (cross-platform pattern)
  const combinedStyles: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style, // Allow custom style override
  }

  // Use div instead of button for cross-platform compatibility
  // In React Native, this would be a Pressable
  return (
    <div
      style={combinedStyles}
      onClick={onPress}  // Web implementation of onPress
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      data-testid={testID}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onPress && !disabled) {
          e.preventDefault()
          onPress()
        }
      }}
    >
      {children}
    </div>
  )
}