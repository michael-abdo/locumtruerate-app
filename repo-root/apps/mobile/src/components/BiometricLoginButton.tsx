/**
 * Biometric Login Button Component
 * 
 * Button for biometric authentication with appropriate icon
 */

import React from 'react'
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform
} from 'react-native'
import { useAuth } from '../lib/auth'

interface BiometricLoginButtonProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  style?: any
  textStyle?: any
}

export function BiometricLoginButton({
  onSuccess,
  onError,
  style,
  textStyle
}: BiometricLoginButtonProps) {
  const { 
    biometricAvailable, 
    biometricType, 
    loginWithBiometric,
    isLoading 
  } = useAuth()

  if (!biometricAvailable) {
    return null
  }

  const handlePress = async () => {
    const result = await loginWithBiometric()
    
    if (result.success) {
      onSuccess?.()
    } else {
      onError?.(result.error || 'Biometric authentication failed')
    }
  }

  const getIcon = () => {
    if (biometricType.includes('Face')) {
      return '👤' // Face ID
    } else if (biometricType.includes('Touch') || biometricType.includes('Fingerprint')) {
      return '👆' // Touch ID / Fingerprint
    }
    return '🔐' // Generic biometric
  }

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#ffffff" />
      ) : (
        <>
          <Text style={[styles.icon, textStyle]}>{getIcon()}</Text>
          <Text style={[styles.text, textStyle]}>
            Login with {biometricType}
          </Text>
        </>
      )}
    </TouchableOpacity>
  )
}

// Standalone biometric setup button
export function BiometricSetupButton({
  onComplete,
  style
}: {
  onComplete?: (success: boolean) => void
  style?: any
}) {
  const { 
    biometricAvailable, 
    biometricEnabled,
    biometricType,
    enableBiometric,
    disableBiometric 
  } = useAuth()

  const [isLoading, setIsLoading] = React.useState(false)

  if (!biometricAvailable) {
    return null
  }

  const handleToggle = async () => {
    setIsLoading(true)
    try {
      const success = biometricEnabled 
        ? await disableBiometric()
        : await enableBiometric()
      
      onComplete?.(success)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <TouchableOpacity
      style={[styles.setupButton, style]}
      onPress={handleToggle}
      disabled={isLoading}
    >
      <Text style={styles.setupIcon}>
        {biometricEnabled ? '✅' : '⚪'}
      </Text>
      <Text style={styles.setupText}>
        {biometricEnabled ? `${biometricType} Enabled` : `Enable ${biometricType}`}
      </Text>
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color="#2563eb" 
          style={styles.setupLoader}
        />
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  setupIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  setupText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  setupLoader: {
    marginLeft: 8,
  },
})