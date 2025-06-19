/**
 * Unified Cross-Platform Input Component
 * 
 * This component provides a unified TextInput interface that works across
 * both web (React) and mobile (React Native) platforms.
 */

import React from 'react'
import { isWeb } from './button-cross-platform'

// Cross-platform types
export interface CrossPlatformInputProps {
  value?: string
  placeholder?: string
  onChangeText?: (text: string) => void
  onBlur?: () => void
  onFocus?: () => void
  disabled?: boolean
  error?: string
  label?: string
  description?: string
  required?: boolean
  multiline?: boolean
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url'
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoComplete?: string
  autoCorrect?: boolean
  maxLength?: number
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityHint?: string
  testID?: string
  
  // Platform-specific props
  className?: string // Web only
  style?: any // React Native style object
  
  // Web-specific
  type?: string
  name?: string
  id?: string
  
  // Variant and size
  variant?: 'default' | 'error' | 'success'
  size?: 'default' | 'sm' | 'lg'
}

// Platform-specific imports
let TextInput: any
let Text: any
let View: any

if (!isWeb) {
  try {
    const RN = require('react-native')
    TextInput = RN.TextInput
    Text = RN.Text
    View = RN.View
  } catch (e) {
    // Fallback for when React Native is not available
    TextInput = 'input'
    Text = 'span'
    View = 'div'
  }
}

// Theme configuration for cross-platform styling
export const inputTheme = {
  variants: {
    default: {
      web: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      native: {
        borderColor: '#d1d5db',
        focusedBorderColor: '#3b82f6',
      }
    },
    error: {
      web: 'border-red-500 focus:border-red-500 focus:ring-red-500',
      native: {
        borderColor: '#ef4444',
        focusedBorderColor: '#ef4444',
      }
    },
    success: {
      web: 'border-green-500 focus:border-green-500 focus:ring-green-500',
      native: {
        borderColor: '#22c55e',
        focusedBorderColor: '#22c55e',
      }
    }
  },
  sizes: {
    default: {
      web: 'h-10 px-3 py-2 text-sm',
      native: {
        height: 40,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
      }
    },
    sm: {
      web: 'h-9 px-3 py-2 text-xs',
      native: {
        height: 36,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 12,
      }
    },
    lg: {
      web: 'h-11 px-4 py-3 text-base',
      native: {
        height: 44,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
      }
    }
  },
  base: {
    web: 'w-full rounded-md border bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    native: {
      borderWidth: 1,
      borderRadius: 6,
      backgroundColor: '#ffffff',
      color: '#000000',
    }
  },
  label: {
    web: 'block text-sm font-medium text-gray-700 mb-1',
    native: {
      fontSize: 14,
      fontWeight: '500',
      color: '#374151',
      marginBottom: 4,
    }
  },
  description: {
    web: 'text-sm text-gray-600 mb-1',
    native: {
      fontSize: 12,
      color: '#6b7280',
      marginBottom: 4,
    }
  },
  error: {
    web: 'text-sm text-red-600 mt-1',
    native: {
      fontSize: 12,
      color: '#dc2626',
      marginTop: 4,
    }
  }
}

// Utility function to create input styles
export const createInputStyle = (
  variant: 'default' | 'error' | 'success' = 'default',
  size: 'default' | 'sm' | 'lg' = 'default',
  disabled?: boolean,
  multiline?: boolean
) => {
  const theme = inputTheme
  
  if (isWeb) {
    // Web: Return className string
    const baseClasses = theme.base.web
    const variantClasses = theme.variants[variant].web
    const sizeClasses = theme.sizes[size].web
    const multilineClasses = multiline ? 'resize-y min-h-[80px]' : ''
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : ''
    
    return `${baseClasses} ${variantClasses} ${sizeClasses} ${multilineClasses} ${disabledClasses}`.trim()
  } else {
    // React Native: Return style object
    const baseStyle = theme.base.native
    const variantStyle = theme.variants[variant].native
    const sizeStyle = theme.sizes[size].native
    const multilineStyle = multiline ? { minHeight: 80, textAlignVertical: 'top' } : {}
    const disabledStyle = disabled ? { opacity: 0.5 } : {}
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyle,
      ...multilineStyle,
      ...disabledStyle,
    }
  }
}

const Input = React.forwardRef<any, CrossPlatformInputProps>(
  (
    {
      value,
      placeholder,
      onChangeText,
      onBlur,
      onFocus,
      disabled = false,
      error,
      label,
      description,
      required = false,
      multiline = false,
      secureTextEntry = false,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      autoComplete,
      autoCorrect = true,
      maxLength,
      accessibilityLabel,
      accessibilityHint,
      testID,
      className,
      style,
      type = 'text',
      name,
      id,
      variant = 'default',
      size = 'default',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const inputId = id || React.useId()
    
    // Create styles
    const inputStyle = createInputStyle(error ? 'error' : variant, size, disabled, multiline)
    
    // Handle change events
    const handleChange = (textOrEvent: string | React.ChangeEvent<HTMLInputElement>) => {
      if (isWeb) {
        // Web: event object
        const event = textOrEvent as React.ChangeEvent<HTMLInputElement>
        onChangeText?.(event.target.value)
      } else {
        // React Native: direct text
        onChangeText?.(textOrEvent as string)
      }
    }

    const handleFocus = () => {
      setIsFocused(true)
      onFocus?.()
    }

    const handleBlur = () => {
      setIsFocused(false)
      onBlur?.()
    }

    // Map keyboardType to web input type
    const getWebInputType = () => {
      if (secureTextEntry) return 'password'
      switch (keyboardType) {
        case 'email-address': return 'email'
        case 'numeric': return 'number'
        case 'phone-pad': return 'tel'
        case 'url': return 'url'
        default: return type
      }
    }

    if (isWeb) {
      // Web implementation
      const webInputType = multiline ? undefined : getWebInputType()
      const InputComponent = multiline ? 'textarea' : 'input'
      
      return (
        <div className="space-y-1">
          {label && (
            <label
              htmlFor={inputId}
              className={inputTheme.label.web}
            >
              {label}
              {required && (
                <span className="text-red-500 ml-1" aria-label="required">
                  *
                </span>
              )}
            </label>
          )}
          
          {description && (
            <p className={inputTheme.description.web}>
              {description}
            </p>
          )}
          
          <InputComponent
            ref={ref}
            id={inputId}
            name={name}
            type={webInputType}
            value={value}
            placeholder={placeholder}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            className={`${inputStyle} ${className || ''}`.trim()}
            style={style}
            data-testid={testID}
            aria-label={accessibilityLabel}
            aria-describedby={accessibilityHint}
            aria-invalid={!!error}
            {...props}
          />
          
          {error && (
            <p className={inputTheme.error.web} role="alert">
              {error}
            </p>
          )}
        </div>
      )
    } else {
      // React Native implementation
      return (
        <View>
          {label && (
            <Text style={inputTheme.label.native}>
              {label}
              {required && <Text style={{ color: '#dc2626' }}> *</Text>}
            </Text>
          )}
          
          {description && (
            <Text style={inputTheme.description.native}>
              {description}
            </Text>
          )}
          
          <TextInput
            ref={ref}
            value={value}
            placeholder={placeholder}
            onChangeText={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            multiline={multiline}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoCorrect={autoCorrect}
            maxLength={maxLength}
            style={[inputStyle, style]}
            testID={testID}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            {...props}
          />
          
          {error && (
            <Text style={inputTheme.error.native}>
              {error}
            </Text>
          )}
        </View>
      )
    }
  }
)

Input.displayName = 'CrossPlatformInput'

export { Input }
export type { CrossPlatformInputProps as InputProps }