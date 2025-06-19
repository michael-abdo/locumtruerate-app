'use client'

import React from 'react'
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native'

interface CrossPlatformButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
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
  
  // Base styles that work on both platforms
  const baseStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: variant === 'outline' ? 1 : 0,
    opacity: disabled ? 0.5 : 1,
  }
  
  // Variant-specific styles
  const variantStyles: Record<string, ViewStyle> = {
    primary: {
      backgroundColor: '#2563eb', // blue-600
      borderColor: 'transparent',
    },
    secondary: {
      backgroundColor: '#4b5563', // gray-600  
      borderColor: 'transparent',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#d1d5db', // gray-300
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  }
  
  // Size-specific styles
  const sizeStyles: Record<string, ViewStyle> = {
    sm: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      minHeight: 32,
    },
    md: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      minHeight: 36,
    },
    lg: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      minHeight: 44,
    },
  }

  // Text styles for different variants
  const textStyles: Record<string, TextStyle> = {
    primary: {
      color: '#ffffff',
      fontWeight: '500',
    },
    secondary: {
      color: '#ffffff', 
      fontWeight: '500',
    },
    outline: {
      color: '#374151', // gray-700
      fontWeight: '500',
    },
    ghost: {
      color: '#374151', // gray-700
      fontWeight: '500',
    },
  }

  const buttonStyle = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    style, // Allow custom style override
  ]

  const textStyle = [
    styles.text,
    textStyles[variant],
    sizeStyles[size].fontSize ? { fontSize: sizeStyles[size].fontSize } : {},
  ]

  return (
    <Pressable
      style={({ pressed }) => [
        ...buttonStyle,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      {typeof children === 'string' ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
})