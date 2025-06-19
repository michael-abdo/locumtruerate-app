/**
 * Platform-Specific Components
 * 
 * Components optimized for iOS and Android platforms
 */

import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Vibration,
  HapticFeedback
} from 'react-native'
import * as Haptics from 'expo-haptics'

// Platform-specific button with haptic feedback
interface PlatformButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  style?: any
}

export function PlatformButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style
}: PlatformButtonProps) {
  const handlePress = async () => {
    // Platform-specific haptic feedback
    if (Platform.OS === 'ios') {
      // iOS Haptic Feedback
      switch (variant) {
        case 'primary':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'secondary':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'destructive':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
          break
      }
    } else if (Platform.OS === 'android') {
      // Android Vibration
      if (variant === 'destructive') {
        Vibration.vibrate([0, 50, 50, 50]) // Pattern for destructive
      } else {
        Vibration.vibrate(50) // Simple vibration
      }
    }

    onPress()
  }

  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`${size}Button`]]
    
    if (Platform.OS === 'ios') {
      baseStyle.push(styles.iosButton)
    } else {
      baseStyle.push(styles.androidButton)
    }

    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton)
        break
      case 'secondary':
        baseStyle.push(styles.secondaryButton)
        break
      case 'destructive':
        baseStyle.push(styles.destructiveButton)
        break
    }

    if (disabled) {
      baseStyle.push(styles.disabledButton)
    }

    return baseStyle
  }

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`${size}Text`]]
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText)
        break
      case 'secondary':
        baseStyle.push(styles.secondaryText)
        break
      case 'destructive':
        baseStyle.push(styles.destructiveText)
        break
    }

    if (disabled) {
      baseStyle.push(styles.disabledText)
    }

    return baseStyle
  }

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={Platform.OS === 'ios' ? 0.8 : 0.6}
    >
      <Text style={getTextStyle()}>{title}</Text>
    </TouchableOpacity>
  )
}

// Platform-specific card component
interface PlatformCardProps {
  children: React.ReactNode
  elevated?: boolean
  style?: any
}

export function PlatformCard({ children, elevated = true, style }: PlatformCardProps) {
  const cardStyle = [
    styles.card,
    Platform.OS === 'ios' ? styles.iosCard : styles.androidCard,
    elevated && (Platform.OS === 'ios' ? styles.iosElevated : styles.androidElevated),
    style
  ]

  return <View style={cardStyle}>{children}</View>
}

// Platform-specific input with native styling
interface PlatformInputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  multiline?: boolean
  secureTextEntry?: boolean
  style?: any
}

export function PlatformInput({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  secureTextEntry = false,
  style
}: PlatformInputProps) {
  const inputStyle = [
    styles.input,
    Platform.OS === 'ios' ? styles.iosInput : styles.androidInput,
    multiline && styles.multilineInput,
    style
  ]

  return (
    <Text
      style={inputStyle}
      onChangeText={onChangeText}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={Platform.OS === 'ios' ? '#8e8e93' : '#757575'}
      multiline={multiline}
      secureTextEntry={secureTextEntry}
    />
  )
}

// Platform-specific navigation header
interface PlatformHeaderProps {
  title: string
  leftButton?: {
    title: string
    onPress: () => void
  }
  rightButton?: {
    title: string
    onPress: () => void
  }
}

export function PlatformHeader({ title, leftButton, rightButton }: PlatformHeaderProps) {
  return (
    <View style={[
      styles.header,
      Platform.OS === 'ios' ? styles.iosHeader : styles.androidHeader
    ]}>
      <View style={styles.headerLeft}>
        {leftButton && (
          <TouchableOpacity onPress={leftButton.onPress}>
            <Text style={[
              styles.headerButton,
              Platform.OS === 'ios' ? styles.iosHeaderButton : styles.androidHeaderButton
            ]}>
              {leftButton.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.headerCenter}>
        <Text style={[
          styles.headerTitle,
          Platform.OS === 'ios' ? styles.iosHeaderTitle : styles.androidHeaderTitle
        ]}>
          {title}
        </Text>
      </View>
      
      <View style={styles.headerRight}>
        {rightButton && (
          <TouchableOpacity onPress={rightButton.onPress}>
            <Text style={[
              styles.headerButton,
              Platform.OS === 'ios' ? styles.iosHeaderButton : styles.androidHeaderButton
            ]}>
              {rightButton.title}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// Platform-specific list item
interface PlatformListItemProps {
  title: string
  subtitle?: string
  rightElement?: React.ReactNode
  onPress?: () => void
  style?: any
}

export function PlatformListItem({
  title,
  subtitle,
  rightElement,
  onPress,
  style
}: PlatformListItemProps) {
  const listItemStyle = [
    styles.listItem,
    Platform.OS === 'ios' ? styles.iosListItem : styles.androidListItem,
    style
  ]

  const content = (
    <View style={listItemStyle}>
      <View style={styles.listItemContent}>
        <Text style={[
          styles.listItemTitle,
          Platform.OS === 'ios' ? styles.iosListItemTitle : styles.androidListItemTitle
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.listItemSubtitle,
            Platform.OS === 'ios' ? styles.iosListItemSubtitle : styles.androidListItemSubtitle
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View style={styles.listItemRight}>
          {rightElement}
        </View>
      )}
    </View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

// Utility function for platform-specific haptics
export const triggerHaptic = {
  light: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } else {
      Vibration.vibrate(25)
    }
  },
  medium: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    } else {
      Vibration.vibrate(50)
    }
  },
  heavy: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    } else {
      Vibration.vibrate(75)
    }
  },
  success: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Vibration.vibrate([0, 50, 50, 50])
    }
  },
  warning: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    } else {
      Vibration.vibrate([0, 100, 50, 100])
    }
  },
  error: async () => {
    if (Platform.OS === 'ios') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } else {
      Vibration.vibrate([0, 100, 50, 100, 50, 100])
    }
  }
}

const styles = StyleSheet.create({
  // Button styles
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  mediumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 44,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    minHeight: 52,
  },
  iosButton: {
    borderRadius: 10,
  },
  androidButton: {
    borderRadius: 6,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  destructiveButton: {
    backgroundColor: '#dc2626',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  buttonText: {
    fontWeight: '600',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: '#ffffff',
  },
  secondaryText: {
    color: '#2563eb',
  },
  destructiveText: {
    color: '#ffffff',
  },
  disabledText: {
    color: '#94a3b8',
  },

  // Card styles
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
  },
  iosCard: {
    borderRadius: 12,
  },
  androidCard: {
    borderRadius: 8,
  },
  iosElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  androidElevated: {
    elevation: 4,
  },

  // Input styles
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  iosInput: {
    borderRadius: 10,
    borderColor: '#d1d5db',
  },
  androidInput: {
    borderRadius: 6,
    borderColor: '#e5e7eb',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  iosHeader: {
    height: 44,
    paddingVertical: 0,
  },
  androidHeader: {
    height: 56,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontWeight: '600',
  },
  iosHeaderTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  androidHeaderTitle: {
    fontSize: 20,
    fontWeight: '500',
  },
  headerButton: {
    fontWeight: '500',
  },
  iosHeaderButton: {
    fontSize: 17,
    color: '#007AFF',
  },
  androidHeaderButton: {
    fontSize: 14,
    color: '#2563eb',
    textTransform: 'uppercase',
  },

  // List item styles
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  iosListItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  androidListItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    color: '#1e293b',
  },
  iosListItemTitle: {
    fontSize: 17,
    fontWeight: '400',
  },
  androidListItemTitle: {
    fontSize: 16,
    fontWeight: '400',
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  iosListItemSubtitle: {
    fontSize: 15,
  },
  androidListItemSubtitle: {
    fontSize: 14,
  },
  listItemRight: {
    marginLeft: 16,
  },
})