/**
 * Unified Cross-Platform Button Component
 * 
 * This is the main Button component that automatically renders the appropriate
 * platform-specific implementation based on the current platform.
 */

import React from 'react'
import { 
  CrossPlatformButtonProps, 
  createButtonStyle, 
  createTextStyle, 
  LoadingSpinner,
  isWeb 
} from './button-cross-platform'

// Platform-specific imports
let TouchableOpacity: any
let Text: any
let View: any

// Prevent React Native imports in web environments
TouchableOpacity = 'div'
Text = 'span'
View = 'div'

// Only dynamically load React Native in actual React Native environments
if (typeof navigator === 'undefined' && !isWeb) {
  try {
    const RN = require('react-native')
    TouchableOpacity = RN.TouchableOpacity
    Text = RN.Text
    View = RN.View
  } catch (e) {
    // Keep web fallbacks
  }
}

const Button = React.forwardRef<any, CrossPlatformButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'default',
      disabled = false,
      loading = false,
      onPress,
      onLongPress,
      testID,
      accessibilityLabel,
      accessibilityHint,
      accessibilityRole,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // Create platform-appropriate styles
    const buttonStyle = createButtonStyle(variant, size, disabled, loading)
    const textStyle = createTextStyle(variant, size)
    
    // Handle button press
    const handlePress = () => {
      if (!disabled && !loading && onPress) {
        onPress()
      }
    }

    const handleLongPress = () => {
      if (!disabled && !loading && onLongPress) {
        onLongPress()
      }
    }

    // Accessibility props
    const accessibilityProps = {
      accessibilityLabel: accessibilityLabel || (typeof children === 'string' ? children : undefined),
      accessibilityHint,
      accessibilityRole: accessibilityRole || 'button',
      accessible: true,
    }

    if (isWeb) {
      // Web implementation
      return (
        <button
          ref={ref}
          className={`${buttonStyle} ${className || ''}`.trim()}
          style={style}
          disabled={disabled || loading}
          onClick={handlePress}
          onContextMenu={handleLongPress}
          data-testid={testID}
          aria-label={accessibilityLabel}
          aria-describedby={accessibilityHint}
          aria-disabled={disabled || loading}
          aria-busy={loading}
          {...props}
        >
          {loading && <LoadingSpinner />}
          <span className={loading ? 'ml-2' : ''}>
            {children}
          </span>
          {loading && <span className="sr-only">Loading...</span>}
        </button>
      )
    } else {
      // React Native implementation
      return (
        <TouchableOpacity
          ref={ref}
          style={[buttonStyle, style]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          disabled={disabled || loading}
          testID={testID}
          activeOpacity={0.7}
          {...accessibilityProps}
          {...props}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {loading && <LoadingSpinner />}
            <Text style={[textStyle, loading && { marginLeft: 8 }]}>
              {children}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }
  }
)

Button.displayName = 'CrossPlatformButton'

export { Button }
export type { CrossPlatformButtonProps as ButtonProps }

// Re-export utilities for advanced usage
export {
  createButtonStyle,
  createTextStyle,
  buttonTheme,
  isWeb,
  isNative
} from './button-cross-platform'